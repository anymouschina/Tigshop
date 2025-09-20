import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAftersalesDto,
  UpdateAftersalesDto,
  AftersalesFeedbackDto,
  AftersalesQueryDto,
  ApplyDataDto,
  AftersalesType,
  AftersalesStatus,
  AFTERSALES_TYPE_NAME,
  AFTERSALES_REASON,
  STATUS_NAME,
} from './dto/user-aftersales.dto';

@Injectable()
export class UserAftersalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAfterSalesOrderList(userId: number, queryDto: AftersalesQueryDto) {
    const { page = 1, size = 15, sort_field = 'order_id', sort_order = 'desc' } = queryDto;
    const skip = (page - 1) * size;

    const where = { user_id: userId };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sort_field]: sort_order },
        include: {
          order_items: true,
          aftersales: {
            include: {
              aftersales_items: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // Filter orders that can be returned/refunded
    const returnableOrders = orders.filter(order => {
      return order.order_status === 4 && // Completed order
        (!order.aftersales || order.aftersales.length === 0); // No existing aftersales
    });

    return {
      records: returnableOrders,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getAfterSalesConfig() {
    // Translate aftersales type names
    const translatedAftersaleType = Object.fromEntries(
      Object.entries(AFTERSALES_TYPE_NAME).map(([key, value]) => [key, value])
    );

    // Translate aftersales reasons
    const translatedAftersaleReason = AFTERSALES_REASON.map(reason => reason);

    return {
      aftersale_type: translatedAftersaleType,
      aftersale_reason: translatedAftersaleReason,
    };
  }

  async getAfterSalesApplyData(applyDataDto: ApplyDataDto) {
    const { item_id, order_id } = applyDataDto;

    if (!order_id) {
      throw new BadRequestException('订单ID不能为空');
    }

    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { order_id },
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // Get specific item if item_id is provided
    let orderItems = order.order_items;
    if (item_id) {
      orderItems = orderItems.filter(item => item.order_item_id === item_id);
    }

    return {
      list: orderItems,
      order,
    };
  }

  async createAfterSales(userId: number, createDto: CreateAftersalesDto) {
    const { order_id, aftersale_type, aftersale_reason, description, refund_amount, pics, items } = createDto;

    // Check if order belongs to user
    const order = await this.prisma.order.findFirst({
      where: { order_id, user_id: userId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在或不属于当前用户');
    }

    // Check if order is completed
    if (order.order_status !== 4) {
      throw new BadRequestException('只有已完成的订单可以申请售后');
    }

    // Check if aftersales already exists for this order
    const existingAftersales = await this.prisma.aftersales.findFirst({
      where: { order_id },
    });

    if (existingAftersales) {
      throw new BadRequestException('该订单已有售后申请');
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create aftersales record
        const aftersales = await prisma.aftersales.create({
          data: {
            order_id,
            user_id: userId,
            aftersale_type,
            aftersale_reason,
            description,
            refund_amount,
            pics: pics || [],
            status: AftersalesStatus.IN_REVIEW,
            add_time: Math.floor(Date.now() / 1000),
          },
        });

        // Create aftersales items
        for (const item of items) {
          await prisma.aftersales_item.create({
            data: {
              aftersale_id: aftersales.aftersale_id,
              order_item_id: item.order_item_id,
              number: item.number,
            },
          });
        }

        return aftersales;
      });

      return { success: true, aftersale_id: result.aftersale_id };
    } catch (error) {
      throw new BadRequestException('售后申请失败');
    }
  }

  async updateAfterSales(userId: number, updateDto: UpdateAftersalesDto) {
    const { aftersale_id, order_id, aftersale_type, aftersale_reason, description, refund_amount, pics, items } = updateDto;

    // Check if aftersales exists and belongs to user
    const aftersales = await this.prisma.aftersales.findFirst({
      where: { aftersale_id, user_id: userId },
      include: {
        aftersales_items: true,
      },
    });

    if (!aftersales) {
      throw new NotFoundException('售后申请不存在或不属于当前用户');
    }

    // Check if aftersales can be updated (only in review status)
    if (aftersales.status !== AftersalesStatus.IN_REVIEW) {
      throw new BadRequestException('该状态下不能修改');
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Update aftersales record
        await prisma.aftersales.update({
          where: { aftersale_id },
          data: {
            aftersale_type,
            aftersale_reason,
            description,
            refund_amount,
            pics: pics || [],
          },
        });

        // Delete existing items and create new ones
        await prisma.aftersales_item.deleteMany({
          where: { aftersale_id },
        });

        for (const item of items) {
          await prisma.aftersales_item.create({
            data: {
              aftersale_id,
              order_item_id: item.order_item_id,
              number: item.number,
            },
          });
        }
      });

      return { success: true };
    } catch (error) {
      throw new BadRequestException('售后申请更新失败');
    }
  }

  async getAfterSalesRecord(userId: number, queryDto: AftersalesQueryDto) {
    const { page = 1, size = 15, sort_field = 'aftersale_id', sort_order = 'desc' } = queryDto;
    const skip = (page - 1) * size;

    const where = { user_id: userId };

    const [aftersalesList, total] = await Promise.all([
      this.prisma.aftersales.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sort_field]: sort_order },
        include: {
          orders: {
            select: {
              order_sn: true,
            },
          },
          aftersales_items: {
            include: {
              order_item: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.aftersales.count({ where }),
    ]);

    const processedList = aftersalesList.map(aftersales => ({
      ...aftersales,
      status_text: STATUS_NAME[aftersales.status] || '',
      aftersale_type_text: AFTERSALES_TYPE_NAME[aftersales.aftersale_type] || '',
    }));

    return {
      list: processedList,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async getAfterSalesDetail(aftersale_id: number, userId?: number) {
    const where: any = { aftersale_id };
    if (userId) {
      where.user_id = userId;
    }

    const aftersales = await this.prisma.aftersales.findFirst({
      where,
      include: {
        orders: {
          select: {
            order_sn: true,
          },
        },
        aftersales_items: {
          include: {
            order_item: {
              include: {
                product: true,
              },
            },
          },
        },
        aftersales_log: {
          orderBy: { log_id: 'desc' },
        },
        refund: true,
      },
    });

    if (!aftersales) {
      throw new NotFoundException('售后申请不存在');
    }

    return {
      ...aftersales,
      status_text: STATUS_NAME[aftersales.status] || '',
      aftersale_type_text: AFTERSALES_TYPE_NAME[aftersales.aftersale_type] || '',
    };
  }

  async getAfterSalesDetailLog(aftersale_id: number) {
    const logs = await this.prisma.aftersales_log.findMany({
      where: { aftersale_id },
      orderBy: { log_id: 'desc' },
    });

    return {
      logs,
      total: logs.length,
    };
  }

  async submitFeedback(userId: number, feedbackDto: AftersalesFeedbackDto) {
    const { id, log_info, return_pic, logistics_name, tracking_no } = feedbackDto;

    // Check if aftersales exists and belongs to user
    const aftersales = await this.prisma.aftersales.findFirst({
      where: { aftersale_id: id, user_id: userId },
    });

    if (!aftersales) {
      throw new NotFoundException('售后申请不存在或不属于当前用户');
    }

    // Check if aftersales is in correct status for feedback
    if (aftersales.status !== AftersalesStatus.APPROVED_FOR_PROCESSING) {
      throw new BadRequestException('当前状态不能提交反馈');
    }

    try {
      // Create feedback log
      const log = await this.prisma.aftersales_log.create({
        data: {
          aftersale_id: id,
          action: '用户提交反馈',
          operator: 'user',
          operator_id: userId,
          description: log_info || '用户提交售后反馈',
          pics: return_pic || [],
          logistics_name,
          tracking_no,
          add_time: Math.floor(Date.now() / 1000),
        },
      });

      // Update aftersales status to send back
      await this.prisma.aftersales.update({
        where: { aftersale_id: id },
        data: {
          status: AftersalesStatus.SEND_BACK,
        },
      });

      return { success: true, log_id: log.log_id };
    } catch (error) {
      throw new BadRequestException('提交反馈失败');
    }
  }

  async cancelAfterSales(userId: number, aftersale_id: number) {
    // Check if aftersales exists and belongs to user
    const aftersales = await this.prisma.aftersales.findFirst({
      where: { aftersale_id, user_id: userId },
    });

    if (!aftersales) {
      throw new NotFoundException('售后申请不存在或不属于当前用户');
    }

    // Check if aftersales can be cancelled
    if (aftersales.status !== AftersalesStatus.IN_REVIEW) {
      throw new BadRequestException('当前状态不能撤销');
    }

    try {
      // Update aftersales status to cancelled
      await this.prisma.aftersales.update({
        where: { aftersale_id },
        data: {
          status: AftersalesStatus.CANCEL,
        },
      });

      // Create cancellation log
      await this.prisma.aftersales_log.create({
        data: {
          aftersale_id,
          action: '用户撤销申请',
          operator: 'user',
          operator_id: userId,
          description: '用户撤销售后申请',
          add_time: Math.floor(Date.now() / 1000),
        },
      });

      return { success: true };
    } catch (error) {
      throw new BadRequestException('撤销失败');
    }
  }
}