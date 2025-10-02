// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { ProductService } from "./product.service";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 商品管理")
@Controller("adminapi/product/product")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 商品列表（adminapi）- 映射前端 product/product/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取商品列表（admin）" })
  async getList(@Query() query: any) {
    const result = await this.productService.findAll(query);

    // 金额转两位小数字符串
    const toMoney = (val: any): string => {
      if (val == null) return "0.00";
      try {
        const str = typeof val === "object" && typeof val.toString === "function" ? val.toString() : String(val);
        const n = Number(str);
        return Number.isFinite(n) ? n.toFixed(2) : (str.includes(".") ? str : `${str}.00`);
      } catch {
        return "0.00";
      }
    };

  const baseRecords = Array.isArray(result.records) ? result.records : [];
    const productIds: number[] = baseRecords.map((r: any) => Number(r.productId || r.product_id)).filter((n) => Number.isFinite(n));

    // 批量获取 SKU 列表并按商品聚合
    const skuRows = productIds.length
      ? await this.prisma.product_sku.findMany({ where: { product_id: { in: productIds } }, take: 5000 })
      : [];
    const skuByPid = new Map<number, any[]>();
    const parseSkuData = (raw: any, sku_value: string): any[] => {
      if (!raw) {
        // 回退解析 sku_value 格式：如 "颜色:白色|尺码:M"
        if (!sku_value) return [];
        const pairs = String(sku_value).split(/[|、,，]/).map((x) => x.trim()).filter(Boolean);
        return pairs
          .map((p) => {
            const [name, value] = p.split(":").map((x) => x?.trim());
            if (!name || !value) return null;
            return { name, value };
          })
          .filter(Boolean) as any[];
      }
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch {
        return [];
      }
    };
    for (const row of skuRows) {
      const pid = Number((row as any).product_id);
      if (!skuByPid.has(pid)) skuByPid.set(pid, []);
      skuByPid.get(pid)!.push({
        skuId: (row as any).sku_id,
        productId: pid,
        skuValue: (row as any).sku_value || "",
        skuData: parseSkuData((row as any).sku_data, (row as any).sku_value),
        skuSn: (row as any).sku_sn || "",
        skuStock: Number((row as any).sku_stock ?? 0),
        skuTsn: (row as any).sku_tsn || "",
        skuPrice: toMoney((row as any).sku_price ?? 0),
        marketPrice: "0.00",
        costPrice: "0.00",
        vendorProductSkuId: (row as any).vendor_product_sku_id ?? null,
      });
    }

    // 原始商品行（获取未被 camelCase 破坏的 Decimal 值）
    const productRows = productIds.length
      ? await this.prisma.product.findMany({
          where: { product_id: { in: productIds } },
          select: {
            product_id: true,
            product_price: true,
            market_price: true,
            shipping_tpl_id: true,
            free_shipping: true,
            pic_url: true,
            pic_thumb: true,
            product_sn: true,
            product_tsn: true,
            product_status: true,
            product_stock: true,
            product_name: true,
            category_id: true,
            brand_id: true,
            check_status: true,
            check_reason: true,
            shop_id: true,
            suppliers_id: true,
            is_best: true,
            is_new: true,
            is_hot: true,
            sort_order: true,
            product_type: true,
          },
        })
      : [];
    const productMap = new Map<number, any>();
    for (const p of productRows) productMap.set(p.product_id, p);
    // 批量获取店铺信息
    const shopIds = Array.from(new Set(baseRecords.map((r: any) => Number(r.shopId ?? r.shop_id)).filter((n) => Number.isFinite(n) && n > 0)));
    const shopRows = shopIds.length
      ? await this.prisma.shop.findMany({ where: { shop_id: { in: shopIds } }, select: { shop_id: true, shop_title: true } })
      : [];
    const shopMap = new Map<number, { statusText: string; shopId: number; shopTitle: string }>();
    for (const s of shopRows as any[]) {
      shopMap.set(s.shop_id, { statusText: "", shopId: s.shop_id, shopTitle: s.shop_title || "" });
    }

    // 组装最终记录，字段对齐 PHP
    const records = baseRecords.map((rec: any) => {
      const productId = Number(rec.productId ?? rec.product_id);
      const p = productMap.get(productId);
      const picUrlRaw: string = p?.pic_url ?? rec.picUrl ?? rec.pic_url ?? "";
      const picUrl = picUrlRaw
      const thumbRaw = p?.pic_thumb ?? rec.picThumb ?? rec.pic_thumb ?? (picUrlRaw ? `${picUrlRaw}?x-oss-process=image/resize,m_pad,h_200,h_200` : "");
      const thumb = thumbRaw
      const shopId: number = Number(rec.shopId ?? rec.shop_id ?? 0) || 0;
      return {
        categoryId: rec.categoryId ?? rec.category_id ?? p?.category_id ?? 0,
        brandId: rec.brandId ?? rec.brand_id ?? p?.brand_id ?? 0,
        productTsn: rec.productTsn ?? rec.product_tsn ?? p?.product_tsn ?? null,
        marketPrice: toMoney(p?.market_price ?? rec.marketPrice ?? rec.market_price ?? 0),
        virtualSales: rec.virtualSales ?? rec.virtual_sales ?? 0,
        shippingTplId: p?.shipping_tpl_id ?? rec.shippingTplId ?? rec.shipping_tpl_id ?? 0,
        freeShipping: p?.free_shipping ?? rec.freeShipping ?? rec.free_shipping ?? 0,
        productId,
        picUrl,
        picThumb: thumb,
        productName: rec.productName ?? rec.product_name ?? p?.product_name ?? "",
        checkStatus: rec.checkStatus ?? rec.check_status ?? p?.check_status ?? 1,
        checkReason: rec.checkReason ?? rec.check_reason ?? p?.check_reason ?? "",
        shopId,
        suppliersId: rec.suppliersId ?? rec.suppliers_id ?? p?.suppliers_id ?? null,
        productType: (rec.productType ?? rec.product_type ?? p?.product_type) ? 1 : 0,
        productSn: rec.productSn ?? rec.product_sn ?? p?.product_sn ?? "",
        productPrice: toMoney(p?.product_price ?? rec.productPrice ?? rec.product_price ?? 0),
        productStatus: rec.productStatus ?? rec.product_status ?? p?.product_status ?? 1,
        isBest: rec.isBest ?? rec.is_best ?? p?.is_best ?? 0,
        isNew: rec.isNew ?? rec.is_new ?? p?.is_new ?? 0,
        isHot: rec.isHot ?? rec.is_hot ?? p?.is_hot ?? 0,
        productStock: rec.productStock ?? rec.product_stock ?? p?.product_stock ?? 0,
        sortOrder: rec.sortOrder ?? rec.sort_order ?? p?.sort_order ?? 100,
        price: toMoney(p?.product_price ?? rec.productPrice ?? rec.product_price ?? 0),
        isSeckill: 0,
        seckillEndTime: "",
        productSku: skuByPid.get(productId) || [],
        shop: shopId > 0 ? shopMap.get(shopId) ?? null : null,
      };
    });
    return {
      code: 0,
      message: "success",
      data: {
        records,
        total: result.total || 0,
      },
    };
  }

  /**
   * 待审核商品数量（adminapi）- 映射前端 product/product/getWaitingCheckedCount
   */
  @Get("getWaitingCheckedCount")
  @ApiOperation({ summary: "获取待审核商品数量（admin）" })
  async getWaitingCheckedCount(@Query() query: any) {
    const count = await this.productService.getWaitingCheckedCount(query);
    return { code: 0, message: "success", data: count };
  }

  /**
   * 配置型（admin）- 对齐 PHP: GET /adminapi/product/product/config
   */
  @Get("config")
  @ApiOperation({ summary: "商品配置（admin 兼容）" })
  async getConfig(@Query() query: any) {
    const shopId = Number(query?.shopId ?? 0) || 0;

    // 属性模板（仅 id+name）- 使用原生 SQL，避免因 Prisma Client 未生成该模型导致的 undefined
    const attr_tpl_list = (await (this.prisma as any).$queryRawUnsafe(
      "SELECT tpl_id, tpl_name FROM `product_attributes_tpl` ORDER BY tpl_id DESC LIMIT 1000",
    )) as Array<{ tpl_id: number; tpl_name: string }>;

    // 运费模板（可按店铺过滤）
    // 注意：shipping_tpl 在 Prisma schema 中被 @@ignore，无法通过 this.prisma.shipping_tpl 访问
    // 这里使用原生 SQL 查询以保持兼容
    const shippingTplSql = `
      SELECT shipping_tpl_id, shipping_tpl_name, shipping_time, is_free, pricing_type, is_default, shop_id
      FROM \`shipping_tpl\`
      ${shopId > 0 ? "WHERE shop_id = ?" : ""}
      ORDER BY shipping_tpl_id DESC
      LIMIT 1000
    `;
    const shipping_tpl_list: any[] = await (this.prisma as any).$queryRawUnsafe(
      shippingTplSql,
      ...(shopId > 0 ? [shopId] : []),
    );

    // 服务说明完整列表（id+name+desc+icon+default_on）
    const service_list = await this.prisma.product_services.findMany({
      select: {
        product_service_id: true,
        product_service_name: true,
        product_service_desc: true,
        ico_img: true,
        sort_order: true,
        default_on: true,
        shop_id: true,
      },
      orderBy: { product_service_id: "desc" },
      take: 1000,
    });

    // 默认开启的服务 ID 列表
    const product_service_ids = (
      await this.prisma.product_services.findMany({
        where: { default_on: 1 },
        select: { product_service_id: true },
        take: 1000,
      })
    ).map((x) => x.product_service_id);

    // 电子卡券组（兼容 PHP 的 e_card_list）
    const e_card_list = await this.prisma.e_card_group.findMany({
      select: { group_id: true, group_name: true, is_use: true },
      orderBy: { group_id: "desc" },
      take: 1000,
    });

    // 会员等级列表（简化：全部返回）
    const user_rank_list = await this.prisma.user_rank.findMany({
      select: {
        rank_id: true,
        rank_name: true,
        rank_type: true,
        rank_logo: true,
        rank_level: true,
        min_points: true,
        max_points: true,
        discount: true,
        description: true,
      },
      orderBy: { rank_id: "asc" },
      take: 1000,
    });

    // item 默认值（参考 PHP 行为：店铺商品可根据配置控制审核与上架，这里默认均为 1）
    const item: any = {
      user_rank_list,
      shop_id: shopId,
      check_status: 1,
      product_status: 1,
      product_service_ids,
    };

    return {
      code: 0,
      message: "success",
      data: {
        shipping_tpl_list,
        suppliers_list: [],
        service_list,
        attr_tpl_list,
        item,
        e_card_list,
      },
    };
  }

  /**
   * 详情数据（admin）- 对齐 PHP: GET /adminapi/product/product/detail?id=*
   */
  @Get("detail")
  @ApiOperation({ summary: "商品详情（admin 兼容）" })
  async getAdminDetail(@Query("id") id: string) {
    const productId = Number(id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return { code: 400, message: "#id 错误", data: null };
    }

    const product = await this.prisma.product.findFirst({
      where: { product_id: productId },
    });
    if (!product) {
      return { code: 404, message: "商品不存在", data: null };
    }

    // 关联文章 ID 列表（goods_id=productId）
    const product_article_list = (
      await this.prisma.product_article.findMany({
        where: { goods_id: productId },
        select: { article_id: true },
        take: 1000,
      })
    ).map((x) => x.article_id);

    // 属性列表（原样返回）
    const attr_list = await this.prisma.product_attributes.findMany({
      where: { product_id: productId },
      take: 1000,
    });

    // 规格列表（原样返回）
    const product_list = await this.prisma.product_sku.findMany({
      where: { product_id: productId },
      take: 1000,
    });

    // 补充 PHP 中的 product_weight_by_unit
    let product_weight_by_unit: number | undefined = undefined;
    const weight = Number(product.product_weight ?? product.weight ?? 0);
    if (weight > 0) {
      product_weight_by_unit = weight >= 1 ? weight : weight / 0.001; // g -> kg 兼容逻辑
    }

    // 兼容 paid_content 为字符串时的处理
    let paid_content: any = (product as any).paid_content ?? null;
    if (paid_content && typeof paid_content !== "object") {
      paid_content = [
        {
          html: String(paid_content),
          type: "text",
        },
      ];
    }

    const itemRaw = {
      ...product,
      product_article_list,
      attr_list,
      product_list,
      paid_content,
      product_weight_by_unit,
    } as any;

    // 若审核未通过，则强制下架（对齐 PHP）
    if ((itemRaw.check_status ?? 1) != 1) {
      itemRaw.product_status = 0;
    }

    // 归一化 Decimal 对象为 number
    const toNumber = (val: any): any => {
      if (val == null) return val;
      if (typeof val === "object" && "s" in val && "e" in val && "d" in val) {
        try {
          if (typeof (val as any).toString === "function") {
            const str = (val as any).toString();
            const n = Number(str);
            return Number.isNaN(n) ? str : n;
          }
        } catch {}
      }
      if (typeof val === "string") {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    };
    const item: any = { ...itemRaw };
    [
      "product_price",
      "market_price",
      "cost_price",
      "promote_price",
      "prepay_price",
      "fixed_shipping_fee",
      "product_weight",
    ].forEach((k) => {
      if (k in item) item[k] = toNumber(item[k]);
    });

    return { code: 0, message: "success", data: item };
  }
}
