// @ts-nocheck
import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto, CommentQueryDto, ReplyCommentDto } from './dto/user-comment.dto';

@Injectable()
export class UserCommentService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(userId: number, createDto: CreateCommentDto) {
    const { product_id, order_id, order_item_id, spec_value_id, score, content, images, comment_type } = createDto;

    // 检查订单是否存在且属于当前用户
    const order = await this.prisma.order.findFirst({
      where: {
        order_id,
        user_id: userId,
        order_status: 4, // 已完成
      },
    });

    if (!order) {
      throw new ForbiddenException('订单不存在或未完成，无法评价');
    }

    // 检查订单项是否已评价
    if (order_item_id) {
      const existingComment = await this.prisma.comment.findFirst({
        where: { order_item_id },
      });
      if (existingComment) {
        throw new ConflictException('该订单项已评价');
      }
    }

    // 检查商品是否存在
    const product = await this.prisma.product.findUnique({
      where: { product_id },
    });
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // 创建评价
    const comment = await this.prisma.comment.create({
      data: {
        user_id: userId,
        product_id,
        order_id,
        order_item_id,
        spec_value_id,
        score,
        content,
        images: images || [],
        comment_type,
        status: 1, // 待审核
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 更新商品评分
    await this.updateProductScore(product_id);

    return { comment_id: comment.id };
  }

  async getCommentList(queryDto: CommentQueryDto) {
    const { page = 1, size = 10, product_id, comment_type, filter_type, sort_type } = queryDto;
    const skip = (page - 1) * size;

    const where: any = { status: 1 }; // 已审核通过

    if (product_id) {
      where.product_id = product_id;
    }

    if (comment_type) {
      where.comment_type = comment_type;
    }

    // 过滤类型
    if (filter_type === 'with_image') {
      where.images = { not: [] };
    } else if (filter_type === 'with_content') {
      where.content = { not: null };
    }

    // 排序
    let orderBy: any = { add_time: 'desc' };
    if (sort_type === 'hottest') {
      orderBy = { like_count: 'desc' };
    } else if (sort_type === 'highest_score') {
      orderBy = { score: 'desc' };
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: size,
        orderBy,
        select: {
          id: true,
          user_id: true,
          product_id: true,
          score: true,
          content: true,
          images: true,
          comment_type: true,
          like_count: true,
          reply_count: true,
          add_time: true,
          user: {
            select: {
              username: true,
              nickname: true,
              avatar: true,
            },
          },
          replies: {
            take: 3, // 只取前3条回复
            orderBy: { add_time: 'desc' },
            select: {
              id: true,
              reply_content: true,
              add_time: true,
              admin_user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    // 统计评分分布
    let scoreStats = null;
    if (product_id) {
      scoreStats = await this.getScoreStats(product_id);
    }

    return {
      list: comments,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
      score_stats: scoreStats,
    };
  }

  async getUserCommentList(userId: number, queryDto: CommentQueryDto) {
    const { page = 1, size = 10 } = queryDto;
    const skip = (page - 1) * size;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { user_id: userId },
        skip,
        take: size,
        orderBy: { add_time: 'desc' },
        select: {
          id: true,
          product_id: true,
          score: true,
          content: true,
          images: true,
          comment_type: true,
          status: true,
          add_time: true,
          product: {
            select: {
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
      this.prisma.comment.count({ where: { user_id: userId } }),
    ]);

    return {
      list: comments,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getCommentDetail(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        user_id: true,
        product_id: true,
        order_id: true,
        score: true,
        content: true,
        images: true,
        comment_type: true,
        like_count: true,
        reply_count: true,
        add_time: true,
        user: {
          select: {
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        product: {
          select: {
            product_name: true,
            product_image: true,
          },
        },
        replies: {
          orderBy: { add_time: 'desc' },
          select: {
            id: true,
            reply_content: true,
            add_time: true,
            admin_user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  async replyComment(userId: number, replyDto: ReplyCommentDto) {
    const { comment_id, reply_content } = replyDto;

    // 检查评论是否存在且属于当前用户
    const comment = await this.prisma.comment.findUnique({
      where: { id: comment_id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('只能回复自己的评论');
    }

    // 创建回复
    const reply = await this.prisma.comment_reply.create({
      data: {
        comment_id,
        user_id: userId,
        reply_content,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    // 更新评论回复数
    await this.prisma.comment.update({
      where: { id: comment_id },
      data: { reply_count: { increment: 1 } },
    });

    return { reply_id: reply.id };
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // 更新商品评分
    await this.updateProductScore(comment.product_id);

    return { success: true };
  }

  async likeComment(userId: number, commentId: number) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查是否已点赞
    const existingLike = await this.prisma.comment_like.findFirst({
      where: {
        user_id: userId,
        comment_id: commentId,
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.comment_like.delete({
        where: { id: existingLike.id },
      });

      await this.prisma.comment.update({
        where: { id: commentId },
        data: { like_count: { decrement: 1 } },
      });

      return { liked: false };
    } else {
      // 点赞
      await this.prisma.comment_like.create({
        data: {
          user_id: userId,
          comment_id: commentId,
          add_time: Math.floor(Date.now() / 1000),
        },
      });

      await this.prisma.comment.update({
        where: { id: commentId },
        data: { like_count: { increment: 1 } },
      });

      return { liked: true };
    }
  }

  async getUncommentedOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: {
        user_id: userId,
        order_status: 4, // 已完成
        is_commented: 0, // 未评价
      },
      select: {
        order_id: true,
        order_sn: true,
        add_time: true,
        order_items: {
          select: {
            item_id: true,
            product_id: true,
            product_name: true,
            product_image: true,
            spec_value_name: true,
            is_commented: true,
          },
        },
      },
    });

    // 过滤出未评价的订单项
    const uncommentedOrders = orders.map(order => ({
      ...order,
      order_items: order.order_items.filter(item => !item.is_commented),
    })).filter(order => order.order_items.length > 0);

    return uncommentedOrders;
  }

  private async updateProductScore(productId: number) {
    // 计算商品平均评分
    const stats = await this.prisma.comment.aggregate({
      where: {
        product_id: productId,
        status: 1, // 已审核通过
      },
      _avg: { score: true },
      _count: true,
    });

    const avgScore = stats._avg.score || 0;
    const commentCount = stats._count;

    await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        comment_score: avgScore,
        comment_count: commentCount,
      },
    });
  }

  private async getScoreStats(productId: number) {
    const stats = await this.prisma.comment.groupBy({
      by: ['score'],
      where: {
        product_id: productId,
        status: 1,
      },
      _count: true,
    });

    const scoreStats = {
      total: 0,
      distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    };

    stats.forEach(stat => {
      const score = stat.score.toString();
      scoreStats.distribution[score] = stat._count;
      scoreStats.total += stat._count;
    });

    // 计算百分比
    Object.keys(scoreStats.distribution).forEach(score => {
      scoreStats.distribution[score] = scoreStats.total > 0
        ? Math.round((scoreStats.distribution[score] / scoreStats.total) * 100)
        : 0;
    });

    return scoreStats;
  }
}
