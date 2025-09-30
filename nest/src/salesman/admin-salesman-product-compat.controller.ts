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

  private toAmountStr(v: any, digits = 2): string {
    if (v == null) return (0).toFixed(digits);
    try {
      const n = typeof v === "number" ? v : Number(v as any);
      return Number.isFinite(n) ? n.toFixed(digits) : String(v);
    } catch {
      return (0).toFixed(digits);
    }
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
      // 返回完整字段，方便对齐 PHP 响应（拦截器会统一驼峰 + 时间格式）
      this.prisma.product.findMany({
        where,
        orderBy: { product_id: "desc" },
        skip,
        take: size,
      }),
      this.prisma.product.count({ where }),
    ]);

    const productIds = products.map((p) => p.product_id);
    const [spList, galleries] = await Promise.all([
      // 同店铺范围内的分销商品配置
      this.prisma.salesman_product.findMany({ where: { product_id: { in: productIds }, shop_id: shopId } }),
      productIds.length
        ? this.prisma.product_gallery.findMany({
            where: { product_id: { in: productIds } },
            orderBy: { sort_order: "asc" },
            select: { pic_id: true, product_id: true, pic_url: true, pic_desc: true, pic_thumb: true, pic_original: true, pic_large: true, sort_order: true },
          })
        : Promise.resolve([]),
    ]);

    const spMap = new Map(spList.map((x) => [x.product_id, x] as const));
    const picsMap = new Map<number, any[]>();
    for (const g of galleries as any[]) {
      const arr = picsMap.get(g.product_id) || [];
      arr.push({
        pic_id: g.pic_id || 0,
        product_id: g.product_id || 0,
        pic_url: g.pic_url || "",
        pic_desc: g.pic_desc || "",
        pic_thumb: g.pic_thumb || "",
        pic_original: g.pic_original || "",
        pic_large: g.pic_large || "",
        sort_order: g.sort_order || 0,
      });
      picsMap.set(g.product_id, arr);
    }

    const normalizeSalesmanProduct = (sp: any) => {
      if (!sp) return null;
      const out: any = {
        salesman_product_id: sp.salesman_product_id,
        product_id: sp.product_id,
        is_join: sp.is_join ?? 0,
        commission_type: sp.commission_type ?? 1,
        commission_data: typeof sp.commission_data === "string" ? sp.commission_data : JSON.stringify(sp.commission_data ?? {}),
        add_time: sp.add_time ?? 0,
        update_time: sp.update_time ?? 0,
        shop_id: sp.shop_id ?? shopId,
      };

      // 生成带文案的佣金展示，兼容 PHP：
      // productCommission: { productCommission: "普通分销员佣金:1%;银牌分销员佣金:2%;...", subCommission: "" }
      try {
        const parsed = this.parseMaybeJson(sp.commission_data) || {};
        let levelArr: any[] = [];
        if (Array.isArray(parsed)) {
          // 形如 [{ levelArr: [...] }]
          if (parsed.length && parsed[0]?.levelArr) levelArr = parsed[0].levelArr;
          else levelArr = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray((parsed as any).levelArr)) levelArr = (parsed as any).levelArr;
          else {
            const mapKeys = [
              { key: "one", level: 1 },
              { key: "two", level: 2 },
              { key: "three", level: 3 },
              { key: "four", level: 4 },
              { key: "level1", level: 1 },
              { key: "level2", level: 2 },
              { key: "level3", level: 3 },
              { key: "level4", level: 4 },
            ];
            for (const mk of mapKeys) {
              if (parsed[mk.key] != null) levelArr.push({ level: mk.level, rate: parsed[mk.key] });
            }
          }
        }

        const levelText: Record<number, string> = { 1: "普通分销员", 2: "银牌分销员", 3: "金牌分销员", 4: "钻石分销员" };
        const unit = out.commission_type === 1 ? "%" : "";
        const parts: string[] = [];
        for (const item of levelArr) {
          if (!item) continue;
          const lv = Number(item.level) || 0;
          let rateVal = item.rate;
          // 尽量保持原始小数展示；若为数字再补单位
          if (rateVal == null) continue;
          if (typeof rateVal === "number") rateVal = out.commission_type === 1 ? String(rateVal) : this.toAmountStr(rateVal, 2);
          parts.push(`${levelText[lv] || `L${lv}`}佣金:${rateVal}${unit};`);
        }
        out.product_commission = { product_commission: parts.join(""), sub_commission: "" };
      } catch {}

      return out;
    };

    const records = products.map((p) => {
      const sp = spMap.get(p.product_id) || null;
      return {
        // 直接展开产品，保留所有字段（Decimal -> JSON 序列化为字符串）
        ...p,
        product_price: this.toAmountStr(p.product_price),
        pics: picsMap.get(p.product_id) || [],
        // 兼容前端可能使用的别名 images
        images: picsMap.get(p.product_id) || [],
        salesman_product: normalizeSalesmanProduct(sp),
      };
    });

    return { code: 0, message: "success", data: { records, total } };
  }

  // 详情
  @Get("detail")
  @ApiOperation({ summary: "分销商品详情（兼容）" })
  @Authorities("salesmanProductManage")
  async detail(@Query("id") id: number) {
    const productId = this.coerceNumber(id, 0);
    if (!productId) return { code: 0, message: "success", data: null };
    // product 使用了复合主键，不能用 findUnique 单字段查询，改用 findFirst
    const product = await this.prisma.product.findFirst({ where: { product_id: productId } });
    const sp = await this.prisma.salesman_product.findFirst({ where: { product_id: productId } });
    const item = {
      product_id: product?.product_id,
      is_join: sp?.is_join || 0,
      commission_type: sp?.commission_type || 1,
      commission_data: this.parseMaybeJson(sp?.commission_data) || {},
    };
    return { code: 0, message: "success", data: item };
  }

  // 创建（兼容 PHP：与 update 语义接近，按 productId 幂等 upsert）
  @Post("create")
  @ApiOperation({ summary: "分销商品创建（兼容）" })
  @Authorities("salesmanProductManage")
  async create(@Req() req: any, @Body() body: any) {
    const shopId = await this.panel.getUserShopId(req.user?.userId);
    const productId = this.coerceNumber(body.productId || body.product_id, 0);
    if (!productId) return { code: 400, message: "productId required", data: null };
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
