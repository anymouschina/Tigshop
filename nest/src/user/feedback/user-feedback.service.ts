// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UserFeedbackService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户反馈列表
   */
  async getUserFeedbackList(userId: number, query: any) {
    const page = Number(query.page || 1);
    const size = Number(query.size || 10);
    const skip = (page - 1) * size;

    const where: any = { user_id: userId };
    if (query.type !== undefined) where.type = Number(query.type);
    if (query.status !== undefined) where.status = Number(query.status);

    const [feedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { add_time: "desc" },
        skip,
        take: size,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      records: feedbacks,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取产品反馈列表 - 支持productId参数过滤
   */
  async getProductFeedbackList(query: any) {
    const { productId, page = 1, size = 10 } = query;
    const skip = (Number(page) - 1) * Number(size);

    const where: any = {};
    if (productId) where.product_id = Number(productId);

    const [feedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { add_time: "desc" },
        skip,
        take: Number(size),
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      records: feedbacks,
      total,
      page: Number(page),
      size: Number(size),
      totalPages: Math.ceil(total / Number(size)),
    };
  }

  /**
   * 获取反馈详情
   */
  async getFeedbackDetail(userId: number, feedbackId: number) {
    const feedback = await this.prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        user_id: userId,
      },
    });

    if (!feedback) {
      throw new HttpException("反馈不存在", HttpStatus.NOT_FOUND);
    }

    return feedback;
  }

  /**
   * 创建反馈
   */
  async createFeedback(userId: number, data: any) {
    const feedback = await this.prisma.feedback.create({
      data: {
        user_id: userId,
        type: data.type,
        title: data.title,
        content: data.content,
        feedback_pics: data.images ? JSON.stringify(data.images) : null,
        email: data.contact,
        status: 0, // 待处理
        add_time: Math.floor(Date.now() / 1000), // 转换为Unix时间戳
        product_id: data.productId || null,
      },
    });

    return feedback;
  }

  /**
   * 更新反馈
   */
  async updateFeedback(userId: number, data: any) {
    const existingFeedback = await this.prisma.feedback.findFirst({
      where: {
        id: data.id,
        user_id: userId,
        status: 0, // 只有待处理的反馈可以修改
      },
    });

    if (!existingFeedback) {
      throw new HttpException("反馈不存在或已处理", HttpStatus.BAD_REQUEST);
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.contact !== undefined) updateData.email = data.contact;

    return this.prisma.feedback.update({
      where: { id: data.id },
      data: updateData,
    });
  }

  /**
   * 删除反馈
   */
  async deleteFeedback(userId: number, feedbackId: number) {
    const feedback = await this.prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        user_id: userId,
        status: 0, // 只有待处理的反馈可以删除
      },
    });

    if (!feedback) {
      throw new HttpException("反馈不存在或已处理", HttpStatus.BAD_REQUEST);
    }

    // 删除反馈
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });

    return { success: true };
  }

  /**
   * 获取反馈类型
   */
  async getFeedbackTypes() {
    return [
      { id: 1, name: "功能建议" },
      { id: 2, name: "问题反馈" },
      { id: 3, name: "投诉建议" },
      { id: 4, name: "其他" },
    ];
  }

  /**
   * 获取反馈状态
   */
  async getFeedbackStatus() {
    return [
      { id: 0, name: "待处理" },
      { id: 1, name: "处理中" },
      { id: 2, name: "已处理" },
      { id: 3, name: "已关闭" },
    ];
  }

  /**
   * 回复反馈
   */
  async replyFeedback(userId: number, feedbackId: number, content: string) {
    const feedback = await this.prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        user_id: userId,
      },
    });

    if (!feedback) {
      throw new HttpException("反馈不存在", HttpStatus.NOT_FOUND);
    }

    // 创建回复作为新的反馈记录
    const reply = await this.prisma.feedback.create({
      data: {
        parent_id: feedbackId,
        user_id: userId,
        content,
        add_time: Math.floor(Date.now() / 1000),
        status: 1, // 已处理
      },
    });

    return reply;
  }

  /**
   * 上传反馈图片
   */
  async uploadFeedbackImage(userId: number, imageData: string) {
    // 模拟图片上传
    const imageUrl = `/uploads/feedback/${Date.now()}.jpg`;

    return {
      url: imageUrl,
      message: "上传成功",
    };
  }
}
