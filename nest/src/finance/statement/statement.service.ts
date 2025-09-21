// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  StatementQueryDto,
  StatementDetailDto,
  CreateStatementDto,
  UpdateStatementDto,
  DeleteStatementDto,
  BatchDeleteStatementDto,
  STATEMENT_TYPE,
  STATEMENT_STATUS,
} from "./statement.dto";

@Injectable()
export class StatementService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: StatementQueryDto) {
    const {
      keyword = "",
      user_id = 0,
      shop_id = 0,
      type = -1,
      status = -1,
      start_date = "",
      end_date = "",
      page = 1,
      size = 15,
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { description: { contains: keyword } },
        { admin_remark: { contains: keyword } },
        { related_id: { contains: keyword } },
        { order: { order_sn: { contains: keyword } } },
        { user: { nickname: { contains: keyword } } },
      ];
    }

    if (user_id > 0) {
      where.user_id = user_id;
    }

    if (shop_id > 0) {
      where.shop_id = shop_id;
    }

    if (type >= 0) {
      where.type = type;
    }

    if (status >= 0) {
      where.status = status;
    }

    if (start_date && end_date) {
      where.create_time = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    } else if (start_date) {
      where.create_time = {
        gte: new Date(start_date),
      };
    } else if (end_date) {
      where.create_time = {
        lte: new Date(end_date),
      };
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.statement.findMany({
        where,
        include: {
          user: {
            select: {
              user_id: true,
              nickname: true,
              avatar: true,
              mobile: true,
            },
          },
          shop: {
            select: {
              shop_id: true,
              shop_name: true,
              shop_logo: true,
            },
          },
          order: {
            select: {
              order_id: true,
              order_sn: true,
              order_amount: true,
            },
          },
        },
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.statement.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const statement = await this.prisma.statement.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
            avatar: true,
            mobile: true,
            email: true,
          },
        },
        shop: {
          select: {
            shop_id: true,
            shop_name: true,
            shop_logo: true,
            contact_name: true,
            contact_phone: true,
          },
        },
        order: {
          select: {
            order_id: true,
            order_sn: true,
            order_amount: true,
            pay_time: true,
            shipping_time: true,
            confirm_time: true,
          },
        },
      },
    });

    if (!statement) {
      throw new Error("账单记录不存在");
    }

    return statement;
  }

  async create(data: CreateStatementDto) {
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { user_id: data.user_id },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 检查店铺是否存在（如果提供了）
    if (data.shop_id > 0) {
      const shop = await this.prisma.shop.findUnique({
        where: { shop_id: data.shop_id },
      });

      if (!shop) {
        throw new Error("店铺不存在");
      }
    }

    // 检查订单是否存在（如果提供了）
    if (data.order_id > 0) {
      const order = await this.prisma.order.findUnique({
        where: { order_id: data.order_id },
      });

      if (!order) {
        throw new Error("订单不存在");
      }
    }

    // 检查金额不能为负数
    if (data.amount < 0) {
      throw new Error("金额不能为负数");
    }

    const statement = await this.prisma.statement.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
        status: 0, // 默认待审核
      },
    });

    return statement;
  }

  async update(data: UpdateStatementDto) {
    const statement = await this.prisma.statement.findUnique({
      where: { id: data.id },
    });

    if (!statement) {
      throw new Error("账单记录不存在");
    }

    // 状态变更检查
    if (data.status !== undefined && data.status !== statement.status) {
      // 只有待审核状态可以变为已确认、已拒绝或已取消
      if (statement.status === 0) {
        if (data.status === 1 || data.status === 2 || data.status === 3) {
          // 允许状态变更
        } else {
          throw new Error("无效的状态变更");
        }
      }
      // 其他状态不允许变更
      else {
        throw new Error("当前状态不允许变更");
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    // 移除id字段，不允许更新ID
    delete updateData.id;

    const updatedStatement = await this.prisma.statement.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedStatement;
  }

  async remove(id: number) {
    const statement = await this.prisma.statement.findUnique({
      where: { id },
    });

    if (!statement) {
      throw new Error("账单记录不存在");
    }

    // 只有待审核状态可以删除
    if (statement.status !== 0) {
      throw new Error("只有待审核状态的账单记录可以删除");
    }

    await this.prisma.statement.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    // 检查是否都是待审核状态
    const statements = await this.prisma.statement.findMany({
      where: {
        id: {
          in: ids,
        },
        status: 0, // 只有待审核状态可以删除
      },
    });

    if (statements.length !== ids.length) {
      throw new Error("只能删除待审核状态的账单记录");
    }

    await this.prisma.statement.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getStatementStats() {
    const stats = await this.prisma.statement.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const result = {};
    for (let i = 0; i <= 3; i++) {
      result[i] = 0;
    }

    stats.forEach((stat) => {
      result[stat.status] = stat._count.status;
    });

    return result;
  }

  async getStatementByUser(userId: number, type?: number) {
    const where: any = { user_id: userId };
    if (type !== undefined && type >= 0) {
      where.type = type;
    }

    return await this.prisma.statement.findMany({
      where,
      include: {
        order: {
          select: {
            order_id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
    });
  }

  async getStatementByShop(shopId: number, type?: number) {
    const where: any = { shop_id: shopId };
    if (type !== undefined && type >= 0) {
      where.type = type;
    }

    return await this.prisma.statement.findMany({
      where,
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
            avatar: true,
          },
        },
        order: {
          select: {
            order_id: true,
            order_sn: true,
            order_amount: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
    });
  }

  async getAmountStats(dateRange?: [Date, Date]) {
    const where: any = {
      status: 1, // 已确认
    };

    if (dateRange && dateRange.length === 2) {
      where.create_time = {
        gte: dateRange[0],
        lte: dateRange[1],
      };
    }

    const result = await this.prisma.statement.groupBy({
      by: ["type"],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    const stats = {};
    for (let i = 0; i <= 10; i++) {
      stats[i] = { total_amount: 0, count: 0 };
    }

    result.forEach((stat) => {
      stats[stat.type] = {
        total_amount: stat._sum.amount || 0,
        count: stat._count._all || 0,
      };
    });

    return stats;
  }

  async getMonthlyStats(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const result = await this.prisma.statement.groupBy({
      by: ["type"],
      where: {
        status: 1,
        create_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    return result;
  }
}
