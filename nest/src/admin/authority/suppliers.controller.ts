// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 供应商管理（兼容）")
@Controller("adminapi/authority/suppliers")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class SuppliersCompatController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "供应商列表（兼容）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const paging = query.paging !== undefined ? query.paging !== "false" && query.paging !== false : true;
    const skip = (page - 1) * size;
    const keyword = (query.keyword ?? "").trim();
    const where: any = {};
    if (keyword) {
      where.OR = [
        { suppliers_name: { contains: keyword } },
        { contact_name: { contains: keyword } },
        { contact_phone: { contains: keyword } },
      ];
    }

    if (!paging) {
      const records = await this.prisma.suppliers.findMany({ where, orderBy: { suppliers_id: "desc" } });
      const data = records.map((r) => this.normalize(r));
      return { code: 0, message: "success", data };
    }

    const [records, total] = await Promise.all([
      this.prisma.suppliers.findMany({ where, skip, take: size, orderBy: { suppliers_id: "desc" } }),
      this.prisma.suppliers.count({ where }),
    ]);
    const data = {
      records: records.map((r) => this.normalize(r)),
      total,
      size,
      current: page,
      pages: Math.max(1, Math.ceil((total || 0) / size)),
    };
    return { code: 0, message: "success", data };
  }

  @Get("detail")
  @ApiOperation({ summary: "供应商详情（兼容）" })
  async detail(@Query("id") id: string) {
    const item = await this.prisma.suppliers.findUnique({ where: { suppliers_id: Number(id) } });
    return { code: 0, message: "success", data: item ? this.normalize(item) : null };
  }

  @Post("create")
  @ApiOperation({ summary: "新增供应商（兼容）" })
  async create(@Body() body: any) {
    const created = await this.prisma.suppliers.create({ data: this.denormalize(body) });
    return { code: 0, message: "success", data: this.normalize(created) };
  }

  @Post("update")
  @ApiOperation({ summary: "更新供应商（兼容）" })
  async update(@Body() body: any) {
    const id = Number(body.id ?? body.suppliersId ?? body.suppliers_id);
    const updated = await this.prisma.suppliers.update({ where: { suppliers_id: id }, data: this.denormalize(body) });
    return { code: 0, message: "success", data: this.normalize(updated) };
  }

  @Post("del")
  @ApiOperation({ summary: "删除供应商（兼容）" })
  async del(@Body() body: any) {
    const id = Number(body.id ?? body.suppliersId ?? body.suppliers_id);
    await this.prisma.suppliers.delete({ where: { suppliers_id: id } });
    return { code: 0, message: "success" };
  }

  @Post("updateField")
  @ApiOperation({ summary: "更新字段（兼容）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id ?? body.suppliersId ?? body.suppliers_id);
    const field = body.field;
    const value = body.value ?? body.val;
    await this.prisma.suppliers.update({ where: { suppliers_id: id }, data: { [field]: value } });
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

    const results: any[] = [];
    if (act === "del" || act === "delete") {
      for (const id of ids) {
        await this.prisma.suppliers.delete({ where: { suppliers_id: id } }).catch(() => null);
        results.push({ id, ok: true });
      }
    } else if (body.field != null) {
      const field = body.field;
      const value = body.value ?? body.val;
      for (const id of ids) {
        await this.prisma.suppliers.update({ where: { suppliers_id: id }, data: { [field]: value } }).catch(() => null);
        results.push({ id, ok: true });
      }
    }
    return { code: 0, message: "success", data: results };
  }

  private normalize(r: any) {
    return {
      suppliersId: r.suppliers_id,
      suppliersName: r.suppliers_name,
      suppliersDesc: r.suppliers_desc,
      isCheck: r.is_check,
      country: r.country,
      province: r.province,
      city: r.city,
      district: r.district,
      contactName: r.contact_name,
      contactPhone: r.contact_phone,
      contactAddress: r.contact_address,
      isShow: r.is_show,
      shopId: r.shop_id,
    };
  }

  private denormalize(b: any) {
    const data: any = {};
    if (b.suppliersName != null) data.suppliers_name = b.suppliersName;
    if (b.suppliersDesc != null) data.suppliers_desc = b.suppliersDesc;
    if (b.isCheck != null) data.is_check = Number(b.isCheck);
    if (b.country != null) data.country = Number(b.country);
    if (b.province != null) data.province = Number(b.province);
    if (b.city != null) data.city = Number(b.city);
    if (b.district != null) data.district = Number(b.district);
    if (b.contactName != null) data.contact_name = b.contactName;
    if (b.contactPhone != null) data.contact_phone = b.contactPhone;
    if (b.contactAddress != null) data.contact_address = b.contactAddress;
    if (b.isShow != null) data.is_show = !!b.isShow;
    if (b.shopId != null) data.shop_id = Number(b.shopId);
    return data;
  }
}
