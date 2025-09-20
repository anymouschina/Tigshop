// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateTimeDiscountDto,
  UpdateTimeDiscountDto,
  TimeDiscountQueryDto,
  TimeDiscountStatus,
  TimeDiscountConfigDto
} from './dto/timeDiscount.dto';

@Injectable()
export class TimeDiscountService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: TimeDiscountQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = 'discount_id',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { discount_id: { contains: keyword } },
        { name: { contains: keyword } },
        { discount: { contains: keyword } },
        { status: { contains: keyword } }
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.time_discount.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.time_discount.count({ where }),
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
    const item = await this.prisma.time_discount.findUnique({
      where: { discount_id: id },
    });

    if (!item) {
      throw new NotFoundException('时段折扣不存在');
    }

    return item;
  }

  async create(createDto: CreateTimeDiscountDto) {
    if (createDto.discount <= 0 || createDto.discount > 1) {
      throw new BadRequestException('折扣必须在0-1之间');
    }

    const item = await this.prisma.time_discount.create({
      data: {
        name: createDto.name,
        start_time: Math.floor(new Date(createDto.startTime).getTime() / 1000),
        end_time: Math.floor(new Date(createDto.endTime).getTime() / 1000),
        discount: createDto.discount,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateTimeDiscountDto) {
    const item = await this.prisma.time_discount.findUnique({
      where: { discount_id: id },
    });

    if (!item) {
      throw new NotFoundException('时段折扣不存在');
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.startTime !== undefined) {
      updateData.start_time = Math.floor(new Date(updateDto.startTime).getTime() / 1000);
    }
    if (updateDto.endTime !== undefined) {
      updateData.end_time = Math.floor(new Date(updateDto.endTime).getTime() / 1000);
    }
    if (updateDto.discount !== undefined) {
      updateData.discount = updateDto.discount;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.time_discount.update({
      where: { discount_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.time_discount.findUnique({
      where: { discount_id: id },
    });

    if (!item) {
      throw new NotFoundException('时段折扣不存在');
    }

    await this.prisma.time_discount.delete({
      where: { discount_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.time_discount.deleteMany({
      where: { discount_id: { in: ids } },
    });
  }

  async getConfig(): Promise<TimeDiscountConfigDto> {
    return {
      statusConfig: {
        [TimeDiscountStatus.DISABLED]: '禁用',
        [TimeDiscountStatus.ENABLED]: '启用'
      },
    };
  }
}
