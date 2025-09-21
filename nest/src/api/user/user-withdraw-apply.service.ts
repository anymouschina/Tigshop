// @ts-nocheck
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  WithdrawQueryDto,
  WithdrawAccountQueryDto,
  CreateWithdrawAccountDto,
  UpdateWithdrawAccountDto,
  CreateWithdrawApplyDto,
  WithdrawAccountDetailDto,
  DeleteWithdrawAccountDto,
  WithdrawStatus,
  AccountType,
} from "./dto/user-withdraw-apply.dto";

@Injectable()
export class UserWithdrawApplyService {
  constructor(private prisma: PrismaService) {}

  async getWithdrawList(userId: number, query: WithdrawQueryDto) {
    const {
      page = 1,
      size = 15,
      status,
      keyword,
      sort_field = "add_time",
      sort_order = "desc",
    } = query;
    const skip = (page - 1) * size;

    const where: any = {
      user_id: userId,
      is_delete: 0,
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { withdraw_sn: { contains: keyword } },
        { postscript: { contains: keyword } },
      ];
    }

    const [withdraws, total] = await Promise.all([
      this.prisma.userWithdrawApply.findMany({
        where,
        orderBy: { [sort_field]: sort_order },
        skip,
        take: size,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              mobile: true,
            },
          },
        },
      }),
      this.prisma.userWithdrawApply.count({ where }),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records: withdraws,
        total,
        page,
        size,
      },
    };
  }

  async getWithdrawAccountList(userId: number, query: WithdrawAccountQueryDto) {
    const { account_type, account_id } = query;

    const where: any = {
      user_id: userId,
      is_delete: 0,
    };

    if (account_type) {
      where.account_type = account_type;
    }

    if (account_id) {
      where.account_id = account_id;
    }

    const accounts = await this.prisma.userWithdrawAccount.findMany({
      where,
      orderBy: { add_time: "desc" },
    });

    return {
      code: 200,
      message: "获取成功",
      data: accounts,
    };
  }

  async createWithdrawAccount(userId: number, body: CreateWithdrawAccountDto) {
    const { account_type, account_name, account_no, identity, bank_name } =
      body;

    // 检查账号数量限制
    const accountCount = await this.prisma.userWithdrawAccount.count({
      where: {
        user_id: userId,
        is_delete: 0,
      },
    });

    if (accountCount >= 15) {
      throw new ForbiddenException("最多添加15个提现账号");
    }

    // 检查是否已存在相同账号
    const existingAccount = await this.prisma.userWithdrawAccount.findFirst({
      where: {
        user_id: userId,
        account_no,
        account_type,
        is_delete: 0,
      },
    });

    if (existingAccount) {
      throw new ConflictException("该提现账号已存在");
    }

    const account = await this.prisma.userWithdrawAccount.create({
      data: {
        user_id: userId,
        account_type,
        account_name,
        account_no,
        identity,
        bank_name,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return {
      code: 200,
      message: "添加成功",
      data: {
        account_id: account.account_id,
      },
    };
  }

  async updateWithdrawAccount(
    userId: number,
    accountId: number,
    body: UpdateWithdrawAccountDto,
  ) {
    const { account_type, account_name, account_no, identity, bank_name } =
      body;

    // 检查账号是否存在
    const account = await this.prisma.userWithdrawAccount.findFirst({
      where: {
        account_id: accountId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!account) {
      throw new NotFoundException("提现账号不存在");
    }

    // 检查是否已存在相同账号（排除当前账号）
    const existingAccount = await this.prisma.userWithdrawAccount.findFirst({
      where: {
        user_id: userId,
        account_no,
        account_type,
        is_delete: 0,
        account_id: { not: accountId },
      },
    });

    if (existingAccount) {
      throw new ConflictException("该提现账号已存在");
    }

    await this.prisma.userWithdrawAccount.update({
      where: { account_id: accountId },
      data: {
        account_type,
        account_name,
        account_no,
        identity,
        bank_name,
      },
    });

    return {
      code: 200,
      message: "更新成功",
      data: null,
    };
  }

  async getWithdrawAccountDetail(userId: number, accountId: number) {
    const account = await this.prisma.userWithdrawAccount.findFirst({
      where: {
        account_id: accountId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!account) {
      throw new NotFoundException("提现账号不存在");
    }

    return {
      code: 200,
      message: "获取成功",
      data: account,
    };
  }

  async deleteWithdrawAccount(userId: number, accountId: number) {
    const account = await this.prisma.userWithdrawAccount.findFirst({
      where: {
        account_id: accountId,
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!account) {
      throw new NotFoundException("提现账号不存在");
    }

    await this.prisma.userWithdrawAccount.update({
      where: { account_id: accountId },
      data: { is_delete: 1 },
    });

    return {
      code: 200,
      message: "删除成功",
      data: null,
    };
  }

  async createWithdrawApply(userId: number, body: CreateWithdrawApplyDto) {
    const { amount, account_data } = body;

    // 检查用户余额
    const user = await this.prisma.user.findFirst({
      where: { user_id: userId },
      select: { balance: true, username: true },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    if (amount > user.balance) {
      throw new BadRequestException("提现金额大于账户可用余额");
    }

    // 生成提现单号
    const withdrawSn = this.generateWithdrawSn();

    try {
      // 使用事务处理
      const result = await this.prisma.$transaction(async (prisma) => {
        // 创建提现申请
        const withdraw = await prisma.userWithdrawApply.create({
          data: {
            user_id: userId,
            withdraw_sn: withdrawSn,
            amount,
            status: WithdrawStatus.PENDING,
            add_time: Math.floor(Date.now() / 1000),
          },
        });

        // 创建或保存提现账号
        let withdrawAccount;
        const existingAccount = await prisma.userWithdrawAccount.findFirst({
          where: {
            user_id: userId,
            account_no: account_data.account_no,
            account_type: account_data.account_type,
            is_delete: 0,
          },
        });

        if (existingAccount) {
          withdrawAccount = existingAccount;
        } else {
          withdrawAccount = await prisma.userWithdrawAccount.create({
            data: {
              user_id: userId,
              account_type: account_data.account_type,
              account_name: account_data.account_name,
              account_no: account_data.account_no,
              identity: account_data.identity,
              bank_name: account_data.bank_name,
              add_time: Math.floor(Date.now() / 1000),
            },
          });
        }

        // 更新用户余额
        await prisma.user.update({
          where: { user_id: userId },
          data: {
            balance: {
              decrement: amount,
            },
            frozen_balance: {
              increment: amount,
            },
          },
        });

        // 创建余额变动记录
        await prisma.userBalanceLog.create({
          data: {
            user_id: userId,
            balance: amount,
            change_desc: "提现申请",
            change_type: 2, // 提现类型
            add_time: Math.floor(Date.now() / 1000),
          },
        });

        // 创建管理员消息
        await prisma.adminMsg.create({
          data: {
            msg_type: 3, // 提现申请类型
            title: `您有新的提现申请，申请用户：${user.username}`,
            content: `用户【${user.username}】申请提现，申请金额：${amount}元`,
            related_data: {
              withdraw_apply_id: withdraw.id,
            },
            add_time: Math.floor(Date.now() / 1000),
          },
        });

        return withdraw;
      });

      return {
        code: 200,
        message: "申请成功",
        data: {
          withdraw_id: result.id,
          withdraw_sn: withdrawSn,
          amount,
          status: WithdrawStatus.PENDING,
        },
      };
    } catch (error) {
      throw new BadRequestException("提现申请失败：" + error.message);
    }
  }

  async getWithdrawStats(userId: number) {
    const [totalWithdraw, pendingWithdraw, successWithdraw, rejectedWithdraw] =
      await Promise.all([
        this.prisma.userWithdrawApply.aggregate({
          where: {
            user_id: userId,
            is_delete: 0,
          },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.userWithdrawApply.aggregate({
          where: {
            user_id: userId,
            status: WithdrawStatus.PENDING,
            is_delete: 0,
          },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.userWithdrawApply.aggregate({
          where: {
            user_id: userId,
            status: WithdrawStatus.APPROVED,
            is_delete: 0,
          },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.userWithdrawApply.aggregate({
          where: {
            user_id: userId,
            status: WithdrawStatus.REJECTED,
            is_delete: 0,
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        total_amount: totalWithdraw._sum.amount || 0,
        total_count: totalWithdraw._count,
        pending_amount: pendingWithdraw._sum.amount || 0,
        pending_count: pendingWithdraw._count,
        success_amount: successWithdraw._sum.amount || 0,
        success_count: successWithdraw._count,
        rejected_amount: rejectedWithdraw._sum.amount || 0,
        rejected_count: rejectedWithdraw._count,
      },
    };
  }

  async getWithdrawSettings() {
    // 获取提现设置
    const settings = await this.prisma.systemConfig.findMany({
      where: {
        config_key: {
          in: ["withdraw_min_amount", "withdraw_fee_rate", "withdraw_fee_min"],
        },
      },
    });

    const config: any = {};
    settings.forEach((setting) => {
      config[setting.config_key] = setting.config_value;
    });

    return {
      code: 200,
      message: "获取成功",
      data: {
        min_amount: parseFloat(config.withdraw_min_amount || "1"),
        fee_rate: parseFloat(config.withdraw_fee_rate || "0"),
        fee_min: parseFloat(config.withdraw_fee_min || "0"),
      },
    };
  }

  // 私有方法
  private generateWithdrawSn(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `WD${timestamp}${random}`;
  }

  private getAccountTypeName(accountType: number): string {
    switch (accountType) {
      case AccountType.BANK:
        return "银行卡";
      case AccountType.ALIPAY:
        return "支付宝";
      case AccountType.WECHAT:
        return "微信";
      case AccountType.PAYPAL:
        return "PayPal";
      default:
        return "其他";
    }
  }

  private getStatusText(status: number): string {
    switch (status) {
      case WithdrawStatus.PENDING:
        return "待审核";
      case WithdrawStatus.APPROVED:
        return "已通过";
      case WithdrawStatus.REJECTED:
        return "已拒绝";
      default:
        return "未知状态";
    }
  }
}
