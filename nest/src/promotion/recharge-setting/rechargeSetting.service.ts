// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateRechargeSettingDto,
  UpdateRechargeSettingDto,
  RechargeSettingQueryDto,
  RechargeSettingStatus,
  RechargeSettingConfigDto,
} from "./dto/rechargeSetting.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class RechargeSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: RechargeSettingQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "recharge_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      // recharge_setting 没有文本字段，尝试按数字匹配金额或排序
      const num = Number(keyword);
      if (!Number.isNaN(num)) {
        where.OR = [
          { money: num },
          { discount_money: num },
          { sort_order: Math.trunc(num) },
        ];
      }
    }

    if (status !== undefined) {
      // 兼容老的 status（0/1）到 is_show（false/true）
      where.is_show = status === 1;
    }

    const allowedSortFields = new Set([
      "recharge_id",
      "money",
      "discount_money",
      "sort_order",
      "is_show",
    ]);
    const orderBy: any = {};
    orderBy[allowedSortFields.has(sortField) ? sortField : "recharge_id"] =
      sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.recharge_setting.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.recharge_setting.count({ where }),
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
    const item = await this.prisma.recharge_setting.findUnique({
      where: { recharge_id: id },
    });

    if (!item) {
      throw new NotFoundException("充值设置不存在");
    }

    return item;
  }

  async create(createDto: CreateRechargeSettingDto) {
    const amount = (createDto as any).amount ?? (createDto as any).Amount;
    const giveAmount = (createDto as any).giveAmount ?? (createDto as any).GiveAmount;
    const sort = (createDto as any).sort ?? (createDto as any).Sort;
    const status = (createDto as any).status ?? (createDto as any).Status;

    if (amount <= 0) {
      throw new BadRequestException("充值金额必须大于0");
    }

    const item = await this.prisma.recharge_setting.create({
      data: {
        money: amount,
        discount_money: giveAmount ?? 0,
        is_show: status === 1,
        sort_order: sort ?? 1,
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateRechargeSettingDto) {
    const item = await this.prisma.recharge_setting.findUnique({
      where: { recharge_id: id },
    });

    if (!item) {
      throw new NotFoundException("充值设置不存在");
    }

    const updateData: any = {};
    const amount = (updateDto as any).amount ?? (updateDto as any).Amount;
    const giveAmount = (updateDto as any).giveAmount ?? (updateDto as any).GiveAmount;
    const status = (updateDto as any).status ?? (updateDto as any).Status;
    const sort = (updateDto as any).sort ?? (updateDto as any).Sort;

    if (amount !== undefined) {
      updateData.money = amount;
    }
    if (giveAmount !== undefined) {
      updateData.discount_money = giveAmount;
    }
    if (status !== undefined) {
      updateData.is_show = status === 1;
    }
    if (sort !== undefined) {
      updateData.sort_order = sort;
    }

    const updatedItem = await this.prisma.recharge_setting.update({
      where: { recharge_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.recharge_setting.findUnique({
      where: { recharge_id: id },
    });

    if (!item) {
      throw new NotFoundException("充值设置不存在");
    }

    await this.prisma.recharge_setting.delete({
      where: { recharge_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.recharge_setting.deleteMany({
      where: { recharge_id: { in: ids } },
    });
  }

  async getConfig(): Promise<RechargeSettingConfigDto> {
    return {
      statusConfig: {
        [RechargeSettingStatus.DISABLED]: "禁用",
        [RechargeSettingStatus.ENABLED]: "启用",
      },
    };
  }
}
