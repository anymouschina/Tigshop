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

  // 商品列表（adminapi）- 映射前端 product/product/list
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

    // 原始商品行
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

    // 组装最终记录
    const records = baseRecords.map((rec: any) => {
      const productId = Number(rec.productId ?? rec.product_id);
      const p = productMap.get(productId);
      const picUrlRaw: string = p?.pic_url ?? rec.picUrl ?? rec.pic_url ?? "";
      const picUrl = picUrlRaw;
      const thumbRaw = p?.pic_thumb ?? rec.picThumb ?? rec.pic_thumb ?? (picUrlRaw ? `${picUrlRaw}?x-oss-process=image/resize,m_pad,h_200,h_200` : "");
      const thumb = thumbRaw;
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
    return { code: 0, message: "success", data: { records, total: result.total || 0 } };
  }

  // 待审核商品数量（adminapi）- 映射前端 product/product/getWaitingCheckedCount
  @Get("getWaitingCheckedCount")
  @ApiOperation({ summary: "获取待审核商品数量（admin）" })
  async getWaitingCheckedCount(@Query() query: any) {
    const count = await this.productService.getWaitingCheckedCount(query);
    return { code: 0, message: "success", data: count };
  }

  // 配置型（admin）- 对齐 PHP: GET /adminapi/product/product/config
  @Get("config")
  @ApiOperation({ summary: "商品配置（admin 兼容）" })
  async getConfig(@Query() query: any) {
    const shopId = Number(query?.shopId ?? 0) || 0;

    // 属性模板
    const attr_tpl_list = (await (this.prisma as any).$queryRawUnsafe(
      "SELECT tpl_id, tpl_name FROM `product_attributes_tpl` ORDER BY tpl_id DESC LIMIT 1000",
    )) as Array<{ tpl_id: number; tpl_name: string }>;

    // 运费模板（shipping_tpl 在 Prisma 中被忽略，使用原生 SQL）
    const shippingTplSql = `
      SELECT shipping_tpl_id, shipping_tpl_name, shipping_time, is_free, pricing_type, is_default, shop_id
      FROM ` + "`shipping_tpl`" + `
      ${shopId > 0 ? "WHERE shop_id = ?" : ""}
      ORDER BY shipping_tpl_id DESC
      LIMIT 1000
    `;
    const shipping_tpl_list: any[] = await (this.prisma as any).$queryRawUnsafe(
      shippingTplSql,
      ...(shopId > 0 ? [shopId] : []),
    );

    // 服务说明
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

    // 电子卡券组
    const e_card_list = await this.prisma.e_card_group.findMany({
      select: { group_id: true, group_name: true, is_use: true },
      orderBy: { group_id: "desc" },
      take: 1000,
    });

    // 会员等级列表
    const user_rank_list = await this.prisma.user_rank.findMany({
      select: {
        rank_id: true,
        rank_name: true,
        rank_type: true,
        rank_logo: true,
        rank_level: true,
        min_growth_points: true,
        max_growth_points: true,
        discount: true,
        show_price: true,
        rank_ico: true,
        rank_bg: true,
        rank_point: true,
        free_shipping: true,
        rank_card_type: true,
        rights: true,
      },
      orderBy: { rank_id: "asc" },
      take: 1000,
    });

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

  // 详情数据（admin）- 对齐 PHP: GET /adminapi/product/product/detail?id=*
  @Get("detail")
  @ApiOperation({ summary: "商品详情（admin 兼容）" })
  async getAdminDetail(@Query("id") id: string) {
    const productId = Number(id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return { code: 400, message: "#id 错误", data: null };
    }

    const product = await this.prisma.product.findFirst({ where: { product_id: productId } });
    if (!product) {
      return { code: 404, message: "商品不存在", data: null };
    }

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
    const toWeight = (val: any): string => {
      if (val == null) return "0.000";
      try {
        const str = typeof val === "object" && typeof val.toString === "function" ? val.toString() : String(val);
        const n = Number(str);
        return Number.isFinite(n) ? n.toFixed(3) : (str.includes(".") ? str : `${str}.000`);
      } catch {
        return "0.000";
      }
    };

    // 图集（保留全域名）
    const galleryRows = await this.prisma.product_gallery.findMany({ where: { product_id: productId }, orderBy: { sort_order: "asc" }, take: 200 });
    const imgList = galleryRows.map((g: any) => ({
      picId: g.pic_id,
      productId: g.product_id,
      picUrl: g.pic_url || "",
      picDesc: g.pic_desc || "",
      picThumb: g.pic_thumb || "",
      picOriginal: g.pic_original || "",
      picLarge: g.pic_large || "",
      sortOrder: g.sort_order ?? 1,
    }));

    // 关联文章 ID 列表
    const productArticleList = (
      await this.prisma.product_article.findMany({ where: { goods_id: productId }, select: { article_id: true }, take: 1000 })
    ).map((x) => x.article_id);

    // 属性分组：normal(0)/spe(1)/extra(其他) 均按 attrName 分组，形如 { attrName, attrList: [...] }
    const attrs = await this.prisma.product_attributes.findMany({ where: { product_id: productId }, orderBy: { attributes_id: "asc" }, take: 1000 });
    const normalMap = new Map<string, any[]>();
    const speMap = new Map<string, any[]>();
    const extraMap = new Map<string, any[]>();
    for (const a of attrs) {
      const item = {
        attributesId: a.attributes_id,
        productId: a.product_id,
        attrType: a.attr_type,
        attrName: a.attr_name,
        attrValue: a.attr_value,
        attrPrice: toMoney(a.attr_price ?? 0),
        attrColor: a.attr_color || "",
        attrPic: a.attr_pic || "",
        attrPicThumb: a.attr_pic_thumb || "",
      };
      const key = a.attr_name || "";
      if (a.attr_type === 0) {
        if (!normalMap.has(key)) normalMap.set(key, []);
        normalMap.get(key)!.push(item);
      } else if (a.attr_type === 1) {
        if (!speMap.has(key)) speMap.set(key, []);
        speMap.get(key)!.push(item);
      } else {
        if (!extraMap.has(key)) extraMap.set(key, []);
        extraMap.get(key)!.push(item);
      }
    }
    const groupMapToArr = (m: Map<string, any[]>) => Array.from(m.entries()).map(([attrName, list]) => ({ attrName, attrList: list }));
    const attrList = {
      normal: groupMapToArr(normalMap),
      spe: groupMapToArr(speMap),
      extra: groupMapToArr(extraMap),
    };

    // SKU 列表
    const skuRows = await this.prisma.product_sku.findMany({ where: { product_id: productId }, orderBy: { sku_id: "asc" }, take: 2000 });
    const parseSkuDataDetail = (raw: any, sku_value: string): any => {
      if (!raw) return sku_value || "";
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? JSON.stringify(parsed) : sku_value || "";
      } catch {
        return sku_value || "";
      }
    };
    const productList = skuRows.map((row: any) => ({
      skuId: row.sku_id,
      productId: row.product_id,
      skuValue: row.sku_value || "",
      skuData: parseSkuDataDetail(row.sku_data, row.sku_value),
      skuSn: row.sku_sn || "",
      skuStock: Number(row.sku_stock ?? 0),
      skuTsn: row.sku_tsn || "",
      skuPrice: toMoney(row.sku_price ?? 0),
      vendorProductSkuId: row.vendor_product_sku_id ?? null,
    }));

    // 描述与图片数组（保留全域名）
    const productDescRaw = (product as any).product_desc || "";
    const productDesc = String(productDescRaw);
    const productDescArr: Array<{ type: string; pic: string; html: string }> = [];
    const imgRe = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(productDescRaw || ""))) {
      const pic = m[1];
      const html = `<div class=\"desc-pic-item\"><img src=\"${pic}\"></div>`;
      productDescArr.push({ type: "pic", pic, html });
    }

    // 强制审核失败下架
    const checkStatus = product.check_status ?? 1;
    const productStatus = checkStatus != 1 ? 0 : (product.product_status ?? 1);

    // 构建返回
    const data = {
      productId: product.product_id,
      productName: product.product_name,
      productSn: product.product_sn,
      productTsn: product.product_tsn ?? "0",
      productStock: product.product_stock ?? 0,
      productPrice: toMoney(product.product_price),
      marketPrice: toMoney(product.market_price),
      shippingTplId: product.shipping_tpl_id ?? 0,
      productStatus,
      productType: (product.product_type ? 1 : 0) as 0 | 1,
      categoryId: product.category_id ?? 0,
      brandId: product.brand_id ?? 0,
      shopId: product.shop_id ?? 0,
      keywords: product.keywords ?? "",
      shopCategoryId: product.shop_category_id ?? 0,
      checkStatus,
      checkReason: product.check_reason ?? "",
      clickCount: product.click_count ?? 0,
      productWeight: toWeight(product.product_weight),
      isPromote: product.is_promote ?? 0,
      isPromoteActivity: product.is_promote_activity ? 1 : 0,
      promotePrice: toMoney(product.promote_price ?? 0),
      promoteStartDate: product.promote_start_date ?? 0,
      promoteEndDate: product.promote_end_date ?? 0,
      seckillMaxNum: product.seckill_max_num ?? 0,
      productBrief: product.product_brief ?? "",
      productDesc,
      picUrl: product.pic_url || "",
      picThumb: product.pic_thumb || "",
      picOriginal: product.pic_original || "",
      commentTag: product.comment_tag ?? "",
      freeShipping: product.free_shipping ?? 0,
      integral: product.integral ?? 0,
      addTime: product.add_time ?? 0,
      sortOrder: product.sort_order ?? 100,
      storeSortOrder: product.store_sort_order ?? 100,
      isDelete: product.is_delete ?? 0,
      isBest: product.is_best ?? 0,
      isNew: product.is_new ?? 0,
      isHot: product.is_hot ?? 0,
      lastUpdate: product.last_update ?? 0,
      remark: product.remark ?? "",
      giveIntegral: product.give_integral ?? -1,
      rankIntegral: product.rank_integral ?? -1,
      suppliersId: product.suppliers_id ?? 0,
      virtualSales: product.virtual_sales ?? 0,
      limitNumber: product.limit_number ?? 0,
      productCare: product.product_care ?? "",
      productRelated: product.product_related ?? null,
      productServiceIds: product.product_service_ids ?? "",
      isSupportReturn: product.is_support_return ?? 0,
      isSupportCod: product.is_support_cod ?? 1,
      productVideo: product.product_video ?? "",
      prepayPrice: toMoney(product.prepay_price ?? 0),
      cardGroupId: product.card_group_id ?? 0,
      virtualSample: product.virtual_sample ?? "",
      paidContent: (product as any).paid_content ?? "",
      noShipping: product.no_shipping ?? 0,
      fixedShippingType: product.fixed_shipping_type ?? 2,
      fixedShippingFee: toMoney(product.fixed_shipping_fee ?? 0),
      vendorProductId: product.vendor_product_id ?? null,
      vendorId: product.vendor_id ?? null,
      shopPickupTplId: null,
      isShopPickup: 0,
      isLogistics: 1,
      isShopDelivery: 0,
      productDescArr,
      imgList,
      productVideoInfo: [],
      productArticleList,
      attrList,
      productList,
    } as any;

    return { code: 0, message: "success", data };
  }
}
