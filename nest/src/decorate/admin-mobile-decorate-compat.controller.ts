// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 移动端装修(兼容别名)")
@Controller("adminapi/decorate/mobileDecorate")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminMobileDecorateCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private num(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }
  private bool01(v: any) {
    if (typeof v === "boolean") return v ? 1 : 0;
    const n = Number(v);
    if (Number.isFinite(n)) return n ? 1 : 0;
    return v ? 1 : 0;
  }
  private asJsonString(v: any) {
    if (v == null) return "";
    try {
      return typeof v === "string" ? v : JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  // 列表（默认 decorate_type = 2：移动端）
  @Get("list")
  @ApiOperation({ summary: "移动端装修列表（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async list(@Req() req: any, @Query() query: any) {
    const decorate_type = this.num(query.decorate_type || query.decorateType, 2);
    const page = Math.max(1, this.num(query.page, 1));
    const size = Math.max(1, this.num(query.size, 15));
    const skip = (page - 1) * size;
    const keyword = (query.keyword || "").trim();
    const sortField = (query.sort_field || query.sortField || "decorate_id").toString();
    const sortOrder = (query.sort_order || query.sortOrder || "desc").toString().toLowerCase() === "asc" ? "asc" : "desc";

    const { shopId = 0 } = (await this.panel.validateUserAndGetShopId(req)) || { shopId: 0 };
    const where: any = { decorate_type, shop_id: shopId };
    if (keyword) where.decorate_title = { contains: keyword };

    const [records, total] = await Promise.all([
      this.prisma.decorate.findMany({
        where,
        select: {
          decorate_id: true,
          decorate_title: true,
          update_time: true,
          status: true,
          is_home: true,
          decorate_type: true,
          shop_id: true,
        },
        orderBy: [{ is_home: "desc" }, { [sortField]: sortOrder }],
        skip,
        take: size,
      }),
      this.prisma.decorate.count({ where }),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  // 详情
  @Get("detail")
  @ApiOperation({ summary: "移动端装修详情（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async detail(@Req() req: any, @Query() q: any) {
    const id = this.num(q.id, 0);
    let record = null;
    if (!id) {
      const decorate_type = this.num(q.decorate_type || q.decorateType, 2);
      const parent_id = this.num(q.parent_id || 0, 0);
      const locale_id = this.num(q.locale_id || 0, 0);
      const { shopId = 0 } = (await this.panel.validateUserAndGetShopId(req)) || { shopId: 0 };
      record = await this.prisma.decorate.findFirst({
        where: { decorate_type, parent_id, locale_id, shop_id: shopId },
      });
    } else {
      record = await this.prisma.decorate.findUnique({ where: { decorate_id: id } });
    }
    return { code: 0, message: "success", data: record };
  }

  // 获取草稿数据
  @Get("loadDraftData")
  @ApiOperation({ summary: "获取移动端装修草稿（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async loadDraftData(@Query("id") id: number) {
    const it = await this.prisma.decorate.findUnique({ where: { decorate_id: this.num(id, 0) } });
    const draft = it?.draft_data || "";
    try {
      return { code: 0, message: "success", data: draft ? JSON.parse(draft) : [] };
    } catch {
      return { code: 0, message: "success", data: draft };
    }
  }

  // 保存草稿
  @Post("saveDraft")
  @ApiOperation({ summary: "保存移动端装修草稿（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async saveDraft(@Body() body: any) {
    const id = this.num(body.id, 0);
    const dataStr = this.asJsonString(body.data);
    await this.prisma.decorate.update({
      where: { decorate_id: id },
      data: { draft_data: dataStr, update_time: Math.floor(Date.now() / 1000) },
    });
    return { code: 0, message: "success", data: true };
  }

  // 发布（默认 decorate_type = 2）
  @Post("publish")
  @ApiOperation({ summary: "发布移动端装修（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async publish(@Body() body: any) {
    const id = this.num(body.id, 0);
    const decorate_type = this.num(body.decorate_type || body.decorateType, 2);
    const dataStr = this.asJsonString(body.data);
    await this.prisma.decorate.update({
      where: { decorate_id: id },
      data: {
        decorate_type,
        status: true,
        data: dataStr,
        draft_data: "",
        update_time: Math.floor(Date.now() / 1000),
      },
    });
    return { code: 0, message: "success", data: true };
  }

  // 复制
  @Post("copy")
  @ApiOperation({ summary: "复制移动端装修（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async copy(@Body("id") id: number) {
    const src = await this.prisma.decorate.findUnique({ where: { decorate_id: this.num(id, 0) } });
    if (!src) return { code: 1, message: "未找到数据", data: null };
    const created = await this.prisma.decorate.create({
      data: {
        decorate_title: `${src.decorate_title || "页面"}-复制`,
        data: src.data,
        draft_data: src.draft_data,
        decorate_type: src.decorate_type || 2,
        is_home: 0,
        shop_id: src.shop_id || 0,
        status: false,
        locale_id: src.locale_id || 0,
        parent_id: src.parent_id || 0,
        update_time: Math.floor(Date.now() / 1000),
      },
    });
    return { code: 0, message: "success", data: created };
  }

  // 设置首页
  @Post("setHome")
  @ApiOperation({ summary: "移动端设置为首页（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async setHome(@Body("id") id: number) {
    const it = await this.prisma.decorate.findUnique({ where: { decorate_id: this.num(id, 0) } });
    if (!it) return { code: 1, message: "#不存在的模板", data: null };
    await this.prisma.decorate.updateMany({ where: { decorate_type: it.decorate_type, is_home: 1 }, data: { is_home: 0 } });
    await this.prisma.decorate.update({ where: { decorate_id: it.decorate_id }, data: { is_home: 1 } });
    return { code: 0, message: "success", data: true };
  }

  // 新增（默认 decorate_type = 2）
  @Post("create")
  @ApiOperation({ summary: "新增移动端装修（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async create(@Req() req: any, @Body() body: any) {
    const { shopId = 0 } = (await this.panel.validateUserAndGetShopId(req)) || { shopId: 0 };
    const created = await this.prisma.decorate.create({
      data: {
        decorate_title: body.decorate_title ?? body.decorateTitle ?? "",
        decorate_type: this.num(body.decorate_type ?? body.decorateType, 2),
        data: this.asJsonString(body.data ?? {}),
        shop_id: shopId,
        parent_id: this.num(body.parent_id ?? 0, 0),
        locale_id: this.num(body.locale_id ?? 0, 0),
        status: false,
        is_home: 0,
        update_time: Math.floor(Date.now() / 1000),
      },
    });
    return { code: 0, message: "success", data: created };
  }

  // 更新
  @Post("update")
  @ApiOperation({ summary: "更新移动端装修（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async update(@Body() body: any) {
    const id = this.num(body.id, 0);
    const data: any = {};
    if (body.decorate_title != null || body.decorateTitle != null) data.decorate_title = body.decorate_title ?? body.decorateTitle;
    if (body.decorate_type != null || body.decorateType != null) data.decorate_type = this.num(body.decorate_type ?? body.decorateType, 2);
    if (body.locale_id != null) data.locale_id = this.num(body.locale_id, 0);
    if (body.parent_id != null) data.parent_id = this.num(body.parent_id, 0);
    if (body.data != null) data.data = this.asJsonString(body.data);
    data.update_time = Math.floor(Date.now() / 1000);
    const updated = await this.prisma.decorate.update({ where: { decorate_id: id }, data });
    return { code: 0, message: "success", data: updated };
  }

  // 更新单字段：decorate_title | is_show(映射到status)
  @Post("updateField")
  @ApiOperation({ summary: "更新移动端装修单字段（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async updateField(@Body() body: any) {
    const id = this.num(body.id, 0);
    const field = String(body.field || "");
    const val = body.val;
    if (!id || ["decorate_title", "is_show"].indexOf(field) === -1) {
      return { code: 1, message: "#field 错误", data: null };
    }
    const data: any = {};
    if (field === "decorate_title") data.decorate_title = val ?? "";
    if (field === "is_show") data.status = !!this.bool01(val);
    await this.prisma.decorate.update({ where: { decorate_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  // 删除
  @Post("del")
  @ApiOperation({ summary: "删除移动端装修（兼容别名）" })
  @Authorities("mobileDecorateManage")
  async del(@Body("id") id: number) {
    await this.prisma.decorate.delete({ where: { decorate_id: this.num(id, 0) } });
    return { code: 0, message: "指定项目已删除", data: true };
  }

  // 批量删除
  @Post("batch")
  @ApiOperation({ summary: "移动端装修批量操作（兼容，仅del）" })
  @Authorities("mobileDecorateManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.num(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del" || type === "delete") {
      await this.prisma.decorate.deleteMany({ where: { decorate_id: { in: ids } } });
      return { code: 0, message: "批量操作执行成功！", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }
}
