// @ts-nocheck
import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 分销商品(兼容)")
@Controller("adminapi/salesman/product")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminSalesmanProductCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private coerceNumber(v: any, dft = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : dft;
  }

  private parseMaybeJson<T = any>(v: any): T | any {
    if (v == null) return v;
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }

  // 列表
  @Get("list")
  @ApiOperation({ summary: "分销商品列表（兼容）" })
  @Authorities("salesmanProductManage")
  async list(@Req() req: any, @Query() query: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const page = Math.max(1, this.coerceNumber(query.page, 1));
    const size = Math.max(1, this.coerceNumber(query.size, 15));
    const skip = (page - 1) * size;
    const keyword = (query.productName || "").trim();
    const where: any = { shop_id: shopId };
    if (keyword) {
      where.product_name = { contains: keyword };
    }
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { product_id: "desc" },
        select: {
          product_id: true,
          product_name: true,
          product_sn: true,
          product_price: true,
          pic_thumb: true,
        },
        skip,
        take: size,
      }),
      this.prisma.product.count({ where }),
    ]);
    // 关联 salesman_product
    const productIds = products.map((p) => p.product_id);
    const spList = await this.prisma.salesman_product.findMany({ where: { product_id: { in: productIds } } });
    const spMap = new Map(spList.map((x) => [x.product_id, x] as const));
    const records = products.map((p) => ({
      ...p,
      salesman_product: spMap.get(p.product_id) || null,
    }));
    return { code: 0, message: "success", data: { records, total } };
  }

  // 详情
  @Get("detail")
  @ApiOperation({ summary: "分销商品详情（兼容）" })
  @Authorities("salesmanProductManage")
  async detail(@Query("id") id: number) {
    const productId = this.coerceNumber(id, 0);
    if (!productId) return { code: 0, message: "success", data: null };
    const product = await this.prisma.product.findUnique({ where: { product_id: productId } });
    const sp = await this.prisma.salesman_product.findFirst({ where: { product_id: productId } });
    const item = {
      product_id: product?.product_id,
      is_join: sp?.is_join || 0,
      commission_type: sp?.commission_type || 1,
      commission_data: this.parseMaybeJson(sp?.commission_data) || {},
    };
    return { code: 0, message: "success", data: item };
  }

  // 更新
  @Post("update")
  @ApiOperation({ summary: "分销商品更新（兼容）" })
  @Authorities("salesmanProductManage")
  async update(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const productId = this.coerceNumber(body.productId || body.product_id, 0);
    const data = {
      product_id: productId,
      is_join: this.coerceNumber(body.isJoin ?? body.is_join, 0),
      commission_type: this.coerceNumber(body.commissionType ?? body.commission_type, 1),
      commission_data: JSON.stringify(body.commissionData ?? body.commission_data ?? {}),
      shop_id: shopId,
      update_time: Math.floor(Date.now() / 1000),
    } as any;
    const exists = await this.prisma.salesman_product.findFirst({ where: { product_id: productId } });
    if (exists) {
      await this.prisma.salesman_product.update({ where: { salesman_product_id: exists.salesman_product_id }, data });
    } else {
      data.add_time = Math.floor(Date.now() / 1000);
      await this.prisma.salesman_product.create({ data });
    }
    return { code: 0, message: "success", data: true };
  }

  // 更新单个字段
  @Post("updateField")
  @ApiOperation({ summary: "更新单个字段（兼容）" })
  @Authorities("salesmanProductManage")
  async updateField(@Body() body: any) {
    const id = this.coerceNumber(body.id, 0);
    const field = String(body.field || "");
    const val = body.val;
    if (!id) return { code: 1, message: "#id 错误", data: null };
    const allowed = ["is_join", "commission_type", "commission_data"];
    if (!allowed.includes(field)) return { code: 1, message: "#field 错误", data: null };
    const data: any = {};
    data[field] = field === "commission_data" ? JSON.stringify(val ?? {}) : this.coerceNumber(val, 0);
    await this.prisma.salesman_product.update({ where: { salesman_product_id: id }, data });
    return { code: 0, message: "success", data: true };
  }

  // 批量（仅支持 del）
  @Post("batch")
  @ApiOperation({ summary: "分销商品批量（兼容）" })
  @Authorities("salesmanProductManage")
  async batch(@Body() body: any) {
    const ids: number[] = (body.ids || []).map((x) => this.coerceNumber(x, 0)).filter(Boolean);
    const type: string = body.type || body.act || "";
    if (!ids.length) return { code: 1, message: "未选择项目", data: null };
    if (type === "del" || type === "delete") {
      await this.prisma.salesman_product.deleteMany({ where: { salesman_product_id: { in: ids } } });
      return { code: 0, message: "批量操作执行成功！", data: true };
    }
    return { code: 1, message: "#type 错误", data: null };
  }

  // 配置
  @Get("config")
  @ApiOperation({ summary: "分销商品配置（兼容）" })
  @Authorities("salesmanProductManage")
  async config() {
    return { code: 0, message: "success", data: {} };
  }

  // 成交分析占位
  @Get("analysis")
  @ApiOperation({ summary: "成交分析（兼容占位）" })
  @Authorities("AnalysisTableManage")
  async analysis(@Query() query: any) {
    return { code: 0, message: "success", data: { records: [], total: 0 } };
  }
}
