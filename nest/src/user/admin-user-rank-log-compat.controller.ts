// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 会员等级变更日志(兼容)")
@Controller("adminapi/user/userRankLog")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserRankLogCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "变更日志列表（兼容）" })
  @Authorities("userRankLogManage")
  async list(@Query() q: any) {
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? "id").toString();
    const sortOrder = ((q.sort_order ?? "desc").toString().toLowerCase() === "asc" ? "asc" : "desc") as any;
    const keyword = (q.keyword || "").trim();

    const where: any = {};
    if (keyword) {
      const kwNum = Number(keyword);
      if (!Number.isNaN(kwNum)) {
        where.OR = [{ user_id: kwNum }, { rank_id: kwNum }];
      }
    }

    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_rank_log.findMany({ where, skip, take: size, orderBy: { [sortField]: sortOrder } }),
      (this.prisma as any).user_rank_log.count({ where }),
    ]);

    return { code: 0, message: "success", data: { records: rows, total, size, current: page, pages: Math.ceil(total / size) } };
  }
}
