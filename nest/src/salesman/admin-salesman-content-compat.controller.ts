// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销公告(兼容)")
@Controller("adminapi/salesman/content")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanContentCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) { const n = Number(v); return Number.isFinite(n) ? n : dft; }

  @Get("list")
  @ApiOperation({ summary: "公告列表（兼容）" })
  @Authorities("salesmanContentManage")
  async list(@Req() req: any, @Query() query: any) {
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const keyword = (query.title || "").trim();
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const where: any = { shop_id: shopId };
    if (keyword) where.title = { contains: keyword };
    const [records, total] = await Promise.all([
      this.prisma.salesman_content.findMany({ where, orderBy: { id: "desc" }, skip, take: size }),
      this.prisma.salesman_content.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "公告详情（兼容）" })
  @Authorities("salesmanContentManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman_content.findUnique({ where: { id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: record };
  }

  @Post("create")
  @ApiOperation({ summary: "公告创建（兼容）" })
  @Authorities("salesmanContentManage")
  async create(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.salesman_content.create({
      data: {
        title: body.title ?? "",
        img: body.img ?? "",
        start_time: this.coerceNumber(body.startTime, now),
        end_time: body.endTime ? this.coerceNumber(body.endTime, 0) : 0,
        describe: body.describe ?? "",
        is_top: this.coerceNumber(body.isTop ?? 0, 0),
        content: body.content ?? "",
        is_available: this.coerceNumber(body.isAvailable ?? 1, 1),
        shop_id: shopId,
        pics: body.pics ?? "",
      },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("update")
  @ApiOperation({ summary: "公告更新（兼容）" })
  @Authorities("salesmanContentManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const data: any = {
      title: body.title ?? undefined,
      img: body.img ?? undefined,
      start_time: body.startTime !== undefined ? this.coerceNumber(body.startTime, 0) : undefined,
      end_time: body.endTime !== undefined ? this.coerceNumber(body.endTime, 0) : undefined,
      describe: body.describe ?? undefined,
      is_top: body.isTop !== undefined ? this.coerceNumber(body.isTop, 0) : undefined,
      content: body.content ?? undefined,
      is_available: body.isAvailable !== undefined ? this.coerceNumber(body.isAvailable, 1) : undefined,
      pics: body.pics ?? undefined,
    };
    await this.prisma.salesman_content.update({ where: { id }, data });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "公告单字段更新（兼容）" })
  @Authorities("salesmanContentManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = String(body.field || "");
    const val = body.value ?? body.val;
    const map: Record<string, string> = { title: "title", img: "img", startTime: "start_time", endTime: "end_time", describe: "describe", isTop: "is_top", content: "content", isAvailable: "is_available" };
    const dbField = map[field] || field;
    await this.prisma.salesman_content.update({ where: { id }, data: { [dbField]: val } });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "公告删除（兼容）" })
  @Authorities("salesmanContentManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman_content.delete({ where: { id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "公告批量（兼容）" })
  @Authorities("salesmanContentManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (["del", "delete"].includes(type)) {
      await this.prisma.salesman_content.deleteMany({ where: { id: { in: ids } } });
      return { code: 0, message: "批量删除成功", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("config")
  @ApiOperation({ summary: "公告配置（兼容）" })
  @Authorities("salesmanContentManage")
  async config() {
    return { code: 0, message: "success", data: {} };
  }
}
// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销公告(兼容)")
@Controller("adminapi/salesman/content")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanContentCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  @Get("list")
  @ApiOperation({ summary: "公告列表（兼容）" })
  @Authorities("salesmanNoticeManage")
  async list(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const keyword = (query.title || "").trim();
    const where: any = { shop_id: shopId };
    if (keyword) where.title = { contains: keyword };
    const [records, total] = await Promise.all([
      this.prisma.salesman_content.findMany({ where, orderBy: { id: "desc" }, skip, take: size }),
      this.prisma.salesman_content.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @ApiOperation({ summary: "公告详情（兼容）" })
  @Authorities("salesmanNoticeManage")
  async detail(@Query("id") id: number) {
    const record = await this.prisma.salesman_content.findUnique({ where: { id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: record };
  }

  @Post("create")
  @ApiOperation({ summary: "创建公告（兼容）" })
  @Authorities("salesmanNoticeManage")
  async create(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.salesman_content.create({
      data: {
        shop_id: shopId,
        title: body.title ?? "",
        img: body.img ?? "",
        start_time: this.coerceNumber(body.startTime, now),
        end_time: this.coerceNumber(body.endTime, 0),
        describe: body.describe ?? "",
        is_top: this.coerceNumber(body.isTop ?? 0, 0),
        content: body.content ?? "",
        is_available: this.coerceNumber(body.isAvailable ?? 1, 1),
        pics: body.pics ?? null,
      },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("update")
  @ApiOperation({ summary: "更新公告（兼容）" })
  @Authorities("salesmanNoticeManage")
  async update(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.salesman_content.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        img: body.img ?? undefined,
        start_time: body.startTime !== undefined ? this.coerceNumber(body.startTime, now) : undefined,
        end_time: body.endTime !== undefined ? this.coerceNumber(body.endTime, 0) : undefined,
        describe: body.describe ?? undefined,
        is_top: body.isTop !== undefined ? this.coerceNumber(body.isTop, 0) : undefined,
        content: body.content ?? undefined,
        is_available: body.isAvailable !== undefined ? this.coerceNumber(body.isAvailable, 1) : undefined,
        pics: body.pics ?? undefined,
      },
    });
    return { code: 0, message: "success", data: true };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新单字段（兼容）" })
  @Authorities("salesmanNoticeManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = body.field;
    const value = body.value;
    const map: Record<string, string> = { title: "title", img: "img", startTime: "start_time", endTime: "end_time", describe: "describe", isTop: "is_top", content: "content", isAvailable: "is_available" };
    const dbField = map[field] || field;
    await this.prisma.salesman_content.update({ where: { id }, data: { [dbField]: ["start_time","end_time","is_top","is_available"].includes(dbField) ? this.coerceNumber(value, 0) : value } as any });
    return { code: 0, message: "success", data: true };
  }

  @Post("del")
  @ApiOperation({ summary: "删除公告（兼容）" })
  @Authorities("salesmanNoticeManage")
  async del(@Body("id") id: number) {
    await this.prisma.salesman_content.delete({ where: { id: this.coerceNumber(id, 0) } });
    return { code: 0, message: "success", data: true };
  }

  @Post("batch")
  @ApiOperation({ summary: "公告批量（兼容）" })
  @Authorities("salesmanNoticeManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (["del", "delete"].includes(type)) {
      await this.prisma.salesman_content.deleteMany({ where: { id: { in: ids } } });
      return { code: 0, message: "批量删除成功", data: true };
    }
    if (type === "top1") {
      await this.prisma.salesman_content.updateMany({ where: { id: { in: ids } }, data: { is_top: 1 } });
      return { code: 0, message: "批量置顶成功", data: true };
    }
    if (type === "top0") {
      await this.prisma.salesman_content.updateMany({ where: { id: { in: ids } }, data: { is_top: 0 } });
      return { code: 0, message: "批量取消置顶成功", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  @Get("config")
  @ApiOperation({ summary: "公告配置（兼容）" })
  @Authorities("salesmanNoticeManage")
  async config() {
    return { code: 0, message: "success", data: {} };
  }
}
