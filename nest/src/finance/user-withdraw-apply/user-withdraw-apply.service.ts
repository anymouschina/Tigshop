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
import { ConfigService } from "src/setting/config.service";

@Injectable()
export class UserWithdrawApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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
    // 读取提现配置
    let withdrawalCfg: any = await this.configService
      .getJsonConfig("withdrawalSettings")
      .catch(() => null);
    if (!withdrawalCfg || typeof withdrawalCfg !== "object") {
      withdrawalCfg = {
        enabled: true,
        minAmount: 1,
        maxAmount: 50000,
        feeRate: 0,
        methods: ["alipay", "wechat", "bank"],
        dailyLimit: 50000,
      };
    }
    // 兼容字段：withdrawalEnabled 优先，其次 enabled
    const enabledFlag =
      withdrawalCfg.withdrawalEnabled !== undefined
        ? String(withdrawalCfg.withdrawalEnabled) === "1" ||
          withdrawalCfg.withdrawalEnabled === true
        : withdrawalCfg.enabled !== false;
    const {
      minAmount = 1,
      maxAmount = 50000,
      dailyLimit = 50000,
    } = withdrawalCfg;
    if (!enabledFlag) {
      throw new BadRequestException("当前提现功能已关闭");
    }
    if (createDto.amount < Number(minAmount)) {
      throw new BadRequestException(
        `单次最小提现金额为 ${Number(minAmount).toFixed(2)}`,
      );
    }
    if (createDto.amount > Number(maxAmount)) {
      throw new BadRequestException(
        `单次最大提现金额为 ${Number(maxAmount).toFixed(2)}`,
      );
    }
    // 校验允许的收款方式 (accountType 与 withdrawalReceiptMethod/int methods 对应)
    try {
      const allowList =
        withdrawalCfg.withdrawalReceiptMethod ||
        withdrawalCfg.receiptMethods ||
        [];
      if (Array.isArray(allowList) && allowList.length) {
        const acctType = Number(
          (createDto.accountData as any)?.accountType ||
            (createDto.accountData as any)?.account_type ||
            (createDto.accountData as any)?.type ||
            0,
        );
        if (!allowList.map((v: any) => Number(v)).includes(acctType)) {
          throw new BadRequestException("不支持的提现方式");
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
    }
    // 频次限制：withdrawalFrequencyUnit (1=天 2=周 3=月)，withdrawalFrequencyCount 次数
    const freqCountRaw =
      withdrawalCfg.withdrawalFrequencyCount ?? withdrawalCfg.frequencyCount;
    const freqUnitRaw =
      withdrawalCfg.withdrawalFrequencyUnit ?? withdrawalCfg.frequencyUnit;
    const freqCount = Number(freqCountRaw || 0);
    const freqUnit = Number(freqUnitRaw || 0);
    if (freqCount > 0 && [1, 2, 3].includes(freqUnit)) {
      const now = new Date();
      const periodStart = new Date(now);
      if (freqUnit === 1) {
        // day
        periodStart.setHours(0, 0, 0, 0);
      } else if (freqUnit === 2) {
        // week (以周一为起点)
        const day = periodStart.getDay(); // 0=Sunday
        const diff = day === 0 ? 6 : day - 1; // 距离周一的天数
        periodStart.setHours(0, 0, 0, 0);
        periodStart.setDate(periodStart.getDate() - diff);
      } else if (freqUnit === 3) {
        // month
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
      }
      const startTs = Math.floor(periodStart.getTime() / 1000);
      const periodCount = await this.prisma.user_withdraw_apply.count({
        where: { user_id: createDto.userId, add_time: { gte: startTs } },
      });
      if (periodCount >= freqCount) {
        if (freqUnit === 1) {
          throw new BadRequestException("今日提现次数已达上限");
        } else if (freqUnit === 2) {
          throw new BadRequestException("本周提现次数已达上限");
        } else if (freqUnit === 3) {
          throw new BadRequestException("本月提现次数已达上限");
        } else {
          throw new BadRequestException("提现次数已达上限");
        }
      }
    }
    // 统计当日已申请(所有状态)提现总额，限制 dailyLimit（以自然日按本地时间 00:00-23:59）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayStartTs = Math.floor(todayStart.getTime() / 1000);
    const todayEndTs = Math.floor(todayEnd.getTime() / 1000);
    const dailyAgg = await this.prisma.user_withdraw_apply.aggregate({
      where: {
        user_id: createDto.userId,
        add_time: { gte: todayStartTs, lte: todayEndTs },
      },
      _sum: { amount: true },
    });
    const todayAmount = Number(dailyAgg._sum.amount || 0);
    if (todayAmount + createDto.amount > Number(dailyLimit)) {
      throw new BadRequestException(
        `今日累计提现 ${todayAmount.toFixed(2)}，超出日限额 ${Number(dailyLimit).toFixed(2)}`,
      );
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

    // 读取用户余额，校验
    const userForBalance = await this.prisma.user.findUnique({
      where: { user_id: createDto.userId },
    });
    if (!userForBalance) throw new BadRequestException("用户不存在");
    if (createDto.amount > Number(userForBalance.balance)) {
      throw new BadRequestException("提现金额大于账户的可用余额");
    }

    // 冻结与扣减逻辑：创建时即冻结 + 扣可用余额；记录 freezeApplied 标志
    // 规范账户字段命名，兼容传入的多种 key
    originAccount.accountName =
      originAccount.accountName ||
      originAccount.account_name ||
      originAccount.name ||
      null;
    originAccount.accountNo =
      originAccount.accountNo ||
      originAccount.account_no ||
      originAccount.account ||
      null;
    originAccount.accountType =
      Number(
        originAccount.accountType ??
          originAccount.account_type ??
          originAccount.type ??
          0,
      ) || 0;
    originAccount.bankName =
      originAccount.bankName ||
      originAccount.bank_name ||
      originAccount.bank ||
      null;
    originAccount.identity = originAccount.identity || null;
    originAccount.freezeApplied = true;

    const now = Math.floor(Date.now() / 1000);
    const apply = await this.prisma.$transaction(async (tx) => {
      const oldBalance = Number(userForBalance.balance);
      const oldFrozen = Number(userForBalance.frozen_balance || 0);
      const amount = createDto.amount;
      const newBalance = oldBalance - amount;
      const newFrozen = oldFrozen + amount;

      // 先增加冻结（模拟 incFrozenBalance）
      await tx.user.update({
        where: { user_id: createDto.userId },
        data: { frozen_balance: newFrozen },
      });
      await tx.user_balance_log.create({
        data: {
          user_id: createDto.userId,
          balance: oldBalance,
          frozen_balance: oldFrozen,
          new_balance: oldBalance, // 可用未动
          new_frozen_balance: newFrozen,
          change_time: now,
          change_desc: `提现冻结余额 ${amount.toFixed(2)}`,
          change_type: 0,
        },
      });

      // 再扣除可用（模拟 decBalance）
      await tx.user.update({
        where: { user_id: createDto.userId },
        data: { balance: newBalance },
      });
      await tx.user_balance_log.create({
        data: {
          user_id: createDto.userId,
          balance: oldBalance,
          frozen_balance: newFrozen, // 已冻结后的值
          new_balance: newBalance,
          new_frozen_balance: newFrozen,
          change_time: now,
          change_desc: `提现扣除余额 ${amount.toFixed(2)}`,
          change_type: 0,
        },
      });

      const created = await tx.user_withdraw_apply.create({
        data: {
          user_id: createDto.userId,
          amount: amount,
          postscript: createDto.postscript || "",
          account_data: JSON.stringify(originAccount),
          status: completed ? true : false,
          add_time: now,
          finished_time: completed ? now : undefined,
        },
      });

      // TODO: 管理端消息通知（AdminMsgService）如后续实现消息模块，可在此处发布
      return created;
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
