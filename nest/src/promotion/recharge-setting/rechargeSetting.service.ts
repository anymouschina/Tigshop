// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import {
  CreateRechargeSettingDto,
  UpdateRechargeSettingDto,
  RechargeSettingQueryDto,
  RechargeSettingStatus,
  RechargeSettingConfigDto,
} from "./dto/rechargeSetting.dto";

@Injectable()
export class RechargeSettingService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: RechargeSettingQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "setting_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { setting_id: { contains: keyword } },
        { status: { contains: keyword } },
        { sort: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

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
      where: { setting_id: id },
    });

    if (!item) {
      throw new NotFoundException("充值设置不存在");
    }

    return item;
  }

  async create(createDto: CreateRechargeSettingDto) {
    if (createDto.amount <= 0) {
      throw new BadRequestException("充值金额必须大于0");
    }

    const item = await this.prisma.recharge_setting.create({
      data: {
        amount: createDto.amount,
        give_amount: createDto.giveAmount,
        status: createDto.status,
        sort: createDto.sort,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateRechargeSettingDto) {
    const item = await this.prisma.recharge_setting.findUnique({
      where: { setting_id: id },
    });

    if (!item) {
      throw new NotFoundException("充值设置不存在");
    }

    const updateData: any = {};
    if (updateDto.amount !== undefined) {
      updateData.amount = updateDto.amount;
    }
    if (updateDto.giveAmount !== undefined) {
      updateData.give_amount = updateDto.giveAmount;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }
    if (updateDto.sort !== undefined) {
      updateData.sort = updateDto.sort;
    }

    const updatedItem = await this.prisma.recharge_setting.update({
      where: { setting_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.recharge_setting.findUnique({
      where: { setting_id: id },
    });

    if (!item) {
      throw new NotFoundException("充值设置不存在");
    }

    await this.prisma.recharge_setting.delete({
      where: { setting_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.recharge_setting.deleteMany({
      where: { setting_id: { in: ids } },
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
