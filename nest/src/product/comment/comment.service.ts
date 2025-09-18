import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  GetCommentsDto,
  CommentReplyDto,
  CommentStatus,
  CommentRating,
} from './dto/comment.dto';

export interface CommentResponse {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: CommentRating;
  content: string;
  images?: string;
  orderSn?: string;
  replyId?: number;
  replyContent?: string;
  replyTime?: string;
  status: CommentStatus;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentStatsResponse {
  averageRating: number;
  totalComments: number;
  ratingDistribution: {
    rating: CommentRating;
    count: number;
    percentage: number;
  }[];
}

@Injectable()
export class CommentService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 创建评论 - 对齐PHP版本 product/comment/create
   */
  async createComment(userId: number, createCommentDto: CreateCommentDto): Promise<CommentResponse> {
    const { productId, rating, content, images, orderSn, replyId, replyContent } = createCommentDto;

    // 检查产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    // 如果指定了订单，检查订单是否存在且属于该用户
    if (orderSn) {
      const order = await this.prisma.order.findFirst({
        where: {
          orderSn,
          userId,
        },
      });

      if (!order) {
        throw new BadRequestException('订单不存在或无权限');
      }

      // 检查订单中是否包含该产品
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          orderId: order.id,
          productId,
        },
      });

      if (!orderItem) {
        throw new BadRequestException('订单中不包含该产品');
      }
    }

    // 如果是回复评论，检查原评论是否存在
    if (replyId) {
      const originalComment = await this.prisma.comment.findFirst({
        where: { id: replyId },
      });

      if (!originalComment) {
        throw new NotFoundException('原评论不存在');
      }
    }

    // 创建评论
    const comment = await this.prisma.$queryRaw`
      INSERT INTO "Comment" ("productId", "userId", "rating", content, images, "orderSn", "replyId", "replyContent", "replyTime", status, likes, "isLiked", "createdAt", "updatedAt")
      VALUES (${productId}, ${userId}, ${rating}, ${content}, ${images || null}, ${orderSn || null}, ${replyId || null}, ${replyContent || null}, ${replyContent ? 'NOW()' : null}, ${CommentStatus.PENDING}, 0, false, NOW(), NOW())
      RETURNING *
    ` as any[];

    return this.formatCommentResponse(comment[0]);
  }

  /**
   * 获取评论列表 - 对齐PHP版本 product/comment/getCommentList
   */
  async getComments(query: GetCommentsDto) {
    const { productId, userId, status, rating, page = 1, size = 10 } = query;
    const skip = (page - 1) * size;

    const whereClause: any = {};
    if (productId) whereClause.productId = productId;
    if (userId) whereClause.userId = userId;
    if (status) whereClause.status = status;
    if (rating) whereClause.rating = rating;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.comment.count({
        where: whereClause,
      }),
    ]);

    return {
      list: comments.map(comment => this.formatCommentResponse(comment)),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取评论详情 - 对齐PHP版本 product/comment/getComment
   */
  async getCommentDetail(commentId: number): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return this.formatCommentResponse(comment);
  }

  /**
   * 更新评论 - 对齐PHP版本 product/comment/update
   */
  async updateComment(commentId: number, userId: number, updateCommentDto: UpdateCommentDto): Promise<CommentResponse> {
    // 检查评论是否存在且属于该用户
    const existingComment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        userId,
      },
    });

    if (!existingComment) {
      throw new NotFoundException('评论不存在或无权限');
    }

    // 更新评论
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return this.formatCommentResponse(updatedComment);
  }

  /**
   * 删除评论 - 对齐PHP版本 product/comment/delete
   */
  async deleteComment(commentId: number, userId: number) {
    // 检查评论是否存在且属于该用户
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        userId,
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在或无权限');
    }

    // 删除评论
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: '评论删除成功' };
  }

  /**
   * 点赞评论 - 对齐PHP版本 product/comment/like
   */
  async likeComment(userId: number, commentId: number) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查用户是否已点赞
    const existingLike = await this.prisma.userLike.findFirst({
      where: {
        userId,
        commentId,
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.userLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });

      return { message: '取消点赞成功', liked: false };
    } else {
      // 添加点赞
      await this.prisma.$queryRaw`
        INSERT INTO "UserLike" ("userId", "commentId", "createdAt", "updatedAt")
        VALUES (${userId}, ${commentId}, NOW(), NOW())
      `;

      await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      return { message: '点赞成功', liked: true };
    }
  }

  /**
   * 回复评论 - 对齐PHP版本 product/comment/reply
   */
  async replyComment(userId: number, commentId: number, replyDto: CommentReplyDto): Promise<CommentResponse> {
    const { content, images } = replyDto;

    // 检查原评论是否存在
    const originalComment = await this.prisma.comment.findFirst({
      where: { id: commentId },
    });

    if (!originalComment) {
      throw new NotFoundException('原评论不存在');
    }

    // 创建回复评论
    const reply = await this.prisma.$queryRaw`
      INSERT INTO "Comment" ("productId", "userId", "rating", content, images, "replyId", "replyContent", "replyTime", status, likes, "isLiked", "createdAt", "updatedAt")
      VALUES (${originalComment.productId}, ${userId}, 5, ${content}, ${images || null}, ${commentId}, ${content}, NOW(), ${CommentStatus.APPROVED}, 0, false, NOW(), NOW())
      RETURNING *
    ` as any[];

    // 更新原评论的回复内容
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        replyContent: content,
        replyTime: new Date(),
      },
    });

    return this.formatCommentResponse(reply[0]);
  }

  /**
   * 获取产品评论统计 - 对齐PHP版本 product/comment/getStats
   */
  async getCommentStats(productId: number): Promise<CommentStatsResponse> {
    // 获取所有已通过的评论
    const comments = await this.prisma.comment.findMany({
      where: {
        productId,
        status: CommentStatus.APPROVED,
      },
    });

    const totalComments = comments.length;

    if (totalComments === 0) {
      return {
        averageRating: 0,
        totalComments: 0,
        ratingDistribution: [],
      };
    }

    // 计算平均评分
    const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
    const averageRating = totalRating / totalComments;

    // 计算评分分布
    const ratingCounts = [0, 0, 0, 0, 0];
    comments.forEach(comment => {
      ratingCounts[comment.rating - 1]++;
    });

    const ratingDistribution = ratingCounts.map((count, index) => ({
      rating: (index + 1) as CommentRating,
      count,
      percentage: Math.round((count / totalComments) * 100),
    }));

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalComments,
      ratingDistribution,
    };
  }

  /**
   * 获取我的评论 - 对齐PHP版本 user/comment/list
   */
  async getUserComments(userId: number, query: any = {}) {
    const { page = 1, size = 10, status } = query;
    const skip = (page - 1) * size;

    const whereClause: any = { userId };
    if (status) whereClause.status = status;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: whereClause,
        skip,
        take: size,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.comment.count({
        where: whereClause,
      }),
    ]);

    return {
      list: comments.map(comment => ({
        ...this.formatCommentResponse(comment),
        productName: comment.product.name,
        productImage: comment.product.image,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 格式化评论响应
   */
  private formatCommentResponse(comment: any): CommentResponse {
    return {
      id: comment.id,
      productId: comment.productId,
      userId: comment.userId,
      userName: comment.user?.nickname || '匿名用户',
      userAvatar: comment.user?.avatar,
      rating: comment.rating,
      content: comment.content,
      images: comment.images,
      orderSn: comment.orderSn,
      replyId: comment.replyId,
      replyContent: comment.replyContent,
      replyTime: comment.replyTime,
      status: comment.status,
      likes: comment.likes,
      isLiked: comment.isLiked,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}