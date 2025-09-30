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
      // prisma字段不存在id，这里做映射：id->statement_id；create_time->record_time
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      // 仅对现有列做关键词过滤（record_sn/payment_type/entry_type）
      where.OR = [
        { record_sn: { contains: keyword } },
        { payment_type: { contains: keyword } },
        { entry_type: { contains: keyword } },
      ];
    }

    // 模型无 user_id 字段，忽略 user 维度筛选

    if (shop_id > 0) {
      where.shop_id = shop_id;
    }

    if (type >= 0) {
      where.type = type;
    }

    if (status >= 0) {
      // 模型字段为 settlement_status
      where.settlement_status = status;
    }

    if (start_date && end_date) {
      // record_time 为 BigInt（秒级/毫秒级取决于历史，这里按秒存储）
      const gte = BigInt(Math.floor(new Date(start_date).getTime() / 1000));
      const lte = BigInt(Math.floor(new Date(end_date).getTime() / 1000));
      where.record_time = { gte, lte };
    } else if (start_date) {
      const gte = BigInt(Math.floor(new Date(start_date).getTime() / 1000));
      where.record_time = { gte };
    } else if (end_date) {
      const lte = BigInt(Math.floor(new Date(end_date).getTime() / 1000));
      where.record_time = { lte };
    }

    // 排序字段映射与白名单
    const sortFieldMap: Record<string, string> = {
      id: "statement_id",
      statement_id: "statement_id",
      create_time: "record_time",
      record_time: "record_time",
      settlement_time: "settlement_time",
      type: "type",
      amount: "amount",
      settlement_status: "settlement_status",
    };
    const mappedSortField = sortFieldMap[sort_field] ?? "statement_id";
    const orderBy: any = {};
    orderBy[mappedSortField] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.statement.findMany({
        where,
        // 当前模型未声明关系，去除 include 以避免 Prisma 校验错误
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.statement.count({ where }),
    ]);

    // 补充兼容字段别名（id/status）
    const mappedItems = items.map((it: any) => ({
      id: it.statement_id,
      status: it.settlement_status,
      // 保留原始字段，便于前端按需取用
      ...it,
    }));

    return {
      items: mappedItems,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const statement = await this.prisma.statement.findUnique({
      where: { statement_id: BigInt(id) },
    });

    if (!statement) {
      throw new Error("账单记录不存在");
    }

    return { id: statement.statement_id, status: statement.settlement_status, ...statement } as any;
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
        // 仅写入存在的列
        type: data.type,
        amount: data.amount,
        shop_id: data.shop_id > 0 ? data.shop_id : null,
        record_id: data.order_id && data.order_id > 0 ? data.order_id : null,
        record_sn: data.related_id ?? null,
        entry_type: "manual",
        payment_type: null,
        account_type: 1,
        account_balance: 0 as any,
        record_time: BigInt(Math.floor(Date.now() / 1000)),
        settlement_time: null,
        settlement_status: 0, // 待审核
        gmt_create: new Date().toISOString(),
      },
    });

    return { id: statement.statement_id, status: statement.settlement_status, ...statement } as any;
  }

  async update(data: UpdateStatementDto) {
    const statement = await this.prisma.statement.findUnique({
      where: { statement_id: BigInt(data.id) },
    });

    if (!statement) {
      throw new Error("账单记录不存在");
    }

    // 状态变更检查
    if (data.status !== undefined && data.status !== statement.settlement_status) {
      // 只有待审核状态可以变为已确认、已拒绝或已取消
      if (statement.settlement_status === 0) {
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
      // 仅更新允许的字段
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.amount !== undefined ? { amount: data.amount as any } : {}),
      ...(data.status !== undefined ? { settlement_status: data.status } : {}),
    };

    // 移除id字段，不允许更新ID
    delete updateData.id;

    const updatedStatement = await this.prisma.statement.update({
      where: { statement_id: BigInt(data.id) },
      data: updateData,
    });

    return { id: updatedStatement.statement_id, status: updatedStatement.settlement_status, ...updatedStatement } as any;
  }

  async remove(id: number) {
    const statement = await this.prisma.statement.findUnique({
      where: { statement_id: BigInt(id) },
    });

    if (!statement) {
      throw new Error("账单记录不存在");
    }

    // 只有待审核状态可以删除
    if (statement.settlement_status !== 0) {
      throw new Error("只有待审核状态的账单记录可以删除");
    }

    await this.prisma.statement.delete({
      where: { statement_id: BigInt(id) },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    // 检查是否都是待审核状态
    const statements = await this.prisma.statement.findMany({
      where: {
        statement_id: { in: ids.map((x) => BigInt(x)) },
        settlement_status: 0, // 只有待审核状态可以删除
      },
    });

    if (statements.length !== ids.length) {
      throw new Error("只能删除待审核状态的账单记录");
    }

    await this.prisma.statement.deleteMany({
      where: { statement_id: { in: ids.map((x) => BigInt(x)) } },
    });

    return true;
  }

  async getStatementStats() {
    const stats = await this.prisma.statement.groupBy({
      by: ["settlement_status"],
      _count: {
        _all: true,
      },
    });

    const result = {};
    for (let i = 0; i <= 3; i++) {
      result[i] = 0;
    }

    stats.forEach((stat: any) => {
      result[stat.settlement_status] = stat._count._all;
    });

    return result;
  }

  async getStatementByUser(userId: number, type?: number) {
    const where: any = { user_id: userId };
    if (type !== undefined && type >= 0) {
      where.type = type;
    }

    // 当前模型未关联 user/order，这里仅返回按记录时间倒序的数据
    return await this.prisma.statement.findMany({
      where,
      orderBy: { record_time: "desc" },
    });
  }

  async getStatementByShop(shopId: number, type?: number) {
    const where: any = { shop_id: shopId };
    if (type !== undefined && type >= 0) {
      where.type = type;
    }

    return await this.prisma.statement.findMany({
      where,
      orderBy: { record_time: "desc" },
    });
  }

  async getAmountStats(dateRange?: [Date, Date]) {
    const where: any = {
      settlement_status: 1, // 已确认
    };

    if (dateRange && dateRange.length === 2) {
      const gte = BigInt(Math.floor(dateRange[0].getTime() / 1000));
      const lte = BigInt(Math.floor(dateRange[1].getTime() / 1000));
      where.record_time = { gte, lte };
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
        settlement_status: 1,
        record_time: {
          gte: BigInt(Math.floor(startDate.getTime() / 1000)),
          lte: BigInt(Math.floor(endDate.getTime() / 1000)),
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
