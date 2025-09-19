import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateHomeDto,
  UpdateHomeDto,
  HomeQueryDto,
  HomeStatus,
  HomeConfigDto
} from './dto/home.dto';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: HomeQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = 'home_id',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { home_id: { contains: keyword } },
        { name: { contains: keyword } },
        { type: { contains: keyword } },
        { content: { contains: keyword } },
        { status: { contains: keyword } }
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.home.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.home.count({ where }),
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
    const item = await this.prisma.home.findUnique({
      where: { home_id: id },
    });

    if (!item) {
      throw new NotFoundException('首页不存在');
    }

    return item;
  }

  async create(createDto: CreateHomeDto) {
    

    const item = await this.prisma.home.create({
      data: {
        name: createDto.name,
        type: createDto.type,
        content: createDto.content,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateHomeDto) {
    const item = await this.prisma.home.findUnique({
      where: { home_id: id },
    });

    if (!item) {
      throw new NotFoundException('首页不存在');
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.type !== undefined) {
      updateData.type = updateDto.type;
    }
    if (updateDto.content !== undefined) {
      updateData.content = updateDto.content;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.home.update({
      where: { home_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.home.findUnique({
      where: { home_id: id },
    });

    if (!item) {
      throw new NotFoundException('首页不存在');
    }

    await this.prisma.home.delete({
      where: { home_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.home.deleteMany({
      where: { home_id: { in: ids } },
    });
  }

  async getConfig(): Promise<HomeConfigDto> {
    return {
      statusConfig: {
        [HomeStatus.DISABLED]: '禁用',
        [HomeStatus.ENABLED]: '启用'
      },
    };
  }
}
