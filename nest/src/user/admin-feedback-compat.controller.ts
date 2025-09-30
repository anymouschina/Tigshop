// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 会员留言(兼容)")
@Controller("adminapi/user/feedback")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminFeedbackCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "会员留言列表（兼容）" })
  @Authorities("feedbackManage")
  async list(@Query() q: any) {
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? "id").toString();
    const sortOrder = ((q.sort_order ?? "desc").toString().toLowerCase() === "asc" ? "asc" : "desc") as any;
    const keyword = (q.keyword || "").trim();
    const type = q.type !== undefined ? Number(q.type) : undefined;
    const status = q.status !== undefined ? Number(q.status) : undefined;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { email: { contains: keyword } },
        { mobile: { contains: keyword } },
      ];
    }
    if (!Number.isNaN(type) && type !== undefined && type !== -1) where.type = type;
    if (!Number.isNaN(status) && status !== undefined && status !== -1) where.status = status;

    const orderBy: any = { [sortField]: sortOrder };
    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).feedback.findMany({ where, orderBy, skip, take: size }),
      (this.prisma as any).feedback.count({ where }),
    ]);

    return { code: 0, message: "success", data: { records: rows, total, size, current: page, pages: Math.ceil(total / size) } };
  }

  @Get("detail")
  @ApiOperation({ summary: "会员留言详情（兼容）" })
  @Authorities("feedbackManage")
  async detail(@Query("id") idStr?: string) {
    const id = Number(idStr);
    if (!id) return { code: 0, message: "success", data: null };
    const item = await (this.prisma as any).feedback.findUnique({ where: { id } });
    return { code: 0, message: "success", data: item };
  }

  @Post("create")
  @ApiOperation({ summary: "创建/添加会员留言（兼容）" })
  @Authorities("feedbackModifyManage")
  async create(@Body() dto: any) {
    const now = Math.floor(Date.now() / 1000);
    const data: any = {
      title: dto.title || "",
      parent_id: Number(dto.parent_id || 0),
      email: dto.email || "",
      content: dto.content || "",
      mobile: dto.mobile || "",
      feedback_pics: Array.isArray(dto.feedback_pics) ? JSON.stringify(dto.feedback_pics) : (dto.feedback_pics || null),
      product_id: Number(dto.product_id || 0),
      order_id: Number(dto.order_id || 0),
      add_time: now,
      status: 0,
      type: Number(dto.type || 0),
      shop_id: Number(dto.shop_id || 0),
    };
    const created = await (this.prisma as any).feedback.create({ data });
    return { code: 0, message: "success", data: { id: created.id } };
  }

  @Post("update")
  @ApiOperation({ summary: "更新会员留言（兼容）" })
  @Authorities("feedbackModifyManage")
  async update(@Body() dto: any) {
    const id = Number(dto.id);
    if (!id) return { code: 400, message: "id required", data: null };
    const data: any = {};
    ["title", "email", "content", "mobile"].forEach((k) => dto[k] !== undefined && (data[k] = dto[k]));
    if (dto.parent_id !== undefined) data.parent_id = Number(dto.parent_id);
    if (dto.product_id !== undefined) data.product_id = Number(dto.product_id);
    if (dto.order_id !== undefined) data.order_id = Number(dto.order_id);
    if (dto.status !== undefined) data.status = Number(dto.status);
    if (dto.type !== undefined) data.type = Number(dto.type);
    if (dto.feedback_pics !== undefined) data.feedback_pics = Array.isArray(dto.feedback_pics) ? JSON.stringify(dto.feedback_pics) : dto.feedback_pics;
    await (this.prisma as any).feedback.update({ where: { id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除会员留言（兼容）" })
  @Authorities("feedbackModifyManage")
  async del(@Body("id") id: any) {
    const num = Number(id);
    if (!num) return { code: 400, message: "id required", data: null };
    await (this.prisma as any).feedback.delete({ where: { id: num } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量操作（兼容，仅支持 del）" })
  @Authorities("feedbackModifyManage")
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids) ? body.ids.map((x: any) => Number(x)).filter(Boolean) : [];
    if (!ids.length) return { code: 400, message: "未选择项目", data: null };
    if (body.type === "del") {
      await (this.prisma as any).feedback.deleteMany({ where: { id: { in: ids } } });
      return { code: 0, message: "success", data: true };
    }
    return { code: 400, message: "#type 错误", data: null };
  }
}
