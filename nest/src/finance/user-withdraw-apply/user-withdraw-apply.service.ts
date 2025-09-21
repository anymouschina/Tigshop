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
      where.status = status;
    }

    if (userId) {
      where.user_id = userId;
    }

    if (withdrawType) {
      where.withdraw_type = withdrawType;
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

    const [records, total] = await Promise.all([
      this.prisma.user_withdraw_apply.findMany({
        where,
        skip,
        take: size,
        orderBy,
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
              mobile: true,
            },
          },
        },
      }),
      this.prisma.user_withdraw_apply.count({ where }),
    ]);

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
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!apply) {
      throw new NotFoundException("提现申请不存在");
    }

    return apply;
  }

  async create(createDto: CreateUserWithdrawApplyDto) {
    if (createDto.amount <= 0) {
      throw new BadRequestException("提现金额必须大于0");
    }

    const apply = await this.prisma.user_withdraw_apply.create({
      data: {
        user_id: createDto.userId,
        amount: createDto.amount,
        postscript: createDto.postscript || "",
        withdraw_type: createDto.accountData.type,
        account_name: createDto.accountData.name,
        account_data: JSON.stringify(createDto.accountData),
        status: createDto.status || WithdrawStatus.PENDING,
        add_time: Math.floor(Date.now() / 1000),
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    return apply;
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
      updateData.status = updateDto.status;

      if (
        updateDto.status === WithdrawStatus.APPROVED &&
        apply.status !== WithdrawStatus.APPROVED
      ) {
        updateData.process_time = Math.floor(Date.now() / 1000);
      }

      if (
        updateDto.status === WithdrawStatus.COMPLETED &&
        apply.status !== WithdrawStatus.COMPLETED
      ) {
        updateData.complete_time = Math.floor(Date.now() / 1000);
      }
    }

    if (updateDto.postscript !== undefined) {
      updateData.postscript = updateDto.postscript;
    }

    if (updateDto.applyReply !== undefined) {
      updateData.apply_reply = updateDto.applyReply;
    }

    if (updateDto.adminRemark !== undefined) {
      updateData.admin_remark = updateDto.adminRemark;
    }

    if (updateDto.processTime !== undefined) {
      updateData.process_time = Math.floor(
        new Date(updateDto.processTime).getTime() / 1000,
      );
    }

    if (updateDto.completeTime !== undefined) {
      updateData.complete_time = Math.floor(
        new Date(updateDto.completeTime).getTime() / 1000,
      );
    }

    if (updateDto.tradeNo !== undefined) {
      updateData.trade_no = updateDto.tradeNo;
    }

    const updatedApply = await this.prisma.user_withdraw_apply.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    return updatedApply;
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
