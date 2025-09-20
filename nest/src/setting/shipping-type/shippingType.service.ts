// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateShippingTypeDto,
  UpdateShippingTypeDto,
  ShippingTypeQueryDto,
  ShippingTypeStatus,
  ShippingTypeConfigDto
} from './dto/shippingType.dto';

@Injectable()
export class ShippingTypeService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: ShippingTypeQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = 'type_id',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { type_id: { contains: keyword } },
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { icon: { contains: keyword } },
        { status: { contains: keyword } },
        { sort: { contains: keyword } }
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.shipping_type.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.shipping_type.count({ where }),
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
    const item = await this.prisma.shipping_type.findUnique({
      where: { type_id: id },
    });

    if (!item) {
      throw new NotFoundException('配送方式不存在');
    }

    return item;
  }

  async create(createDto: CreateShippingTypeDto) {
    

    const item = await this.prisma.shipping_type.create({
      data: {
        name: createDto.name,
        code: createDto.code,
        icon: createDto.icon,
        status: createDto.status,
        sort: createDto.sort,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateShippingTypeDto) {
    const item = await this.prisma.shipping_type.findUnique({
      where: { type_id: id },
    });

    if (!item) {
      throw new NotFoundException('配送方式不存在');
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.code !== undefined) {
      updateData.code = updateDto.code;
    }
    if (updateDto.icon !== undefined) {
      updateData.icon = updateDto.icon;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }
    if (updateDto.sort !== undefined) {
      updateData.sort = updateDto.sort;
    }

    const updatedItem = await this.prisma.shipping_type.update({
      where: { type_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.shipping_type.findUnique({
      where: { type_id: id },
    });

    if (!item) {
      throw new NotFoundException('配送方式不存在');
    }

    await this.prisma.shipping_type.delete({
      where: { type_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.shipping_type.deleteMany({
      where: { type_id: { in: ids } },
    });
  }

  async getConfig(): Promise<ShippingTypeConfigDto> {
    return {
      statusConfig: {
        [ShippingTypeStatus.DISABLED]: '禁用',
        [ShippingTypeStatus.ENABLED]: '启用'
      },
    };
  }
}
