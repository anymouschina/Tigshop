// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 管理员日志（兼容）")
@Controller("adminapi/authority/adminLog")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminLogCompatController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "管理员日志列表（兼容）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const paging =
      query.paging !== undefined
        ? query.paging !== "false" && query.paging !== false
        : true;
    const skip = (page - 1) * size;

    const keyword = (query.keyword ?? "").trim();
    const userId = query.userId ? Number(query.userId) : undefined;
    const start = query.startTime ? Number(query.startTime) : undefined;
    const end = query.endTime ? Number(query.endTime) : undefined;

    const where: any = {};
    if (keyword) where.log_info = { contains: keyword };
    if (userId) where.user_id = userId;
    if (start || end)
      where.log_time = {
        gte: start || 0,
        lte: (end || 0) > 0 ? end : undefined,
      };

    if (!paging) {
      const records = await this.prisma.admin_log.findMany({
        where,
        orderBy: { log_id: "desc" },
      });
      return { code: 0, message: "success", data: records };
    }

    const [records, total] = await Promise.all([
      this.prisma.admin_log.findMany({
        where,
        skip,
        take: size,
        orderBy: { log_id: "desc" },
      }),
      this.prisma.admin_log.count({ where }),
    ]);
    const data = {
      records,
      total,
      size,
      current: page,
      pages: Math.max(1, Math.ceil((total || 0) / size)),
    };
    return { code: 0, message: "success", data };
  }
}
