// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export enum MsgType {
  ORDER_NEW = 11,
  ORDER_PAY = 12,
  ORDER_FINISH = 13,
  PRODUCT_LOW_STOCK = 21,
  PRODUCT_NO_STOCK = 22,
  PRODUCT_OFF_SHELF = 23,
  PRODUCT_AUDIT = 24,
  ORDER_CANCEL = 31,
  AFTERSALE_APPLY = 32,
  WITHDRAW_APPLY = 33,
  INVOICE_QUALIFICATION = 34,
  INVOICE_APPLY = 35,
  SHOP_APPLY = 41,
  SHOP_MODIFY = 42,
  SHOP_VIOLATION = 43,
  SYSTEM = 51,
  TODO = 52,
  FEEDBACK = 53,
  QUICK_DELIVERY = 54,
}

export const SUPPLIERS_BY_PRODUCT_TYPE = [
  MsgType.ORDER_NEW,
  MsgType.ORDER_PAY,
  MsgType.ORDER_FINISH,
  MsgType.PRODUCT_LOW_STOCK,
  MsgType.PRODUCT_NO_STOCK,
  MsgType.PRODUCT_OFF_SHELF,
  MsgType.PRODUCT_AUDIT,
  MsgType.ORDER_CANCEL,
];

export const ORDER_RELATED_TYPE = [
  MsgType.ORDER_NEW,
  MsgType.ORDER_PAY,
  MsgType.ORDER_FINISH,
  MsgType.ORDER_CANCEL,
];

export const PRODUCT_RELATED_TYPE = [
  MsgType.PRODUCT_LOW_STOCK,
  MsgType.PRODUCT_NO_STOCK,
  MsgType.PRODUCT_OFF_SHELF,
  MsgType.PRODUCT_AUDIT,
];

@Injectable()
export class AdminMsgService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const query = this.filterQuery(filter);
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    return query.findMany({
      skip,
      take,
    });
  }

  async getFilterCount(filter: any): Promise<number> {
    const query = this.filterQuery(filter);
    return query.count();
  }

  private filterQuery(filter: any) {
    let query = this.prisma.admin_msg;

    // 处理供应商筛选条件
    if (filter.suppliers_id && filter.suppliers_type) {
      const suppliersId = filter.suppliers_id;

      if (filter.suppliers_type === 1) {
        // 订单包含 + 商品对应
        query = query.findMany({
          where: {
            AND: [
              { order_id: { gt: 0 } },
              {
                items: {
                  some: {
                    product: {
                      suppliers_id: suppliersId,
                      is_delete: 0,
                    },
                  },
                },
              },
            ],
          },
        });
      } else if (filter.suppliers_type === 2) {
        // 商品对应
        query = query.findMany({
          where: {
            AND: [
              { product_id: { gt: 0 } },
              {
                product: {
                  suppliers_id: suppliersId,
                },
              },
            ],
          },
        });
      } else {
        query = query.findMany({
          where: {
            msg_type: {
              notIn: SUPPLIERS_BY_PRODUCT_TYPE,
            },
          },
        });
      }
    } else {
      query = query.findMany({});
    }

    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.title = {
        contains: filter.keyword,
      };
    }

    // 消息类型筛选
    if (filter.msg_type) {
      where.msg_type = filter.msg_type;
    }

    // 已读状态筛选
    if (filter.is_read !== undefined && filter.is_read >= 0) {
      where.is_readed = filter.is_read;
    }

    // 店铺ID筛选
    if (filter.shop_id && filter.shop_id > 0) {
      where.shop_id = filter.shop_id;
    }

    // 供应商ID筛选
    if (filter.vendor_id && filter.vendor_id > 0) {
      where.vendor_id = filter.vendor_id;
    }

    // 排序
    const orderBy: any = {};
    if (filter.sort_field && Object.keys(filter.sort_field).length > 0) {
      Object.keys(filter.sort_field).forEach((field) => {
        orderBy[field] = filter.sort_field[field];
      });
    } else {
      orderBy.msg_id = "desc";
    }

    return query.findMany({
      where,
      orderBy,
      include: {
        order: true,
        product: true,
        items: true,
      },
    });
  }

  async getDetail(id: number): Promise<any> {
    const msg = await this.prisma.admin_msg.findUnique({
      where: { msg_id: id },
      include: {
        order: true,
        product: true,
        items: true,
      },
    });

    if (!msg) {
      throw new Error("管理员消息不存在");
    }

    return msg;
  }

  async setReaded(id: number): Promise<boolean> {
    if (!id) {
      throw new Error("#id错误");
    }

    const result = await this.prisma.admin_msg.update({
      where: { msg_id: id },
      data: { is_readed: 1 },
    });

    return !!result;
  }

  async setAllReaded(
    shopId: number = 0,
    vendorId: number = 0,
  ): Promise<boolean> {
    const where: any = { admin_id: 0 };

    if (shopId > 0) {
      where.shop_id = shopId;
    }

    if (vendorId > 0) {
      where.vendor_id = vendorId;
    }

    const result = await this.prisma.admin_msg.updateMany({
      where,
      data: { is_readed: 1 },
    });

    return result.count > 0;
  }

  async getMsgType(shopId: number, vendorId: number = 0): Promise<any[]> {
    const msgTypeArr = [
      {
        cat_id: 1,
        cat_name: "交易消息",
        child: {
          [MsgType.ORDER_NEW]: "新订单",
          [MsgType.ORDER_PAY]: "已付款订单",
          [MsgType.ORDER_FINISH]: "订单完成",
        },
      },
      {
        cat_id: 2,
        cat_name: "商品消息",
        child: {
          [MsgType.PRODUCT_LOW_STOCK]: "商品库存预警",
          [MsgType.PRODUCT_NO_STOCK]: "商品无货",
          [MsgType.PRODUCT_OFF_SHELF]: "商品下架",
          [MsgType.PRODUCT_AUDIT]: "商品审核通知",
        },
      },
      {
        cat_id: 3,
        cat_name: "售后服务",
        child: {
          [MsgType.ORDER_CANCEL]: "订单取消",
          [MsgType.AFTERSALE_APPLY]: "售后申请",
          [MsgType.WITHDRAW_APPLY]: "提现申请",
          [MsgType.INVOICE_QUALIFICATION]: "发票资质审核",
          [MsgType.INVOICE_APPLY]: "发票申请",
        },
      },
      {
        cat_id: 4,
        cat_name: "店铺服务",
        child: {
          [MsgType.SHOP_APPLY]: "店铺入驻申请",
          [MsgType.SHOP_MODIFY]: "店铺资质修改",
          [MsgType.SHOP_VIOLATION]: "店铺违规",
        },
      },
      {
        cat_id: 5,
        cat_name: "其它消息",
        child: {
          [MsgType.SYSTEM]: "系统消息",
          [MsgType.TODO]: "待办任务",
          [MsgType.FEEDBACK]: "意见反馈",
        },
      },
    ];

    const where: any = {
      is_readed: 0,
      admin_id: 0,
    };

    if (shopId > 0) {
      where.shop_id = shopId;
    }

    if (vendorId > 0) {
      where.vendor_id = vendorId;
    }

    // 获取未读消息类型统计
    const unreadMsgTypes = await this.prisma.admin_msg.groupBy({
      by: ["msg_type"],
      where,
      _count: {
        msg_type: true,
      },
    });

    const unreadArr: any = {};
    unreadMsgTypes.forEach((item) => {
      unreadArr[item.msg_type] = item._count.msg_type;
    });

    // 构建返回数据结构
    return msgTypeArr.map((category) => {
      const result: any = {
        cat_id: category.cat_id,
        cat_name: category.cat_name,
        unread_count: 0,
        child: {},
      };

      Object.entries(category.child).forEach(([msgType, name]) => {
        const typeNum = parseInt(msgType);
        result.child[typeNum] = {
          name: name,
          msg_type: typeNum,
          unread_count: 0,
        };

        if (unreadArr[typeNum] && unreadArr[typeNum] > 0) {
          result.unread_count += unreadArr[typeNum];
          result.child[typeNum].unread_count = unreadArr[typeNum];
        }
      });

      return result;
    });
  }

  async newOrderMessage(orderId: number): Promise<number> {
    const msg = await this.prisma.admin_msg.create({
      data: {
        msg_type: MsgType.ORDER_NEW,
        send_time: Math.floor(Date.now() / 1000),
        title: "",
        content: "",
        order_id: orderId,
      },
    });

    return msg.msg_id;
  }

  async createMessage(data: any): Promise<number> {
    try {
      const msg = await this.prisma.admin_msg.create({
        data: {
          ...data,
          send_time: Math.floor(Date.now() / 1000),
        },
      });

      return msg.msg_id;
    } catch (error) {
      throw new Error("创建消息失败: " + error.message);
    }
  }
}
