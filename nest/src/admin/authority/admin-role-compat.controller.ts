// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { AdminRoleService } from "../admin-role/admin-role.service";

@ApiTags("Admin API - 角色管理（兼容）")
@Controller("adminapi/authority/adminRole")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminRoleCompatController {
  constructor(private readonly svc: AdminRoleService) {}

  @Get("list")
  @ApiOperation({ summary: "角色列表（兼容）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const data = await this.svc.findAll({
      keyword: query.keyword ?? "",
      status: query.status != null ? Number(query.status) : -1,
      page,
      size,
      sort_field: query.sort_field ?? "role_id",
      sort_order: query.sort_order ?? "desc",
    } as any);
    // 兼容返回结构
    return { code: 0, message: "success", data: { records: data.items, total: data.total, size, current: page, pages: Math.max(1, Math.ceil((data.total||0)/size)) } };
  }

  @Get("detail")
  @ApiOperation({ summary: "角色详情（兼容）" })
  async detail(@Query("id") id: string) {
    const item = await this.svc.findOne(Number(id));
    return { code: 0, message: "success", data: item };
  }

  @Post("create")
  @ApiOperation({ summary: "创建角色（兼容）" })
  async create(@Body() body: any) {
    const created = await this.svc.create({
      name: body.role_name ?? body.name,
      description: body.role_desc ?? body.description ?? "",
      permissions: Array.isArray(body.authority_list) ? body.authority_list : (body.authority_list ? String(body.authority_list).split(',').filter(Boolean) : []),
    } as any);
    return { code: 0, message: "success", data: created };
  }

  @Post("update")
  @ApiOperation({ summary: "更新角色（兼容）" })
  async update(@Body() body: any) {
    const updated = await this.svc.update({
      id: Number(body.id ?? body.role_id),
      name: body.role_name ?? body.name,
      description: body.role_desc ?? body.description,
      permissions: Array.isArray(body.authority_list) ? body.authority_list : (body.authority_list ? String(body.authority_list).split(',').filter(Boolean) : undefined),
    } as any);
    return { code: 0, message: "success", data: updated };
  }

  @Post("del")
  @ApiOperation({ summary: "删除角色（兼容）" })
  async del(@Body() body: any) {
    const id = Number(body.id ?? body.role_id);
    await this.svc.remove(id);
    return { code: 0, message: "success" };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新字段（兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id ?? body.role_id);
    const field = String(body.field);
    const val = body.value ?? body.val;
    if (field === "status") {
      await this.svc.updateStatus(id, Number(val));
    } else if (field === "role_name" || field === "name" || field === "role_desc" || field === "description") {
      await this.svc.update({ id, name: field.includes("name") ? String(val) : undefined, description: field.includes("desc") ? String(val) : undefined } as any);
    }
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
      await this.svc.batchRemove(ids);
      return { code: 0, message: "success", data: ids.map((id) => ({ id, ok: true })) };
    }

    if (body.field != null) {
      const field = String(body.field);
      const value = body.value ?? body.val;
      const results: any[] = [];
      for (const id of ids) {
        if (field === "status") await this.svc.updateStatus(id, Number(value));
        else if (field === "role_name" || field === "name" || field === "role_desc" || field === "description") await this.svc.update({ id, name: field.includes("name") ? String(value) : undefined, description: field.includes("desc") ? String(value) : undefined } as any);
        results.push({ id, ok: true });
      }
      return { code: 0, message: "success", data: results };
    }

    return { code: 0, message: "success", data: [] };
  }
}
