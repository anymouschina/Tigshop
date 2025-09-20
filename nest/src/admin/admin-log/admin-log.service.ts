import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  AdminLogQueryDto,
  AdminLogDetailDto,
  CreateAdminLogDto,
  DeleteAdminLogDto,
  BatchDeleteAdminLogDto,
  ADMIN_LOG_TYPE,
  ADMIN_LOG_MODULE
} from './admin-log.dto';

@Injectable()
export class AdminLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AdminLogQueryDto) {
    const {
      keyword = '',
      admin_id = 0,
      type = -1,
      module = -1,
      start_date = '',
      end_date = '',
      page = 1,
      size = 15,
      sort_field = 'id',
      sort_order = 'desc',
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { description: { contains: keyword } },
        { ip: { contains: keyword } },
        { user_agent: { contains: keyword } },
        { admin: { username: { contains: keyword } } },
        { admin: { nickname: { contains: keyword } } },
      ];
    }

    if (admin_id > 0) {
      where.admin_id = admin_id;
    }

    if (type >= 0) {
      where.type = type;
    }

    if (module >= 0) {
      where.module = module;
    }

    if (start_date && end_date) {
      where.create_time = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    } else if (start_date) {
      where.create_time = {
        gte: new Date(start_date),
      };
    } else if (end_date) {
      where.create_time = {
        lte: new Date(end_date),
      };
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        include: {
          admin: {
            select: {
              admin_id: true,
              username: true,
              nickname: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.adminLog.count({ where }),
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
    const adminLog = await this.prisma.adminLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            admin_id: true,
            username: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!adminLog) {
      throw new Error('日志不存在');
    }

    return adminLog;
  }

  async create(data: CreateAdminLogDto) {
    const adminLog = await this.prisma.adminLog.create({
      data: {
        ...data,
        create_time: new Date(),
      },
    });

    return adminLog;
  }

  async remove(id: number) {
    const adminLog = await this.prisma.adminLog.findUnique({
      where: { id },
    });

    if (!adminLog) {
      throw new Error('日志不存在');
    }

    await this.prisma.adminLog.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.prisma.adminLog.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getOperationStats(adminId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (adminId && adminId > 0) {
      where.admin_id = adminId;
    }

    if (startDate && endDate) {
      where.create_time = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const result = await this.prisma.adminLog.groupBy({
      by: ['type', 'module'],
      where,
      _count: {
        _all: true,
      },
    });

    return result;
  }

  async getActiveAdminsStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.prisma.adminLog.groupBy({
      by: ['admin_id'],
      where: {
        create_time: {
          gte: startDate,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          admin_id: 'desc',
        },
      },
    });

    return result;
  }

  async logOperation(
    adminId: number,
    type: number,
    module: number,
    description: string,
    ip: string = '',
    userAgent: string = '',
    url: string = '',
    method: string = '',
    params: string = '',
  ) {
    return await this.prisma.adminLog.create({
      data: {
        admin_id: adminId,
        type,
        module,
        description,
        ip,
        user_agent: userAgent,
        url,
        method,
        params,
        create_time: new Date(),
      },
    });
  }
}