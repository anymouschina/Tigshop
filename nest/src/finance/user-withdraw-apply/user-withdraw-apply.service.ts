// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateUserWithdrawApplyDto,
  UpdateUserWithdrawApplyDto,
  UserWithdrawApplyQueryDto,
  WithdrawStatus,
  WithdrawType,
  WithdrawStatisticsDto,
  UserWithdrawApplyConfigDto,
} from "./dto/user-withdraw-apply.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UserWithdrawApplyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: UserWithdrawApplyQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      userId,
      withdrawType,
      sortField = "id",
      sortOrder = "desc",
      startTime,
      endTime,
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { postscript: { contains: keyword } },
        { apply_reply: { contains: keyword } },
        { admin_remark: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      // schema: Boolean status，按 PHP 语义仅“已完成”算 true，其它为 false
      where.status = Number(status) === (WithdrawStatus.COMPLETED as number);
    }

    if (userId) {
      where.user_id = userId;
    }

    if (withdrawType) {
      // schema 无 withdraw_type 列，存于 account_data(JSON 字符串) 中
      // 使用 contains 进行简单匹配（注意潜在误匹配风险，足够兼容）
      where.account_data = { contains: `"type":"${withdrawType}"` } as any;
    }

    if (startTime || endTime) {
      where.add_time = {};
      if (startTime) {
        where.add_time.gte = Math.floor(new Date(startTime).getTime() / 1000);
      }
      if (endTime) {
        where.add_time.lte = Math.floor(new Date(endTime).getTime() / 1000);
      }
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [rawRecords, total] = await Promise.all([
      this.prisma.user_withdraw_apply.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.user_withdraw_apply.count({ where }),
    ]);

    // 手动关联 user 基础信息（schema 未定义关系）
    const userIds = Array.from(
      new Set(rawRecords.map((r: any) => r.user_id).filter(Boolean)),
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { user_id: { in: userIds } },
          select: { user_id: true, username: true, email: true, mobile: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.user_id, u]));
    const records = rawRecords.map((r: any) => ({
      ...r,
      user: userMap.get(r.user_id) || null,
    }));

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: number) {
    const apply = await this.prisma.user_withdraw_apply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException("提现申请不存在");
    }

    const user = apply.user_id
      ? await this.prisma.user.findUnique({
          where: { user_id: apply.user_id },
          select: { user_id: true, username: true, email: true, mobile: true },
        })
      : null;

    return { ...apply, user } as any;
  }

  async create(createDto: CreateUserWithdrawApplyDto) {
    if (createDto.amount <= 0) {
      throw new BadRequestException("提现金额必须大于0");
    }
    const rawStatus = Number(createDto.status ?? WithdrawStatus.PENDING);
    const completed = rawStatus === (WithdrawStatus.COMPLETED as number);

    // 将原始状态码写入 account_data.rawStatus 以实现多状态兼容
    const originAccount = {
      ...(createDto.accountData || {}),
      name: createDto.accountData?.name,
      account: createDto.accountData?.account,
    } as any;
    originAccount.rawStatus = rawStatus; // 记录原始状态码

    const apply = await this.prisma.user_withdraw_apply.create({
      data: {
        user_id: createDto.userId,
        amount: createDto.amount,
        postscript: createDto.postscript || "",
        account_data: JSON.stringify(originAccount),
        status: completed ? true : false,
        add_time: Math.floor(Date.now() / 1000),
        finished_time: completed ? Math.floor(Date.now() / 1000) : undefined,
      },
    });

    const user = apply.user_id
      ? await this.prisma.user.findUnique({
          where: { user_id: apply.user_id },
          select: { user_id: true, username: true, email: true, mobile: true },
        })
      : null;

    return { ...apply, user } as any;
  }

  async update(id: number, updateDto: UpdateUserWithdrawApplyDto) {
    const apply = await this.prisma.user_withdraw_apply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException("提现申请不存在");
    }

    const updateData: any = {};

    if (updateDto.status !== undefined) {
      const newRawStatus = Number(updateDto.status);
      const toCompleted = newRawStatus === (WithdrawStatus.COMPLETED as number);
      const wasCompleted = !!apply.status;
      updateData.status = toCompleted ? true : false;
      if (toCompleted && !wasCompleted) {
        updateData.finished_time = Math.floor(Date.now() / 1000);
      }
      // 合并写回 account_data.rawStatus
      try {
        const parsed = apply.account_data ? JSON.parse(apply.account_data) : {};
        parsed.rawStatus = newRawStatus;
        updateData.account_data = JSON.stringify(parsed);
      } catch (e) {
        updateData.account_data = JSON.stringify({ rawStatus: newRawStatus });
      }
    }

    if (updateDto.postscript !== undefined) {
      updateData.postscript = updateDto.postscript;
    }

    // schema 无 apply_reply/admin_remark/process_time/complete_time/trade_no 字段
    // 保留兼容但不存库；如需持久化，需扩展表结构或另建日志表

    const updatedApply = await this.prisma.user_withdraw_apply.update({
      where: { id },
      data: updateData,
    });

    const user = updatedApply.user_id
      ? await this.prisma.user.findUnique({
          where: { user_id: updatedApply.user_id },
          select: { user_id: true, username: true, email: true, mobile: true },
        })
      : null;

    return { ...updatedApply, user } as any;
  }

  async delete(id: number) {
    const apply = await this.prisma.user_withdraw_apply.findUnique({
      where: { id },
    });

    if (!apply) {
      throw new NotFoundException("提现申请不存在");
    }

    await this.prisma.user_withdraw_apply.delete({
      where: { id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.user_withdraw_apply.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getConfig(): Promise<UserWithdrawApplyConfigDto> {
    return {
      statusConfig: {
        [WithdrawStatus.PENDING]: "待审核",
        [WithdrawStatus.APPROVED]: "已通过",
        [WithdrawStatus.REJECTED]: "已拒绝",
        [WithdrawStatus.PROCESSING]: "处理中",
        [WithdrawStatus.COMPLETED]: "已完成",
        [WithdrawStatus.FAILED]: "已失败",
      },
      withdrawTypeConfig: {
        [WithdrawType.ALIPAY]: "支付宝",
        [WithdrawType.WECHAT]: "微信",
        [WithdrawType.BANK]: "银行卡",
      },
      minAmount: 1,
      maxAmount: 50000,
      feeRate: 0.001,
      dailyLimit: 50000,
    };
  }

  async getStatistics(
    queryDto?: UserWithdrawApplyQueryDto,
  ): Promise<WithdrawStatisticsDto> {
    const where: any = {};

    if (queryDto) {
      if (queryDto.status !== undefined) {
        where.status = queryDto.status;
      }
      if (queryDto.userId) {
        where.user_id = queryDto.userId;
      }
      if (queryDto.startTime || queryDto.endTime) {
        where.add_time = {};
        if (queryDto.startTime) {
          where.add_time.gte = Math.floor(
            new Date(queryDto.startTime).getTime() / 1000,
          );
        }
        if (queryDto.endTime) {
          where.add_time.lte = Math.floor(
            new Date(queryDto.endTime).getTime() / 1000,
          );
        }
      }
    }

    const totalResult = await this.prisma.user_withdraw_apply.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    const successResult = await this.prisma.user_withdraw_apply.aggregate({
      where: { ...where, status: WithdrawStatus.COMPLETED },
      _sum: { amount: true },
      _count: true,
    });

    const pendingResult = await this.prisma.user_withdraw_apply.aggregate({
      where: { ...where, status: WithdrawStatus.PENDING },
      _sum: { amount: true },
      _count: true,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayResult = await this.prisma.user_withdraw_apply.aggregate({
      where: {
        ...where,
        add_time: {
          gte: Math.floor(todayStart.getTime() / 1000),
          lte: Math.floor(todayEnd.getTime() / 1000),
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalAmount: totalResult._sum.amount || 0,
      successAmount: successResult._sum.amount || 0,
      pendingAmount: pendingResult._sum.amount || 0,
      totalCount: totalResult._count,
      successCount: successResult._count,
      pendingCount: pendingResult._count,
      todayAmount: todayResult._sum.amount || 0,
      todayCount: todayResult._count,
    };
  }

  async getUserWithdrawHistory(
    userId: number,
    queryDto: UserWithdrawApplyQueryDto,
  ) {
    const modifiedQuery = { ...queryDto, userId };
    return this.findAll(modifiedQuery);
  }
}
