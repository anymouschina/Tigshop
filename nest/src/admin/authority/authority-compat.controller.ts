// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 权限管理（兼容）")
@Controller("adminapi/authority/authority")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AuthorityCompatController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("getAllAuthority")
  @ApiOperation({ summary: "全部权限（兼容）" })
  async getAllAuthority() {
    const data = await this.prisma.authority.findMany({ orderBy: [{ parent_id: "asc" }, { sort_order: "asc" }, { authority_id: "asc" }] as any });
    return { code: 0, message: "success", data };
  }

  @Get("list")
  @ApiOperation({ summary: "权限列表（兼容）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const paging = query.paging !== undefined ? query.paging !== "false" && query.paging !== false : true;
    const skip = (page - 1) * size;
    const keyword = (query.keyword ?? "").trim();
    const where: any = {};
    if (keyword) where.OR = [{ authority_name: { contains: keyword } }, { authority_sn: { contains: keyword } }];

    if (!paging) {
      const records = await this.prisma.authority.findMany({ where, orderBy: [{ parent_id: "asc" }, { sort_order: "asc" }, { authority_id: "asc" }] as any });
      return { code: 0, message: "success", data: records };
    }

    const [records, total] = await Promise.all([
      this.prisma.authority.findMany({ where, skip, take: size, orderBy: [{ parent_id: "asc" }, { sort_order: "asc" }, { authority_id: "asc" }] as any }),
      this.prisma.authority.count({ where }),
    ]);
    const data = { records, total, size, current: page, pages: Math.max(1, Math.ceil((total || 0) / size)) };
    return { code: 0, message: "success", data };
  }

  @Get("getAuthorityParentName")
  @ApiOperation({ summary: "父权限名称（兼容）" })
  async getAuthorityParentName(@Query("id") id?: string) {
    if (!id) return { code: 0, message: "success", data: "" };
    const item = await this.prisma.authority.findUnique({ where: { authority_id: Number(id) } });
    return { code: 0, message: "success", data: item?.authority_name ?? "" };
  }

  @Get("detail")
  @ApiOperation({ summary: "权限详情（兼容）" })
  async detail(@Query("id") id: string) {
    const item = await this.prisma.authority.findUnique({ where: { authority_id: Number(id) } });
    return { code: 0, message: "success", data: item };
  }

  @Post("create")
  @ApiOperation({ summary: "创建权限（兼容）" })
  async create(@Body() body: any) {
    const data: any = this.denormalize(body);
    const created = await this.prisma.authority.create({ data });
    return { code: 0, message: "success", data: created };
  }

  @Post("update")
  @ApiOperation({ summary: "更新权限（兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id ?? body.authority_id);
    const data: any = this.denormalize(body);
    delete data.authority_id;
    const updated = await this.prisma.authority.update({ where: { authority_id: id }, data });
    return { code: 0, message: "success", data: updated };
  }

  @Post("del")
  @ApiOperation({ summary: "删除权限（兼容）" })
  async del(@Body() body: any) {
    const id = Number(body.id ?? body.authority_id);
    await this.prisma.authority.delete({ where: { authority_id: id } });
    return { code: 0, message: "success" };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新字段（兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id ?? body.authority_id);
    const field = body.field;
    const value = body.value ?? body.val;
    await this.prisma.authority.update({ where: { authority_id: id }, data: { [field]: value } });
    return { code: 0, message: "success" };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量操作（兼容）" })
  async batch(@Body() body: any) {
    const act = String(body.act ?? body.type ?? "").toLowerCase();
    let ids: number[] = [];
    const raw = body.ids;
    if (Array.isArray(raw)) ids = raw.map((x) => Number(x)).filter(Number.isFinite);
    else if (typeof raw === "string") ids = raw.split(",").map((s) => Number(s.trim())).filter(Number.isFinite);
    else if (typeof raw === "number") ids = [raw];

    if (!ids.length) return { code: 0, message: "success", data: [] };

    if (act === "del" || act === "delete") {
      await this.prisma.authority.deleteMany({ where: { authority_id: { in: ids } } });
      return { code: 0, message: "success", data: ids.map((id) => ({ id, ok: true })) };
    }

    if (body.field != null) {
      const field = String(body.field);
      const value = body.value ?? body.val;
      const results: any[] = [];
      for (const id of ids) {
        await this.prisma.authority.update({ where: { authority_id: id }, data: { [field]: value } }).catch(() => null);
        results.push({ id, ok: true });
      }
      return { code: 0, message: "success", data: results };
    }

    return { code: 0, message: "success", data: [] };
  }

  private denormalize(b: any) {
    const data: any = {};
    if (b.authoritySn != null) data.authority_sn = b.authoritySn;
    if (b.authorityName != null) data.authority_name = b.authorityName;
    if (b.parentId != null) data.parent_id = Number(b.parentId);
    if (b.sortOrder != null) data.sort_order = Number(b.sortOrder);
    if (b.isShow != null) data.is_show = Number(b.isShow);
    if (b.childAuth != null) data.child_auth = b.childAuth;
    if (b.routeLink != null) data.route_link = b.routeLink;
    if (b.authorityIco != null) data.authority_ico = b.authorityIco;
    if (b.isSystem != null) data.is_system = Number(b.isSystem);
    if (b.adminType != null) data.admin_type = b.adminType;
    if (b.authorityId != null) data.authority_id = Number(b.authorityId);
    return data;
  }
}
