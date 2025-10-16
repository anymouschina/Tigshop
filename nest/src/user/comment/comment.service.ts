// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService as SettingConfigService } from "src/setting/config.service";
import { OrderService } from "src/order/order.service";

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private readonly settingConfig: SettingConfigService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * 获取评论数量统计
   */
  async getCommentSubNum(userId: number) {
    // 获取待评价数量：已完成订单的订单项里，尚未有主评论(parent_id=0)的数量
    const toCommentCount = await (this.prisma as any)
      .$queryRawUnsafe(
        `SELECT COUNT(*) AS c
       FROM order_item oi
       JOIN \`order\` o ON oi.order_id = o.order_id
       WHERE o.user_id = ? AND o.order_status = 3 AND o.is_del = 0
         AND NOT EXISTS (
           SELECT 1 FROM comment c
           WHERE c.order_id = oi.order_id AND c.order_item_id = oi.item_id AND c.user_id = o.user_id AND c.parent_id = 0
         )`,
        Number(userId),
      )
      .then((rows: any) => Number(rows?.[0]?.c || 0))
      .catch(() => 0);

    // 获取已评价数量（主评论）
    const commentedCount = await this.prisma.comment.count({
      where: { user_id: Number(userId), parent_id: 0 },
    });

    return {
      to_comment_count: toCommentCount,
      commented_count: commentedCount,
    };
  }

  /**
   * 获取晒单列表
   */
  async getShowedList(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 15;
    const skip = (page - 1) * size;
    const isShowed = query.is_showed !== undefined ? query.is_showed : -1;

    const where: any = { user_id: userId };
    if (isShowed !== -1) {
      where.is_showed = isShowed;
    }

    const [comments, total] = await Promise.all([
      (this.prisma as any).comment.findMany({
        where,
        orderBy: { order_id: "desc" },
        skip,
        take: size,
      }),
      (this.prisma as any).comment.count({ where }),
    ]);

    return {
      records: comments,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取已评价列表
   */
  async getCommentList(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 15;
    const skip = (page - 1) * size;

    const [comments, total] = await Promise.all([
      (this.prisma as any).comment.findMany({
        where: { user_id: userId },
        orderBy: { comment_id: "desc" },
        skip,
        take: size,
      }),
      (this.prisma as any).comment.count({ where: { user_id: userId } }),
    ]);

    return {
      records: comments,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 创建商品评价
   */
  async createEvaluate(userId: number, data: any) {
    // 兼容参数命名
    const productId = Number(data.product_id ?? data.productId);
    const orderId = Number(data.order_id ?? data.orderId);
    const orderItemId = Number(data.order_item_id ?? data.orderItemId);
    const commentRank = Number(data.comment_rank ?? data.commentRank ?? 5);
    const commentTag = data.comment_tag ?? data.commentTag ?? [];
    const content = String(data.content ?? "");
    const showPics = data.show_pics ?? data.showPics ?? [];

    if (!orderItemId || !orderId || !productId) {
      throw new HttpException("参数不完整", HttpStatus.BAD_REQUEST);
    }

    // 验证订单项存在且归属用户
    const orderItem = await (this.prisma as any).order_item.findFirst({
      where: {
        item_id: orderItemId,
        order_id: orderId,
        product_id: productId,
        user_id: Number(userId),
      },
    });
    if (!orderItem) {
      throw new HttpException("订单项不存在", HttpStatus.BAD_REQUEST);
    }

    // 检查是否已有主评论
    const existed = await (this.prisma as any).comment.findFirst({
      where: {
        order_id: orderId,
        order_item_id: orderItemId,
        user_id: Number(userId),
        parent_id: 0,
      },
    });

    if (existed) {
      // 已评价：若已有晒单则不允许重复
      const alreadyShowed = Number(existed.is_showed || 0) === 1;
      if (alreadyShowed) {
        throw new HttpException(
          "您已评价完成，不能重复评价",
          HttpStatus.BAD_REQUEST,
        );
      }
      // 未晒单：需要有图片
      if (!Array.isArray(showPics) || showPics.length === 0) {
        throw new HttpException("请上传晒单图片", HttpStatus.BAD_REQUEST);
      }
      await (this.prisma as any).comment.update({
        where: { comment_id: Number(existed.comment_id) },
        data: { show_pics: JSON.stringify(showPics), is_showed: 1 },
      });
      await this.updateProductRating(productId);
      return { success: true };
    }

    // 新增主评论
    await (this.prisma as any).comment.create({
      data: {
        user_id: Number(userId),
        product_id: productId,
        order_id: orderId,
        order_item_id: orderItemId,
        comment_rank: commentRank,
        comment_tag: JSON.stringify(
          Array.isArray(commentTag) ? commentTag : [],
        ),
        content,
        show_pics: JSON.stringify(Array.isArray(showPics) ? showPics : []),
        is_showed: Array.isArray(showPics) && showPics.length > 0 ? 1 : 0,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    await this.updateProductRating(productId);
    return { success: true };
  }

  /**
   * 获取评论详情
   */
  async getCommentDetail(commentId: number, userId?: number) {
    let comment = await (this.prisma as any).comment.findUnique({
      where: { comment_id: commentId },
    });

    // 补充检索逻辑：若按 comment_id 未命中，尝试把 id 视作 order_item_id（对齐部分前端调用）
    if (!comment && Number.isFinite(Number(commentId)) && Number(userId)) {
      // Try treat id as order_item_id
      const byItem = await (this.prisma as any).comment.findFirst({
        where: {
          order_item_id: Number(commentId),
          user_id: Number(userId),
          parent_id: 0,
        },
      });
      if (byItem) comment = byItem;
      // Or treat id as order_id
      if (!comment) {
        const byOrder = await (this.prisma as any).comment.findFirst({
          where: {
            order_id: Number(commentId),
            user_id: Number(userId),
            parent_id: 0,
          },
          orderBy: { comment_id: "desc" },
        });
        if (byOrder) comment = byOrder;
      }
    }

    // 若仍未找到评论，尝试将 id 视为 order_id，返回订单详情结构
    if (!comment && Number.isFinite(Number(commentId)) && Number(userId)) {
      try {
        const orderDetail = await this.orderService.getOrderDetail(
          Number(commentId),
          Number(userId),
        );
        return orderDetail;
      } catch (_) {
        // fall through
      }
    }

    if (!comment) {
      throw new HttpException("评论不存在", HttpStatus.NOT_FOUND);
    }

    // Load replies (simple fields per PHP: comment_id,user_id,username,content,add_time,parent_id)
    const replies = await (this.prisma as any).comment.findMany({
      where: { parent_id: Number(comment.comment_id) },
      select: {
        comment_id: true,
        user_id: true,
        username: true,
        content: true,
        add_time: true,
        parent_id: true,
      },
      orderBy: { comment_id: "asc" },
    });

    // Optional kefu name from config (fallback empty string)
    let kefuName: string = "";
    try {
      const cfg = (await this.settingConfig.getJsonConfig(
        "kefuSetting",
      )) as any;
      if (cfg) {
        // accept either string or object.name
        if (typeof cfg === "string") kefuName = cfg;
        else if (typeof cfg === "object" && cfg.name)
          kefuName = String(cfg.name);
      }
    } catch {}

    // Normalize JSON fields if present
    const parseMaybeJson = (val: any) => {
      if (val == null) return val;
      if (typeof val === "object") return val;
      const s = String(val);
      if (!s) return s;
      try {
        const j = JSON.parse(s);
        return j;
      } catch {
        return val;
      }
    };

    return {
      ...comment,
      comment_tag: parseMaybeJson(comment.comment_tag),
      show_pics: parseMaybeJson(comment.show_pics),
      reply: replies,
      kefu_name: kefuName,
    };
  }

  /**
   * 更新商品评分
   */
  private async updateProductRating(productId: number) {
    // 计算商品平均评分
    const comments = await (this.prisma as any).comment.findMany({
      where: {
        product_id: productId,
        status: 1, // 已审核
      },
      select: { comment_rank: true },
    });

    if (comments.length === 0) {
      return;
    }

    const totalRating = comments.reduce(
      (sum, comment) => sum + comment.comment_rank,
      0,
    );
    const averageRating = totalRating / comments.length;

    // 更新商品评分
    // 产品表未定义评论聚合字段，跳过更新
  }
}
