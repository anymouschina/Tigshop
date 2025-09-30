// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { UserPointsLogService } from "./user-points-log/user-points-log.service";

@ApiTags("Admin API - 会员积分日志(兼容)")
@Controller("adminapi/user/userPointsLog")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserPointsLogCompatController {
  constructor(private readonly service: UserPointsLogService) {}

  @Get("list")
  @Authorities("integralLogManage")
  @ApiOperation({ summary: "积分日志列表（兼容）" })
  async list(@Query() q: any) {
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? q.sortField ?? "log_id").toString();
    const sortOrder = (q.sort_order ?? q.sortOrder ?? "desc").toString();
    const keyword = (q.keyword || "").trim();

    // 复用服务，但避免其潜在关系 where 的问题：通过入参传递
    const filter = {
      page,
      size,
      sort_field: sortField,
      sort_order: sortOrder,
      keyword,
    };

    const rows = await this.service.getFilterResult(filter);
    const total = await this.service.getFilterCount(filter);
    const records = rows.map((r: any) => ({
      id: r.log_id,
      userId: r.user_id,
      points: r.points,
      changeType: r.change_type,
      changeDesc: r.change_desc,
      changeTime: r.change_time,
      username: r.username || "",
    }));

    // 标准返回包 + 驼峰
    return {
      code: 0,
      message: "success",
      data: {
        records,
        total,
        size,
        current: page,
        pages: Math.ceil(total / size),
      },
    };
  }

  @Get("getPoints")
  @Authorities("integralLogManage")
  @ApiOperation({ summary: "获取会员积分（兼容）" })
  async getPoints(@Query("user_id") userId?: string) {
    const id = Number(userId);
    if (!id) return { code: 1, message: "缺少 user_id", data: null };
    const user = await (this.service as any).prisma.user.findUnique({ where: { user_id: id }, select: { points: true } });
    return { code: 0, message: "success", data: [user?.points || 0] };
  }

  @Post("del")
  @Authorities("userPointsLogModifyManage")
  @ApiOperation({ summary: "删除积分日志（兼容）" })
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    await this.service.deleteUserPointsLog(num);
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @Authorities("userPointsLogModifyManage")
  @ApiOperation({ summary: "积分日志批量操作（兼容，仅支持 del）" })
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids)
      ? body.ids.map((x: any) => Number(x)).filter(Boolean)
      : [];
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (body.type === "del") {
      await this.service.batchDeleteUserPointsLog(ids);
      return { code: 0, message: "success", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Post("create")
  @Authorities("userManage")
  @ApiOperation({ summary: "创建积分日志（兼容）" })
  async create(@Body() dto: any) {
    const user_id = Number(dto.user_id ?? dto.userId);
    const points = Number(dto.points ?? 0);
    const type = Number(dto.type ?? dto.change_type ?? 0);
    const remark = String(dto.remark ?? dto.change_desc ?? "");
    if (!user_id) return { code: 1, message: "缺少 user_id", data: null };
    await this.service.createUserPointsLog({ user_id, points, type, remark });
    return { code: 0, message: "success", data: true };
  }

  @Get("detail")
  @Authorities("userManage")
  @ApiOperation({ summary: "积分日志详情（兼容）" })
  async detail(@Query("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 1, message: "缺少 id", data: null };
    const r = await this.service.getDetail(num);
    const data = {
      id: r.log_id,
      userId: r.user_id,
      points: r.points,
      changeType: r.change_type,
      changeDesc: r.change_desc,
      changeTime: r.change_time,
    };
    return { code: 0, message: "success", data };
  }
}
