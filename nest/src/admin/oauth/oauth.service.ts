import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  OauthQueryDto,
  OauthDetailDto,
  CreateOauthDto,
  UpdateOauthDto,
  DeleteOauthDto,
  BatchDeleteOauthDto,
  OAUTH_TYPE,
  OAUTH_STATUS
} from './oauth.dto';

@Injectable()
export class OauthService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: OauthQueryDto) {
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
        { name: { contains: keyword } },
        { app_id: { contains: keyword } },
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
      this.prisma.oauth.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.oauth.count({ where }),
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
    const oauth = await this.prisma.oauth.findUnique({
      where: { id },
    });

    if (!oauth) {
      throw new Error('OAuth配置不存在');
    }

    return oauth;
  }

  async create(data: CreateOauthDto) {
    const existingOauth = await this.prisma.oauth.findFirst({
      where: { app_id: data.app_id },
    });

    if (existingOauth) {
      throw new Error('应用ID已存在');
    }

    const oauth = await this.prisma.oauth.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return oauth;
  }

  async update(data: UpdateOauthDto) {
    const oauth = await this.prisma.oauth.findUnique({
      where: { id: data.id },
    });

    if (!oauth) {
      throw new Error('OAuth配置不存在');
    }

    if (data.app_id && data.app_id !== oauth.app_id) {
      const existingOauth = await this.prisma.oauth.findFirst({
        where: { app_id: data.app_id },
      });

      if (existingOauth) {
        throw new Error('应用ID已存在');
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    delete updateData.id;

    const updatedOauth = await this.prisma.oauth.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedOauth;
  }

  async remove(id: number) {
    const oauth = await this.prisma.oauth.findUnique({
      where: { id },
    });

    if (!oauth) {
      throw new Error('OAuth配置不存在');
    }

    await this.prisma.oauth.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.prisma.oauth.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async updateStatus(id: number, status: number) {
    const oauth = await this.prisma.oauth.findUnique({
      where: { id },
    });

    if (!oauth) {
      throw new Error('OAuth配置不存在');
    }

    if (!Object.values(OAUTH_STATUS).includes(status)) {
      throw new Error('无效的状态值');
    }

    const updatedOauth = await this.prisma.oauth.update({
      where: { id },
      data: { status, update_time: new Date() },
    });

    return updatedOauth;
  }

  async getOauthStats() {
    const stats = await this.prisma.oauth.groupBy({
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
      total: await this.prisma.oauth.count(),
      type_stats: typeStats,
      status_stats: statusStats,
      detailed_stats: stats,
    };
  }
}