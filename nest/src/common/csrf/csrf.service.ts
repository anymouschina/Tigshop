// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import {
  CsrfQueryDto,
  CsrfDetailDto,
  CreateCsrfDto,
  UpdateCsrfDto,
  DeleteCsrfDto,
  BatchDeleteCsrfDto,
  CSRF_TYPE,
  CSRF_STATUS,
} from "./csrf.dto";

@Injectable()
export class CsrfService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CsrfQueryDto) {
    const {
      keyword = "",
      type = -1,
      status = -1,
      page = 1,
      size = 15,
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { token: { contains: keyword } },
        { ip: { contains: keyword } },
        { user_agent: { contains: keyword } },
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
      this.prisma.csrf.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.csrf.count({ where }),
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
    const csrf = await this.prisma.csrf.findUnique({
      where: { id },
    });

    if (!csrf) {
      throw new Error("CSRF记录不存在");
    }

    return csrf;
  }

  async create(data: CreateCsrfDto) {
    const csrf = await this.prisma.csrf.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return csrf;
  }

  async update(data: UpdateCsrfDto) {
    const csrf = await this.prisma.csrf.findUnique({
      where: { id: data.id },
    });

    if (!csrf) {
      throw new Error("CSRF记录不存在");
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    delete updateData.id;

    const updatedCsrf = await this.prisma.csrf.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedCsrf;
  }

  async remove(id: number) {
    const csrf = await this.prisma.csrf.findUnique({
      where: { id },
    });

    if (!csrf) {
      throw new Error("CSRF记录不存在");
    }

    await this.prisma.csrf.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    await this.prisma.csrf.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async generateToken(userId?: number, type?: number) {
    const token = this.generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const csrf = await this.prisma.csrf.create({
      data: {
        token,
        user_id: userId || 0,
        type: type || 0,
        status: 1,
        expires_at: expiresAt,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return {
      token: csrf.token,
      expires_at: csrf.expires_at,
      csrf_id: csrf.id,
    };
  }

  async validateToken(token: string, userId?: number) {
    const csrf = await this.prisma.csrf.findFirst({
      where: {
        token,
        status: 1,
        expires_at: {
          gt: new Date(),
        },
        ...(userId && { user_id: userId }),
      },
    });

    if (!csrf) {
      throw new Error("无效的CSRF令牌");
    }

    if (csrf.used) {
      throw new Error("CSRF令牌已使用");
    }

    return {
      valid: true,
      csrf_id: csrf.id,
      user_id: csrf.user_id,
      type: csrf.type,
    };
  }

  async refreshToken(oldToken: string, userId?: number) {
    const oldCsrf = await this.prisma.csrf.findFirst({
      where: {
        token: oldToken,
        status: 1,
        ...(userId && { user_id: userId }),
      },
    });

    if (!oldCsrf) {
      throw new Error("无效的旧令牌");
    }

    await this.prisma.csrf.update({
      where: { id: oldCsrf.id },
      data: { status: 0, update_time: new Date() },
    });

    return await this.generateToken(userId, oldCsrf.type);
  }

  async getCsrfStats() {
    const stats = await this.prisma.csrf.groupBy({
      by: ["type", "status"],
      _count: {
        _all: true,
      },
    });

    const typeStats = {};
    const statusStats = {};

    stats.forEach((stat) => {
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
      total: await this.prisma.csrf.count(),
      type_stats: typeStats,
      status_stats: statusStats,
      detailed_stats: stats,
    };
  }

  async cleanupExpiredTokens() {
    const now = new Date();
    const result = await this.prisma.csrf.deleteMany({
      where: {
        OR: [{ expires_at: { lt: now } }, { status: 0 }],
      },
    });

    return {
      message: "清理完成",
      cleaned_count: result.count,
      cleaned_at: now,
    };
  }

  private generateRandomToken(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
