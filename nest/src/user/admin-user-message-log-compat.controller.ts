// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 站内信(兼容)")
@Controller("adminapi/user/userMessageLog")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserMessageLogCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "站内信列表（兼容）" })
  @Authorities("messageLogManage")
  async list(@Query() q: any) {
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? "message_log_id").toString();
    const sortOrder = ((q.sort_order ?? "desc").toString().toLowerCase() === "asc" ? "asc" : "desc") as any;
    const keyword = (q.keyword || "").trim();

    const where: any = {};
    if (keyword) {
      where.OR = [
        { message_title: { contains: keyword } },
        { message_content: { contains: keyword } },
      ];
    }

    const orderBy: any = { [sortField]: sortOrder };
    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_message_log.findMany({ where, orderBy, skip, take: size }),
      (this.prisma as any).user_message_log.count({ where }),
    ]);

    return { code: 0, message: "success", data: { records: rows, total, size, current: page, pages: Math.ceil(total / size) } };
  }

  @Get("detail")
  @ApiOperation({ summary: "站内信详情（兼容）" })
  @Authorities("messageLogManage")
  async detail(@Query("id") idStr?: string) {
    const id = Number(idStr);
    if (!id) return { code: 0, message: "success", data: null };
    const item = await (this.prisma as any).user_message_log.findUnique({ where: { message_log_id: id } });
    return { code: 0, message: "success", data: item };
  }

  @Post("create")
  @ApiOperation({ summary: "创建/发布站内信（兼容）" })
  @Authorities("userMessageLogModifyManage")
  async create(@Body() dto: any) {
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      send_user_type: Number(dto.send_user_type || 0),
      message_title: String(dto.message_title || ""),
      message_content: String(dto.message_content || ""),
      message_link: String(dto.message_link || ""),
      user_ids: String(dto.user_ids || dto.user_list || ""),
      user_rank: Number(dto.user_rank || 0),
      send_time: now,
      is_recall: 0,
    };
    const created = await (this.prisma as any).user_message_log.create({ data });
    return { code: 0, message: "success", data: { id: created.message_log_id } };
  }

  @Post("update")
  @ApiOperation({ summary: "更新站内信（兼容）" })
  @Authorities("userMessageLogModifyManage")
  async update(@Body() dto: any) {
    const id = Number(dto.id);
    if (!id) return { code: 400, message: "id required", data: null };
    const data: any = {};
    const map: Record<string, string> = {
      send_user_type: "send_user_type",
      message_title: "message_title",
      message_content: "message_content",
      message_link: "message_link",
      user_rank: "user_rank",
      user_ids: "user_ids",
    };
    Object.keys(map).forEach((k) => dto[k] !== undefined && (data[map[k]] = dto[k]));
    await (this.prisma as any).user_message_log.update({ where: { message_log_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除站内信（兼容）" })
  @Authorities("userMessageLogModifyManage")
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 400, message: "id required", data: null };
    await (this.prisma as any).user_message_log.delete({ where: { message_log_id: num } });
    return { code: 0, message: "success", data: true };
  }

  @Post("recall")
  @ApiOperation({ summary: "撤回站内信（兼容）" })
  @Authorities("userMessageLogModifyManage")
  async recall(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 400, message: "id required", data: null };
    await (this.prisma as any).user_message_log.update({ where: { message_log_id: num }, data: { is_recall: 1 } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量操作（兼容：del/recall）" })
  @Authorities("userMessageLogModifyManage")
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map((x: any) => Number(x)).filter(Boolean) : [];
    if (!ids.length) return { code: 400, message: "未选择项目", data: null };
    if (body.type === "del") {
      await (this.prisma as any).user_message_log.deleteMany({ where: { message_log_id: { in: ids } } });
    } else if (body.type === "recall") {
      await (this.prisma as any).user_message_log.updateMany({ where: { message_log_id: { in: ids } }, data: { is_recall: 1 } });
    } else {
      return { code: 400, message: "#type 错误", data: null };
    }
    return { code: 0, message: "success", data: true };
  }
}
