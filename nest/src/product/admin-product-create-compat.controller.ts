// @ts-nocheck
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 商品创建(兼容路径)")
@Controller("adminapi/product/product")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductCreateCompatController {
  constructor(private prisma: PrismaService, private panel: PanelService) {}

  private async genUniqueProductSn(prefix = "SN") {
    for (let i = 0; i < 5; i++) {
      const sn = `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;
      const exist = await this.prisma.product.count({ where: { product_sn: sn } });
      if (!exist) return sn;
      await new Promise((r) => setTimeout(r, 5));
    }
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 100000)}`;
  }

  @Post("create")
  @ApiOperation({ summary: "创建商品（admin 兼容）" })
  @Authorities("productManage")
  async create(@Body() body: any, @Req() req: any) {
    // 店铺隔离：写入当前管理员店铺
    const adminUserId = req.user?.userId || 0;
    const shopId = (await this.panel.getUserShopId(adminUserId)) || 0;

    // 基础字段映射（兼容前端驼峰）
    const productName = body.productName ?? body.product_name ?? "";
    if (!productName) {
      return { code: 400, message: "商品名称不能为空", data: null };
    }

    // 商品编号：优先 body.productSn；若未提供则生成
    let productSn = String(body.productSn || "").trim();
    if (!productSn) productSn = await this.genUniqueProductSn();

    const toNumber = (v: any, d = 0) => {
      if (v === null || v === undefined || v === "") return d;
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };

    const now = Math.floor(Date.now() / 1000);
    const firstImg = Array.isArray(body.imgList) && body.imgList.length > 0 ? body.imgList[0] : null;

    const data: any = {
      product_name: productName,
      product_sn: productSn,
      category_id: toNumber(body.categoryId ?? body.category_id, 0),
      product_price: toNumber(body.productPrice ?? body.product_price, 0),
      market_price: toNumber(body.marketPrice ?? body.market_price, 0),
      product_status: toNumber(body.productStatus ?? body.product_status, 1) ? 1 : 0,
      brand_id: toNumber(body.brandId ?? body.brand_id, 0),
      shipping_tpl_id: toNumber(body.shippingTplId ?? body.shipping_tpl_id, 0),
      free_shipping: toNumber(body.freeShipping ?? body.free_shipping, 0),
      shop_id: shopId,
      shop_category_id: toNumber(body.shopCategoryId ?? body.shop_category_id, 0),
      product_weight: toNumber(body.productWeight ?? body.product_weight, 0),
      product_stock: toNumber(body.productStock ?? body.product_stock, 0),
      keywords: body.keywords ?? "",
      product_brief: body.productBrief ?? "",
      product_desc: body.productDesc ?? "",
      pic_url: firstImg?.picUrl || firstImg?.pic_url || "",
      pic_thumb: firstImg?.picThumb || firstImg?.pic_thumb || firstImg?.picUrl || firstImg?.pic_url || "",
      pic_original: firstImg?.picOriginal || firstImg?.pic_original || firstImg?.picUrl || firstImg?.pic_url || "",
      is_support_cod: toNumber(body.isSupportCod ?? body.is_support_cod, 1),
      give_integral: toNumber(body.giveIntegral ?? body.give_integral, -1),
      rank_integral: toNumber(body.rankIntegral ?? body.rank_integral, -1),
      integral: toNumber(body.integral, 0),
      card_group_id: toNumber(
        body.cardGroupId ?? (Array.isArray(body.eCardList) && body.eCardList[0]?.groupId),
        0,
      ),
      virtual_sample: body.virtualSample ?? body.virtual_sample ?? "",
      paid_content: Array.isArray(body.paidContent) ? JSON.stringify(body.paidContent) : body.paidContent ?? null,
      no_shipping: toNumber(body.noShipping ?? body.no_shipping, 0),
      fixed_shipping_type: toNumber(body.fixedShippingType ?? body.fixed_shipping_type, 2),
      fixed_shipping_fee: toNumber(body.fixedShippingFee ?? body.fixed_shipping_fee, 0),
      limit_number: toNumber(body.limitNumber ?? body.limit_number, 0),
      product_service_ids: Array.isArray(body.productServiceIds)
        ? (body.productServiceIds as any[]).map((x) => String(x)).join(",")
        : body.productServiceIds ?? null,
      add_time: now,
    };

    // 若提供了富文本片段数组 productDescArr，用它来构建 product_desc
    if (Array.isArray(body.productDescArr) && body.productDescArr.length) {
      try {
        const html = body.productDescArr
          .map((it: any) => (typeof it?.html === "string" ? it.html : it?.pic ? `<div class="desc-pic-item"><img src="${it.pic}"></div>` : ""))
          .join("");
        if (html) data.product_desc = html;
      } catch {}
    }

    // 布尔型 product_type：非 0 视为 true
    if (body.productType !== undefined) data.product_type = !!toNumber(body.productType, 0);

    // 写入商品
    const created = await this.prisma.product.create({ data });

    // 相册
    if (Array.isArray(body.imgList) && body.imgList.length) {
      let sort = 1;
      for (const img of body.imgList) {
        const picUrl = img?.picUrl || img?.pic_url || "";
        const picThumb = img?.picThumb || img?.pic_thumb || picUrl;
        const picOriginal = img?.picOriginal || img?.pic_original || picUrl;
        if (!picUrl) continue;
        await this.prisma.product_gallery.create({
          data: {
            product_id: created.product_id,
            pic_url: picUrl,
            pic_thumb: picThumb,
            pic_large: picUrl,
            pic_original: picOriginal,
            sort_order: sort++,
          },
        });
      }
    }

    // SKU（可选）：如果前端已传 productList，这里简单落表
    if (Array.isArray(body.productList) && body.productList.length) {
      for (const row of body.productList) {
        await this.prisma.product_sku.create({
          data: {
            product_id: created.product_id,
            sku_value: row?.skuValue ?? row?.sku_value ?? "",
            sku_data: row?.skuData ?? row?.sku_data ?? null,
            sku_sn: row?.skuSn ?? row?.sku_sn ?? "",
            sku_tsn: row?.skuTsn ?? row?.sku_tsn ?? "",
            sku_stock: toNumber(row?.skuStock ?? row?.sku_stock, 0),
            sku_price: toNumber(row?.skuPrice ?? row?.sku_price, data.product_price ?? 0),
          },
        });
      }
    }

    return { code: 0, message: "success", data: created };
  }
}
