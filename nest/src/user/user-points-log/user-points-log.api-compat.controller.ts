// @ts-nocheck
import { Controller, Get, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserPointsLogService } from "./user-points-log.service";

@ApiTags("用户积分日志（API兼容）")
@Controller("api/user/pointsLog")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPointsLogApiCompatController {
  constructor(private readonly svc: UserPointsLogService) {}

  // GET /api/user/pointsLog/list
  @Get("list")
  @ApiOperation({ summary: "积分日志列表（兼容）" })
  async list(@Request() req, @Query() query: any) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const filter = {
      keyword: query.keyword || "",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sort_field || "log_id",
      sort_order: query.sort_order || "desc",
    };
    // 仅当前用户的日志
    const all = await this.svc.getFilterResult(filter);
    const rows = (all as any[]).filter((r) => Number(r.user_id) === Number(userId));
    const total = rows.length;
    const start = (filter.page - 1) * filter.size;
    const paged = rows.slice(start, start + filter.size);
    return { code: 0, message: "success", data: { records: paged, total } };
  }
}
