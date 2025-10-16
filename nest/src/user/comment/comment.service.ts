// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService as SettingConfigService } from "src/setting/config.service";

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService, private readonly settingConfig: SettingConfigService) {}

  /**
   * 获取评论数量统计
   */
  async getCommentSubNum(userId: number) {
    // 获取待评价数量
    const toCommentCount = await (this.prisma as any).order_item.count({
      where: { user_id: userId, is_commented: 0 },
    });

    // 获取已评价数量
    const commentedCount = await this.prisma.comment.count({
      where: { user_id: userId },
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
    // 验证订单项
    const orderItem = await (this.prisma as any).order_item.findFirst({
      where: {
        item_id: data.order_item_id,
        order_id: data.order_id,
        product_id: data.product_id,
        user_id: userId,
        is_commented: 0, // 未评价
      },
    });

    if (!orderItem) {
      throw new HttpException("订单项不存在或已评价", HttpStatus.BAD_REQUEST);
    }

    // 创建评论
    const comment = await (this.prisma as any).comment.create({
      data: {
        user_id: userId,
        product_id: data.product_id,
        order_id: data.order_id,
        order_item_id: data.order_item_id,
        comment_rank: data.comment_rank,
        comment_tag: JSON.stringify(data.comment_tag || []),
        content: data.content,
        show_pics: JSON.stringify(data.show_pics || []),
        is_showed: data.show_pics && data.show_pics.length > 0 ? 1 : 0,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 更新订单项为已评价
    await (this.prisma as any).order_item.update({
      where: { item_id: data.order_item_id },
      data: { is_commented: 1 },
    });

    // 更新商品评分
    await this.updateProductRating(data.product_id);

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
        where: { order_item_id: Number(commentId), user_id: Number(userId), parent_id: 0 },
      });
      if (byItem) comment = byItem;
      // Or treat id as order_id
      if (!comment) {
        const byOrder = await (this.prisma as any).comment.findFirst({
          where: { order_id: Number(commentId), user_id: Number(userId), parent_id: 0 },
          orderBy: { comment_id: 'desc' },
        });
        if (byOrder) comment = byOrder;
      }
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
      const cfg = (await this.settingConfig.getJsonConfig("kefuSetting")) as any;
      if (cfg) {
        // accept either string or object.name
        if (typeof cfg === "string") kefuName = cfg;
        else if (typeof cfg === "object" && cfg.name) kefuName = String(cfg.name);
      }
    } catch {}

    // Normalize JSON fields if present
    const parseMaybeJson = (val: any) => {
      if (val == null) return val;
      if (typeof val === "object") return val;
      const s = String(val);
      if (!s) return s;
      try { const j = JSON.parse(s); return j; } catch { return val; }
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
