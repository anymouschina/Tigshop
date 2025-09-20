// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export enum AftersalesType {
  PAY_RETURN = 2, // 仅退款
  RETURN = 1, // 退货/退款
}

export enum AftersalesStatus {
  IN_REVIEW = 1, // 审核中
  APPROVED_FOR_PROCESSING = 2, // 审核通过，处理中
  REFUSE = 3, // 拒绝
  SEND_BACK = 4, // 用户寄回
  RETURNED = 5, // 已寄回，待收货
  COMPLETE = 6, // 已完成
  CANCEL = 7, // 已取消
  WAIT_FOR_SUPPLIER_AUDIT = 21, // 等待供应商审核
  SUPPLIER_APPROVED = 22, // 供应商审核通过
  SUPPLIER_REFUSE = 23, // 供应商拒绝
}

export const AFTERSALES_TYPE_NAME = {
  [AftersalesType.PAY_RETURN]: "仅退款",
  [AftersalesType.RETURN]: "退货/退款",
};

export const STATUS_NAME = {
  [AftersalesStatus.IN_REVIEW]: "审核中",
  [AftersalesStatus.APPROVED_FOR_PROCESSING]: "审核通过，处理中",
  [AftersalesStatus.REFUSE]: "拒绝",
  [AftersalesStatus.SEND_BACK]: "用户寄回",
  [AftersalesStatus.RETURNED]: "已寄回，待收货",
  [AftersalesStatus.COMPLETE]: "已完成",
  [AftersalesStatus.CANCEL]: "已取消",
  [AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT]: "等待供应商审核",
  [AftersalesStatus.SUPPLIER_APPROVED]: "供应商审核通过",
  [AftersalesStatus.SUPPLIER_REFUSE]: "供应商拒绝",
};

export const REFUSE_REASON = [
  "已经超过七天无理由退货时限",
  "商品没有问题，买家未举证",
  "商品没有问题，买家举证无效",
  "已协商完毕不退货",
];

export const VALID_STATUS = [
  AftersalesStatus.IN_REVIEW,
  AftersalesStatus.APPROVED_FOR_PROCESSING,
  AftersalesStatus.SEND_BACK,
  AftersalesStatus.RETURNED,
  AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT,
  AftersalesStatus.SUPPLIER_APPROVED,
];

export const PROGRESSING_STATUS = [
  AftersalesStatus.IN_REVIEW,
  AftersalesStatus.APPROVED_FOR_PROCESSING,
  AftersalesStatus.SEND_BACK,
  AftersalesStatus.RETURNED,
  AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT,
  AftersalesStatus.SUPPLIER_APPROVED,
];

@Injectable()
export class AftersalesService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.aftersales.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        aftersales_items: {
          include: {
            items: true,
          },
        },
        orderSn: {
          select: {
            order_sn: true,
          },
        },
        orders: true,
        refund: true,
        aftersales_log: {
          orderBy: {
            log_id: "desc",
          },
        },
      },
    });

    return results.map((result) => ({
      ...result,
      aftersales_type_name: this.getAftersalesTypeName(result.aftersales_type),
      status_name: this.getStatusName(result.status),
    }));
  }

  async getAfterSalesCount(orderId: number): Promise<number> {
    return this.prisma.aftersales.count({
      where: {
        order_id: orderId,
        status: {
          in: VALID_STATUS,
        },
      },
    });
  }

  async checkHasProcessingAfterSale(orderId: number): Promise<number> {
    return this.prisma.aftersales.count({
      where: {
        order_id: orderId,
        status: {
          in: PROGRESSING_STATUS,
        },
      },
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.aftersales.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索（搜索订单号）
    if (filter.keyword) {
      where.OR = [
        {
          order: {
            order_sn: {
              contains: filter.keyword,
            },
          },
        },
        {
          aftersales_sn: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 状态筛选
    if (filter.status && filter.status !== 0) {
      where.status = filter.status;
    }

    // 申请类型筛选
    if (filter.aftersale_type && filter.aftersale_type !== 0) {
      where.aftersales_type = filter.aftersale_type;
    }

    // 店铺筛选
    if (filter.shop_id && filter.shop_id > -1) {
      where.shop_id = filter.shop_id;
    }

    // 供应商筛选
    if (filter.vendor_id && filter.vendor_id > 0) {
      where.vendor_id = filter.vendor_id;
    }

    // 时间筛选
    if (filter.add_time && filter.add_time.length === 2) {
      const [startDate, endDate] = filter.add_time;
      where.add_time = {
        gte: new Date(startDate).getTime() / 1000,
        lte: new Date(endDate).getTime() / 1000 + 86400,
      };
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      return {
        [filter.sort_field]: filter.sort_order,
      };
    }
    return {
      aftersale_id: "desc",
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
      include: {
        aftersales_items: {
          include: {
            items: true,
          },
        },
        aftersales_log: {
          orderBy: {
            log_id: "desc",
          },
        },
        orders: true,
        refund: true,
      },
    });

    if (!result) {
      throw new Error("售后记录不存在");
    }

    // 计算建议退款金额
    let refundProductPrice = 0;
    if (result.aftersales_items) {
      result.aftersales_items.forEach((item: any) => {
        refundProductPrice += item.number * item.price;
      });
    }

    return {
      ...result,
      status_config: STATUS_NAME,
      aftersales_type_config: AFTERSALES_TYPE_NAME,
      refuse_reason: REFUSE_REASON,
      aftersales_type_name: this.getAftersalesTypeName(result.aftersales_type),
      status_name: this.getStatusName(result.status),
      suggest_refund_amount: parseFloat(refundProductPrice.toFixed(2)),
    };
  }

  async agreeOrRefuse(id: number, data: any): Promise<boolean> {
    const aftersales = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
    });

    if (!aftersales) {
      throw new Error("售后记录不存在");
    }

    const updateData: any = {
      status: data.status,
      reply: data.reply || "",
      return_address: data.return_address || "",
      refund_amount: data.refund_amount || 0,
      update_time: Math.floor(Date.now() / 1000),
    };

    // 如果是退款操作，更新退款金额
    if (data.refund_amount > 0) {
      updateData.refund_amount = data.refund_amount;
    }

    const result = await this.prisma.aftersales.update({
      where: { aftersale_id: id },
      data: updateData,
    });

    // 记录操作日志
    await this.addAftersalesLog(id, {
      aftersale_id: id,
      operator_type: 1, // 管理员
      operator_id: data.admin_id || 0,
      action:
        data.status === AftersalesStatus.APPROVED_FOR_PROCESSING
          ? "同意售后"
          : "拒绝售后",
      action_desc: data.reply || "",
      create_time: Math.floor(Date.now() / 1000),
    });

    return !!result;
  }

  async complete(id: number, adminId: number): Promise<boolean> {
    const aftersales = await this.prisma.aftersales.findUnique({
      where: { aftersale_id: id },
    });

    if (!aftersales) {
      throw new Error("售后记录不存在");
    }

    const result = await this.prisma.aftersales.update({
      where: { aftersale_id: id },
      data: {
        status: AftersalesStatus.COMPLETE,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    // 记录操作日志
    await this.addAftersalesLog(id, {
      aftersale_id: id,
      operator_type: 1, // 管理员
      operator_id: adminId,
      action: "售后完成",
      action_desc: "",
      create_time: Math.floor(Date.now() / 1000),
    });

    return !!result;
  }

  private async addAftersalesLog(
    aftersalesId: number,
    logData: any,
  ): Promise<void> {
    await this.prisma.aftersales_log.create({
      data: logData,
    });
  }

  private getAftersalesTypeName(type: number): string {
    return AFTERSALES_TYPE_NAME[type] || "未知类型";
  }

  private getStatusName(status: number): string {
    return STATUS_NAME[status] || "未知状态";
  }
}
