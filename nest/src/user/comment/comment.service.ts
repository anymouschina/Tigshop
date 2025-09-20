import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取评论数量统计
   */
  async getCommentSubNum(userId: number) {
    // 获取待评价数量
    const toCommentCount = await this.prisma.orderItem.count({
      where: {
        order: {
          user_id: userId,
          order_status: 3, // 已完成
          pay_status: 1, // 已支付
        },
        is_commented: 0, // 未评价
      },
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
      this.prisma.comment.findMany({
        where,
        orderBy: { order_id: 'desc' },
        skip,
        take: size,
        include: {
          product: {
            select: {
              product_id: true,
              product_name: true,
              product_image: true,
            },
          },
          order: {
            select: {
              order_sn: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
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
      this.prisma.comment.findMany({
        where: { user_id: userId },
        orderBy: { comment_id: 'desc' },
        skip,
        take: size,
        include: {
          product: {
            select: {
              product_id: true,
              product_name: true,
              product_image: true,
            },
          },
          order: {
            select: {
              order_sn: true,
              add_time: true,
            },
          },
        },
      }),
      this.prisma.comment.count({
        where: { user_id: userId },
      }),
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
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        order_item_id: data.order_item_id,
        order_id: data.order_id,
        product_id: data.product_id,
        order: {
          user_id: userId,
          order_status: 3, // 已完成
          pay_status: 1, // 已支付
        },
        is_commented: 0, // 未评价
      },
    });

    if (!orderItem) {
      throw new HttpException('订单项不存在或已评价', HttpStatus.BAD_REQUEST);
    }

    // 创建评论
    const comment = await this.prisma.comment.create({
      data: {
        user_id: userId,
        product_id: data.product_id,
        order_id: data.order_id,
        order_item_id: data.order_item_id,
        shop_id: data.shop_id,
        comment_rank: data.comment_rank,
        comment_tag: data.comment_tag || [],
        content: data.content,
        show_pics: data.show_pics || [],
        is_showed: data.show_pics && data.show_pics.length > 0 ? 1 : 0,
        add_time: new Date(),
      },
    });

    // 更新订单项为已评价
    await this.prisma.orderItem.update({
      where: { order_item_id: data.order_item_id },
      data: { is_commented: 1 },
    });

    // 更新商品评分
    await this.updateProductRating(data.product_id);

    return { success: true };
  }

  /**
   * 获取评论详情
   */
  async getCommentDetail(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { comment_id: commentId },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        product: {
          select: {
            product_id: true,
            product_name: true,
            product_image: true,
          },
        },
        order: {
          select: {
            order_sn: true,
            add_time: true,
          },
        },
        replies: {
          orderBy: { reply_id: 'asc' },
          include: {
            user: {
              select: {
                user_id: true,
                username: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND);
    }

    return comment;
  }

  /**
   * 更新商品评分
   */
  private async updateProductRating(productId: number) {
    // 计算商品平均评分
    const comments = await this.prisma.comment.findMany({
      where: {
        product_id: productId,
        status: 1, // 已审核
      },
      select: { comment_rank: true },
    });

    if (comments.length === 0) {
      return;
    }

    const totalRating = comments.reduce((sum, comment) => sum + comment.comment_rank, 0);
    const averageRating = totalRating / comments.length;

    // 更新商品评分
    await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        comment_rank: averageRating,
        comment_number: comments.length,
      },
    });
  }
}