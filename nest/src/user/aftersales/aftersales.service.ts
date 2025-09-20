// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AftersalesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取可售后订单列表
   */
  async getAfterSalesOrderList(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 15;
    const skip = (page - 1) * size;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          user_id: userId,
          order_status: { not: 4 }, // 未取消的订单
          pay_status: 1, // 已支付
        },
        orderBy: { order_id: 'desc' },
        skip,
        take: size,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.order.count({
        where: {
          user_id: userId,
          order_status: { not: 4 },
          pay_status: 1,
        },
      }),
    ]);

    // 过滤出可售后的订单项
    const aftersalesOrders = orders.map(order => ({
      ...order,
      orderItems: order.orderItems.filter(item =>
        item.aftersales_status === 0 // 未申请售后的商品
      ),
    })).filter(order => order.orderItems.length > 0);

    return {
      records: aftersalesOrders,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取售后配置
   */
  async getAftersalesConfig() {
    return {
      aftersale_type: {
        1: '仅退款',
        2: '退货退款',
        3: '换货',
      },
      aftersale_reason: {
        1: '不喜欢/不想要',
        2: '空包裹',
        3: '未按约定时间发货',
        4: '快递/物流一直未送到',
        5: '货物破损已拒签',
        6: '退运费',
        7: '质量问题',
        8: '描述不符',
        9: '假货',
        10: '其他',
      },
    };
  }

  /**
   * 获取售后申请详情
   */
  async getApplyData(query: { item_id?: number; order_id?: number }) {
    const { item_id, order_id } = query;

    if (!order_id) {
      throw new HttpException('订单ID不能为空', HttpStatus.BAD_REQUEST);
    }

    const order = await this.prisma.order.findUnique({
      where: { order_id },
      include: {
        orderItems: {
          where: item_id ? { order_item_id: item_id } : {},
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    const list = order.orderItems.filter(item => item.aftersales_status === 0);

    return {
      list,
      order: {
        order_id: order.order_id,
        order_sn: order.order_sn,
        order_amount: order.order_amount,
        shipping_fee: order.shipping_fee,
        add_time: order.add_time,
      },
    };
  }

  /**
   * 创建售后申请
   */
  async createAfterSales(userId: number, data: any) {
    // 验证订单
    const order = await this.prisma.order.findFirst({
      where: {
        order_id: data.order_id,
        user_id: userId,
      },
    });

    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    // 验证订单项
    for (const item of data.items) {
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          order_item_id: item.order_item_id,
          order_id: data.order_id,
          aftersales_status: 0, // 未申请售后
        },
      });

      if (!orderItem) {
        throw new HttpException('订单项不存在或已申请售后', HttpStatus.BAD_REQUEST);
      }
    }

    // 创建售后申请
    const aftersales = await this.prisma.aftersales.create({
      data: {
        user_id: userId,
        order_id: data.order_id,
        aftersale_type: data.aftersale_type,
        aftersale_reason: data.aftersale_reason,
        description: data.description,
        refund_amount: data.refund_amount,
        pics: data.pics || [],
        status: 1, // 待处理
        add_time: new Date(),
      },
    });

    // 创建售后商品项
    for (const item of data.items) {
      await this.prisma.aftersalesItem.create({
        data: {
          aftersale_id: aftersales.aftersale_id,
          order_item_id: item.order_item_id,
          number: item.number,
        },
      });

      // 更新订单项的售后状态
      await this.prisma.orderItem.update({
        where: { order_item_id: item.order_item_id },
        data: { aftersales_status: 1 }, // 售后中
      });
    }

    return { success: true };
  }

  /**
   * 更新售后申请
   */
  async updateAfterSales(userId: number, data: any) {
    const aftersales = await this.prisma.aftersales.findFirst({
      where: {
        aftersale_id: data.aftersale_id,
        user_id: userId,
        status: 1, // 只有待处理状态可以修改
      },
    });

    if (!aftersales) {
      throw new HttpException('售后申请不存在或状态不允许修改', HttpStatus.BAD_REQUEST);
    }

    // 更新售后申请
    await this.prisma.aftersales.update({
      where: { aftersale_id: data.aftersale_id },
      data: {
        aftersale_type: data.aftersale_type,
        aftersale_reason: data.aftersale_reason,
        description: data.description,
        refund_amount: data.refund_amount,
        pics: data.pics || [],
      },
    });

    // 删除原有的售后商品项
    await this.prisma.aftersalesItem.deleteMany({
      where: { aftersale_id: data.aftersale_id },
    });

    // 创建新的售后商品项
    for (const item of data.items) {
      await this.prisma.aftersalesItem.create({
        data: {
          aftersale_id: data.aftersale_id,
          order_item_id: item.order_item_id,
          number: item.number,
        },
      });
    }

    return { success: true };
  }

  /**
   * 获取售后申请记录
   */
  async getAfterSalesRecord(userId: number, query: any) {
    const page = query.page || 1;
    const size = query.size || 15;
    const skip = (page - 1) * size;

    const [aftersales, total] = await Promise.all([
      this.prisma.aftersales.findMany({
        where: { user_id: userId },
        orderBy: { aftersale_id: 'desc' },
        skip,
        take: size,
        include: {
          order: {
            select: {
              order_sn: true,
              order_amount: true,
            },
          },
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.aftersales.count({
        where: { user_id: userId },
      }),
    ]);

    return {
      records: aftersales,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取售后详情
   */
  async getAfterSalesDetail(id: number) {
    const aftersales = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
      include: {
        order: {
          select: {
            order_sn: true,
            order_amount: true,
            shipping_fee: true,
            pay_time: true,
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!aftersales) {
      throw new HttpException('售后申请不存在', HttpStatus.NOT_FOUND);
    }

    return aftersales;
  }

  /**
   * 获取售后日志记录
   */
  async getAfterSalesDetailLog(id: number) {
    const logs = await this.prisma.aftersalesLog.findMany({
      where: { aftersale_id: id },
      orderBy: { log_id: 'desc' },
    });

    return logs;
  }

  /**
   * 提交售后反馈
   */
  async submitFeedback(userId: number, data: any) {
    const aftersales = await this.prisma.aftersales.findFirst({
      where: {
        aftersale_id: data.id,
        user_id: userId,
      },
    });

    if (!aftersales) {
      throw new HttpException('售后申请不存在', HttpStatus.NOT_FOUND);
    }

    // 创建售后日志
    await this.prisma.aftersalesLog.create({
      data: {
        aftersale_id: data.id,
        user_id: userId,
        log_info: data.log_info,
        return_pic: data.return_pic || [],
        logistics_name: data.logistics_name,
        tracking_no: data.tracking_no,
        add_time: new Date(),
      },
    });

    // 更新售后状态
    await this.prisma.aftersales.update({
      where: { aftersale_id: data.id },
      data: {
        status: 3, // 已寄回
        return_time: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * 撤销售后申请
   */
  async cancelAfterSales(userId: number, aftersaleId: number) {
    const aftersales = await this.prisma.aftersales.findFirst({
      where: {
        aftersale_id: aftersaleId,
        user_id: userId,
        status: 1, // 只有待处理状态可以撤销
      },
    });

    if (!aftersales) {
      throw new HttpException('售后申请不存在或状态不允许撤销', HttpStatus.BAD_REQUEST);
    }

    // 更新售后状态
    await this.prisma.aftersales.update({
      where: { aftersale_id: aftersaleId },
      data: {
        status: 5, // 已撤销
        cancel_time: new Date(),
      },
    });

    // 恢复订单项的售后状态
    const items = await this.prisma.aftersalesItem.findMany({
      where: { aftersale_id: aftersaleId },
    });

    for (const item of items) {
      await this.prisma.orderItem.update({
        where: { order_item_id: item.order_item_id },
        data: { aftersales_status: 0 }, // 恢复为未申请售后
      });
    }

    return { success: true };
  }
}
