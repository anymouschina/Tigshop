// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateShippingTplDto,
  UpdateShippingTplDto,
  ShippingTplQueryDto,
  ShippingTplStatus,
  ShippingTplConfigDto
} from './dto/shippingTpl.dto';

@Injectable()
export class ShippingTplService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: ShippingTplQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = 'tpl_id',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { tpl_id: { contains: keyword } },
        { name: { contains: keyword } },
        { is_default: { contains: keyword } },
        { status: { contains: keyword } }
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.shipping_tpl.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.shipping_tpl.count({ where }),
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
    const item = await this.prisma.shipping_tpl.findUnique({
      where: { tpl_id: id },
    });

    if (!item) {
      throw new NotFoundException('运费模板不存在');
    }

    return item;
  }

  async create(createDto: CreateShippingTplDto) {
    

    const item = await this.prisma.shipping_tpl.create({
      data: {
        name: createDto.name,
        is_default: createDto.isDefault,
        free_amount: createDto.freeAmount,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateShippingTplDto) {
    const item = await this.prisma.shipping_tpl.findUnique({
      where: { tpl_id: id },
    });

    if (!item) {
      throw new NotFoundException('运费模板不存在');
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.isDefault !== undefined) {
      updateData.is_default = updateDto.isDefault;
    }
    if (updateDto.freeAmount !== undefined) {
      updateData.free_amount = updateDto.freeAmount;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.shipping_tpl.update({
      where: { tpl_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.shipping_tpl.findUnique({
      where: { tpl_id: id },
    });

    if (!item) {
      throw new NotFoundException('运费模板不存在');
    }

    await this.prisma.shipping_tpl.delete({
      where: { tpl_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.shipping_tpl.deleteMany({
      where: { tpl_id: { in: ids } },
    });
  }

  async getConfig(): Promise<ShippingTplConfigDto> {
    return {
      statusConfig: {
        [ShippingTplStatus.DISABLED]: '禁用',
        [ShippingTplStatus.ENABLED]: '启用'
      },
    };
  }
}
