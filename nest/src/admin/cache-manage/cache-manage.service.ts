import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  CacheManageQueryDto,
  CacheManageDetailDto,
  CreateCacheManageDto,
  UpdateCacheManageDto,
  DeleteCacheManageDto,
  BatchDeleteCacheManageDto,
  CACHE_TYPE,
  CACHE_STATUS
} from './cache-manage.dto';

@Injectable()
export class CacheManageService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CacheManageQueryDto) {
    const {
      keyword = '',
      type = -1,
      status = -1,
      page = 1,
      size = 15,
      sort_field = 'id',
      sort_order = 'desc',
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { key: { contains: keyword } },
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (type >= 0) {
      where.type = type;
    }

    if (status >= 0) {
      where.status = status;
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.cacheManage.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.cacheManage.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const cacheManage = await this.prisma.cacheManage.findUnique({
      where: { id },
    });

    if (!cacheManage) {
      throw new Error('缓存管理记录不存在');
    }

    return cacheManage;
  }

  async create(data: CreateCacheManageDto) {
    const existingCache = await this.prisma.cacheManage.findFirst({
      where: { key: data.key },
    });

    if (existingCache) {
      throw new Error('缓存键已存在');
    }

    const cacheManage = await this.prisma.cacheManage.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return cacheManage;
  }

  async update(data: UpdateCacheManageDto) {
    const cacheManage = await this.prisma.cacheManage.findUnique({
      where: { id: data.id },
    });

    if (!cacheManage) {
      throw new Error('缓存管理记录不存在');
    }

    if (data.key && data.key !== cacheManage.key) {
      const existingCache = await this.prisma.cacheManage.findFirst({
        where: { key: data.key },
      });

      if (existingCache) {
        throw new Error('缓存键已存在');
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    delete updateData.id;

    const updatedCacheManage = await this.prisma.cacheManage.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedCacheManage;
  }

  async remove(id: number) {
    const cacheManage = await this.prisma.cacheManage.findUnique({
      where: { id },
    });

    if (!cacheManage) {
      throw new Error('缓存管理记录不存在');
    }

    await this.prisma.cacheManage.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.prisma.cacheManage.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async clearAllCache() {
    await this.prisma.cacheManage.deleteMany();

    return {
      message: '所有缓存已清空',
      cleared_at: new Date(),
    };
  }

  async clearTypeCache(type: number) {
    if (!Object.values(CACHE_TYPE).includes(type)) {
      throw new Error('无效的缓存类型');
    }

    const result = await this.prisma.cacheManage.deleteMany({
      where: { type },
    });

    return {
      message: `${CACHE_TYPE[type]}类型缓存已清空`,
      cleared_count: result.count,
      cleared_at: new Date(),
    };
  }

  async getCacheStats() {
    const stats = await this.prisma.cacheManage.groupBy({
      by: ['type', 'status'],
      _count: {
        _all: true,
      },
    });

    const typeStats = {};
    const statusStats = {};

    stats.forEach(stat => {
      if (!typeStats[stat.type]) {
        typeStats[stat.type] = 0;
      }
      typeStats[stat.type] += stat._count._all;

      if (!statusStats[stat.status]) {
        statusStats[stat.status] = 0;
      }
      statusStats[stat.status] += stat._count._all;
    });

    return {
      total: await this.prisma.cacheManage.count(),
      type_stats: typeStats,
      status_stats: statusStats,
      detailed_stats: stats,
    };
  }
}