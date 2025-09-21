// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export enum LogCategory {
  SYSTEM = "system",
  USER = "user",
  ORDER = "order",
  PRODUCT = "product",
  PAYMENT = "payment",
  AUTH = "auth",
  API = "api",
  DATABASE = "database",
  SECURITY = "security",
  PERFORMANCE = "performance",
}

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: any;
  userId?: number;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
}

export interface LogQuery {
  level?: LogLevel;
  category?: LogCategory;
  userId?: number;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  startTime?: Date;
  endTime?: Date;
  message?: string;
  page?: number;
  limit?: number;
  sortBy?: "timestamp" | "level" | "category";
  sortOrder?: "asc" | "desc";
}

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  // 记录日志
  async log(entry: LogEntry): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          level: entry.level,
          category: entry.category,
          message: entry.message,
          metadata: entry.metadata || {},
          user_id: entry.userId,
          request_id: entry.requestId,
          ip: entry.ip,
          user_agent: entry.userAgent,
          path: entry.path,
          method: entry.method,
          status_code: entry.statusCode,
          response_time: entry.responseTime,
          error: entry.error ? JSON.stringify(entry.error) : null,
        },
      });
    } catch (error) {
      console.error("Failed to save log entry:", error);
    }
  }

  // 快捷方法
  async error(message: string, metadata?: any, userId?: number): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message,
      metadata,
      userId,
    });
  }

  async warn(message: string, metadata?: any, userId?: number): Promise<void> {
    await this.log({
      level: LogLevel.WARN,
      category: LogCategory.SYSTEM,
      message,
      metadata,
      userId,
    });
  }

  async info(message: string, metadata?: any, userId?: number): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message,
      metadata,
      userId,
    });
  }

  async debug(message: string, metadata?: any, userId?: number): Promise<void> {
    await this.log({
      level: LogLevel.DEBUG,
      category: LogCategory.SYSTEM,
      message,
      metadata,
      userId,
    });
  }

  // 分类日志
  async logApiRequest(
    entry: Omit<LogEntry, "level" | "category">,
  ): Promise<void> {
    await this.log({
      ...entry,
      level: LogLevel.INFO,
      category: LogCategory.API,
    });
  }

  async logError(entry: Omit<LogEntry, "level" | "category">): Promise<void> {
    await this.log({
      ...entry,
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
    });
  }

  async logSecurityEvent(
    entry: Omit<LogEntry, "level" | "category">,
  ): Promise<void> {
    await this.log({
      ...entry,
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
    });
  }

  async logPerformance(
    entry: Omit<LogEntry, "level" | "category">,
  ): Promise<void> {
    await this.log({
      ...entry,
      level: LogLevel.INFO,
      category: LogCategory.PERFORMANCE,
    });
  }

  // 查询日志
  async getLogs(query: LogQuery): Promise<{
    logs: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const offset = (page - 1) * limit;

    const where = this.buildWhereClause(query);
    const orderBy = this.buildOrderBy(query);

    const [logs, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  private buildWhereClause(query: LogQuery): any {
    const where: any = {};

    if (query.level) {
      where.level = query.level;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.userId) {
      where.user_id = query.userId;
    }

    if (query.requestId) {
      where.request_id = query.requestId;
    }

    if (query.path) {
      where.path = { contains: query.path };
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.statusCode) {
      where.status_code = query.statusCode;
    }

    if (query.message) {
      where.message = { contains: query.message };
    }

    if (query.startTime && query.endTime) {
      where.created_at = {
        gte: query.startTime,
        lte: query.endTime,
      };
    }

    return where;
  }

  private buildOrderBy(query: LogQuery): any {
    const sortBy = query.sortBy || "timestamp";
    const sortOrder = query.sortOrder || "desc";

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    return orderBy;
  }

  // 获取日志统计
  async getLogStats(timeRange?: { start: Date; end: Date }): Promise<{
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByCategory: Record<LogCategory, number>;
    errorRate: number;
    avgResponseTime: number;
    topErrorPaths: Array<{ path: string; count: number }>;
    topUserAgents: Array<{ userAgent: string; count: number }>;
  }> {
    const baseWhere = timeRange
      ? {
          created_at: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        }
      : {};

    const [
      totalLogs,
      logsByLevel,
      logsByCategory,
      errorLogs,
      apiLogs,
      errorPaths,
      userAgents,
    ] = await Promise.all([
      this.prisma.log.count({ where: baseWhere }),
      this.getLogsByLevel(baseWhere),
      this.getLogsByCategory(baseWhere),
      this.prisma.log.count({ where: { ...baseWhere, level: LogLevel.ERROR } }),
      this.prisma.log.findMany({
        where: {
          ...baseWhere,
          category: LogCategory.API,
          response_time: { not: null },
        },
        select: { response_time: true },
      }),
      this.getErrorPaths(baseWhere),
      this.getTopUserAgents(baseWhere),
    ]);

    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
    const avgResponseTime =
      apiLogs.length > 0
        ? apiLogs.reduce((sum, log) => sum + (log.response_time || 0), 0) /
          apiLogs.length
        : 0;

    return {
      totalLogs,
      logsByLevel,
      logsByCategory,
      errorRate,
      avgResponseTime,
      topErrorPaths: errorPaths,
      topUserAgents: userAgents,
    };
  }

  private async getLogsByLevel(
    baseWhere: any,
  ): Promise<Record<LogLevel, number>> {
    const results = await this.prisma.log.groupBy({
      by: ["level"],
      where: baseWhere,
      _count: { level: true },
    });

    const stats: Record<LogLevel, number> = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.DEBUG]: 0,
    };

    results.forEach((result) => {
      stats[result.level] = result._count.level;
    });

    return stats;
  }

  private async getLogsByCategory(
    baseWhere: any,
  ): Promise<Record<LogCategory, number>> {
    const results = await this.prisma.log.groupBy({
      by: ["category"],
      where: baseWhere,
      _count: { category: true },
    });

    const stats: Record<LogCategory, number> = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.DEBUG]: 0,
    } as any;

    results.forEach((result) => {
      stats[result.category] = result._count.category;
    });

    return stats;
  }

  private async getErrorPaths(
    baseWhere: any,
  ): Promise<Array<{ path: string; count: number }>> {
    const results = await this.prisma.log.groupBy({
      by: ["path"],
      where: { ...baseWhere, level: LogLevel.ERROR },
      _count: { path: true },
      orderBy: {
        _count: {
          path: "desc",
        },
      },
      take: 10,
    });

    return results.map((result) => ({
      path: result.path,
      count: result._count.path,
    }));
  }

  private async getTopUserAgents(
    baseWhere: any,
  ): Promise<Array<{ userAgent: string; count: number }>> {
    const results = await this.prisma.log.groupBy({
      by: ["user_agent"],
      where: { ...baseWhere, user_agent: { not: null } },
      _count: { user_agent: true },
      orderBy: {
        _count: {
          user_agent: "desc",
        },
      },
      take: 10,
    });

    return results.map((result) => ({
      userAgent: result.user_agent,
      count: result._count.user_agent,
    }));
  }

  // 日志清理
  async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.log.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  // 导出日志
  async exportLogs(query: LogQuery): Promise<string> {
    const where = this.buildWhereClause(query);
    const logs = await this.prisma.log.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 10000, // 限制导出数量
    });

    // 转换为CSV格式
    const headers = [
      "Timestamp",
      "Level",
      "Category",
      "Message",
      "User ID",
      "Request ID",
      "IP",
      "Path",
      "Method",
      "Status Code",
      "Response Time",
      "Metadata",
    ];

    const csvRows = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.created_at.toISOString(),
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.user_id || "",
          log.request_id || "",
          log.ip || "",
          log.path || "",
          log.method || "",
          log.status_code || "",
          log.response_time || "",
          `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ];

    return csvRows.join("\n");
  }

  // 审计日志
  async audit(action: string, userId: number, metadata?: any): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      category: LogCategory.SECURITY,
      message: `Audit: ${action}`,
      metadata: { action, ...metadata },
      userId,
    });
  }

  // 获取用户活动日志
  async getUserActivity(userId: number, limit = 50): Promise<any[]> {
    return this.prisma.log.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  // 获取请求追踪日志
  async getRequestLogs(requestId: string): Promise<any[]> {
    return this.prisma.log.findMany({
      where: { request_id: requestId },
      orderBy: { created_at: "asc" },
    });
  }
}
