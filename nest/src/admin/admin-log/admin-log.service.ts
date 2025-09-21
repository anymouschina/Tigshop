// @ts-nocheck
import { Injectable } from "@nestjs/common";
import {
  AdminLogQueryDto,
  AdminLogDetailDto,
  CreateAdminLogDto,
  DeleteAdminLogDto,
  BatchDeleteAdminLogDto,
  ADMIN_LOG_TYPE,
  ADMIN_LOG_MODULE,
} from "./admin-log.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminLogService {
  constructor(private databaseService: PrismaService) {}

  async findAll(query: AdminLogQueryDto) {
    const {
      keyword = "",
      admin_id = 0,
      type = -1,
      module = -1,
      start_date = "",
      end_date = "",
      page = 1,
      size = 15,
      sort_field = "log_id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.log_info = { contains: keyword };
    }

    if (admin_id > 0) {
      where.user_id = admin_id;
    }

    // 时间范围过滤
    if (start_date && end_date) {
      where.log_time = {
        gte: Math.floor(new Date(start_date).getTime() / 1000),
        lte: Math.floor(new Date(end_date).getTime() / 1000),
      };
    } else if (start_date) {
      where.log_time = {
        gte: Math.floor(new Date(start_date).getTime() / 1000),
      };
    } else if (end_date) {
      where.log_time = {
        lte: Math.floor(new Date(end_date).getTime() / 1000),
      };
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.databaseService.admin_log.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.databaseService.admin_log.count({ where }),
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
    const adminLog = await this.databaseService.admin_log.findUnique({
      where: { log_id: id },
    });

    if (!adminLog) {
      throw new Error("日志不存在");
    }

    return adminLog;
  }

  async create(data: CreateAdminLogDto) {
    const adminLog = await this.databaseService.admin_log.create({
      data: {
        user_id: data.admin_id,
        log_info: data.description,
        ip_address: data.ip || "",
        log_time: Math.floor(Date.now() / 1000),
      },
    });

    return adminLog;
  }

  async remove(id: number) {
    const adminLog = await this.databaseService.admin_log.findUnique({
      where: { log_id: id },
    });

    if (!adminLog) {
      throw new Error("日志不存在");
    }

    await this.databaseService.admin_log.delete({
      where: { log_id: id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.databaseService.admin_log.deleteMany({
      where: {
        log_id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getOperationStats(
    adminId?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};
    if (adminId && adminId > 0) {
      where.user_id = adminId;
    }

    if (startDate && endDate) {
      where.log_time = {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000),
      };
    }

    const result = await this.databaseService.admin_log.groupBy({
      by: ["user_id"],
      where,
      _count: {
        _all: true,
      },
    });

    return result;
  }

  async getActiveAdminsStats(days: number = 30) {
    const startDate = Math.floor(
      (Date.now() - days * 24 * 60 * 60 * 1000) / 1000,
    );

    const result = await this.databaseService.admin_log.groupBy({
      by: ["user_id"],
      where: {
        log_time: {
          gte: startDate,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          user_id: "desc",
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
    ip: string = "",
    userAgent: string = "",
    url: string = "",
    method: string = "",
    params: string = "",
  ) {
    const logInfo = `${ADMIN_LOG_MODULE[module] || "未知模块"} - ${ADMIN_LOG_TYPE[type] || "未知操作"} - ${description}`;

    return await this.databaseService.admin_log.create({
      data: {
        user_id: adminId,
        log_info: logInfo,
        ip_address: ip,
        log_time: Math.floor(Date.now() / 1000),
      },
    });
  }
}
