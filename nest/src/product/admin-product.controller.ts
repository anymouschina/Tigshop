// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { ProductService } from "./product.service";
import { PrismaService } from "src/prisma/prisma.service";
import { toMoneyString } from "src/common/utils/format";
import { PanelService } from "src/panel/panel.service";

@ApiTags("Admin API - 商品管理")
@Controller("adminapi/product/product")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard)
export class AdminApiProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
    private readonly panel: PanelService,
  ) {}

  /**
   * 管理端创建商品（兼容 PHP 路径）
   * 前端：POST /adminapi/product/product/create
   */
  @Post("create")
  @UseGuards(AuthorityGuard)
  @Authorities("productManage")
  async createProduct(@Body() body: any, @Req() req: any) {
    // 店铺隔离：绑定当前管理员店铺
    const shopId = Number((await this.panel.getUserShopId(req.user?.userId)) || 0) || 0;

    // 简易 SN 生成（若未提供）
    const genSn = () => `SN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

    // 组装商品主表数据（尽量容错，兼容驼峰/下划线）
    const pickNum = (v: any, d = 0) => {
      if (v === null || v === undefined || v === "") return d;
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const pickStr = (v: any, d = "") => (v === null || v === undefined ? d : String(v));

    const firstImg = Array.isArray(body.imgList) && body.imgList.length ? body.imgList[0] : null;
    const productDescArr: Array<{ html?: string; pic?: string; type?: string }> = Array.isArray(body.productDescArr)
      ? body.productDescArr
      : [];
    // 将 productDescArr 合成为 HTML，若条目自带 html 则直接拼接，否则按 pic 渲染 img 标签
    const product_desc = productDescArr
      .map((it) => {
        if (it && typeof it.html === "string" && it.html) return it.html;
        if (it && typeof it.pic === "string" && it.pic) return `<div class="desc-pic-item"><img src="${it.pic}"></div>`;
        return "";
      })
      .filter(Boolean)
      .join("");

    // 电子卡券组：取第一个启用项作为绑定 group
    let card_group_id = 0;
    if (Array.isArray(body.eCardList) && body.eCardList.length) {
      const hit = body.eCardList.find((x: any) => (x?.isUse ?? x?.is_use ?? false) === true);
      card_group_id = pickNum(hit?.groupId ?? hit?.group_id ?? 0, 0);
    }

  const product_type_bool = Number(body.productType ?? body.product_type ?? 0) ? true : false;
  const data: any = {
      product_name: pickStr(body.productName ?? body.product_name, ""),
      product_sn: pickStr(body.productSn ?? body.product_sn, "") || genSn(),
      product_tsn: pickStr(body.productTsn ?? body.product_tsn ?? "0", "0"),
      category_id: pickNum(body.categoryId ?? body.category_id ?? 0, 0),
      brand_id: pickNum(body.brandId ?? body.brand_id ?? 0, 0),
      product_price: pickNum(body.productPrice ?? body.product_price ?? 0, 0),
      market_price: pickNum(body.marketPrice ?? body.market_price ?? 0, 0),
      product_status: pickNum(body.productStatus ?? body.product_status ?? 1, 1),
  product_type: product_type_bool,
      shipping_tpl_id: pickNum(body.shippingTplId ?? body.shipping_tpl_id ?? 0, 0),
      free_shipping: pickNum(body.freeShipping ?? body.free_shipping ?? 0, 0),
      keywords: pickStr(body.keywords ?? body.keyword ?? ""),
      product_brief: pickStr(body.productBrief ?? body.product_brief ?? ""),
      product_desc,
      product_weight: pickNum(body.productWeight ?? body.product_weight ?? 0, 0),
      product_stock: pickNum(body.productStock ?? body.product_stock ?? 0, 0),
      shop_category_id: pickNum(body.shopCategoryId ?? body.shop_category_id ?? 0, 0),
      check_status: pickNum(body.checkStatus ?? body.check_status ?? 1, 1),
      check_reason: pickStr(body.checkReason ?? body.check_reason ?? ""),
      remark: pickStr(body.remark ?? ""),
      give_integral: pickNum(body.giveIntegral ?? body.give_integral ?? -1, -1),
      rank_integral: pickNum(body.rankIntegral ?? body.rank_integral ?? -1, -1),
      integral: pickNum(body.integral ?? 0, 0),
      no_shipping: pickNum(body.noShipping ?? body.no_shipping ?? 0, 0),
      fixed_shipping_type: pickNum(body.fixedShippingType ?? body.fixed_shipping_type ?? 2, 2),
      fixed_shipping_fee: pickNum(body.fixedShippingFee ?? body.fixed_shipping_fee ?? 0, 0),
      card_group_id,
      pic_url: pickStr(firstImg?.picUrl ?? firstImg?.pic_url ?? body.picUrl ?? body.pic_url ?? ""),
      pic_thumb: pickStr(firstImg?.picThumb ?? firstImg?.pic_thumb ?? body.picThumb ?? body.pic_thumb ?? ""),
      pic_original: pickStr(firstImg?.picOriginal ?? firstImg?.pic_original ?? body.picOriginal ?? body.pic_original ?? ""),
      shop_id: shopId,
      add_time: Math.floor(Date.now() / 1000),
      last_update: Math.floor(Date.now() / 1000),
    };

    // 服务说明 ID 列表保存为逗号分隔字符串（与现有 detail 取法兼容）
    if (Array.isArray(body.productServiceIds) && body.productServiceIds.length) {
      data.product_service_ids = body.productServiceIds.map((x: any) => String(x)).join(",");
    }

  const created = await this.prisma.product.create({ data });

    // 图集入库
    if (Array.isArray(body.imgList) && body.imgList.length) {
      let sort = 1;
      for (const img of body.imgList) {
        const picUrl = pickStr(img?.picUrl ?? img?.url ?? img?.pic_url ?? "");
        if (!picUrl) continue;
        await this.prisma.product_gallery.create({
          data: {
            product_id: created.product_id,
            pic_url: picUrl,
            pic_thumb: pickStr(img?.picThumb ?? img?.thumb ?? img?.pic_thumb ?? picUrl),
            pic_large: pickStr(img?.picLarge ?? img?.large ?? img?.pic_large ?? picUrl),
            pic_original: pickStr(img?.picOriginal ?? img?.original ?? img?.pic_original ?? picUrl),
            sort_order: sort++,
          },
        });
      }
    }

    // 规格/属性入库：attrList.normal(0)/spe(1)/extra(其他)
    if (body?.attrList && typeof body.attrList === "object") {
      const groups: Array<{ typeGuess: number; list: any[] }> = [];
      const toNum = (v: any, d = 0) => {
        if (v === null || v === undefined || v === "") return d;
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };
      if (Array.isArray(body.attrList.normal)) groups.push({ typeGuess: 0, list: body.attrList.normal });
      if (Array.isArray(body.attrList.spe)) groups.push({ typeGuess: 1, list: body.attrList.spe });
      if (Array.isArray(body.attrList.extra)) groups.push({ typeGuess: 2, list: body.attrList.extra });
      const rows: any[] = [];
      for (const g of groups) {
        for (const grp of g.list) {
          const attrName = String(grp?.attrName ?? grp?.name ?? "");
          const arr = Array.isArray(grp?.attrList) ? grp.attrList : [];
          for (const it of arr) {
            const attrType = toNum(it?.attrType ?? g.typeGuess, g.typeGuess);
            rows.push({
              product_id: created.product_id,
              attr_type: attrType,
              attr_name: attrName,
              attr_value: String(it?.attrValue ?? it?.value ?? ""),
              attr_price: toNum(it?.attrPrice ?? it?.price ?? 0, 0),
              attr_color: it?.attrColor ?? it?.color ?? "",
              attr_pic: it?.attrPic ?? it?.pic ?? "",
              attr_pic_thumb: it?.attrPicThumb ?? it?.picThumb ?? "",
            });
          }
        }
      }
      if (rows.length) {
        await this.prisma.product_attributes.createMany({ data: rows });
      }
    }

    // SKU 入库与库存汇总：根据 productList 创建并回写 product_stock
    if (Array.isArray(body.productList) && body.productList.length) {
      const toNumber = (v: any, d = 0) => {
        if (v === null || v === undefined || v === "") return d;
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };
      let totalStock = 0;
      for (const item of body.productList) {
        const skuValue = String(item?.skuValue ?? item?.sku_value ?? "");
        const skuData = item?.skuData ?? (Array.isArray(item?.attrs) ? JSON.stringify(item.attrs) : undefined);
        const skuSn = item?.skuSn ?? item?.sku_sn ?? "";
        const skuTsn = item?.skuTsn ?? item?.sku_tsn ?? "";
        const skuStock = toNumber(item?.skuStock ?? item?.sku_stock ?? 0, 0);
        const skuPrice = toNumber(item?.skuPrice ?? item?.sku_price ?? data.product_price ?? 0, 0);
        totalStock += skuStock;
        await this.prisma.product_sku.create({
          data: {
            product_id: created.product_id,
            sku_value: skuValue,
            sku_data: skuData as any,
            sku_sn: String(skuSn || ""),
            sku_tsn: String(skuTsn || ""),
            sku_stock: skuStock,
            sku_price: skuPrice,
            vendor_product_sku_id: item?.vendorProductSkuId ?? item?.vendor_product_sku_id ?? null,
          },
        });
      }
      // 汇总库存覆盖主表库存
      await this.prisma.product.updateMany({ where: { product_id: created.product_id }, data: { product_stock: totalStock } });
    }

    return { code: 0, message: "success", data: { productId: created.product_id } };
  }

  /**
   * 管理端更新商品（兼容 PHP 路径）
   * 前端：POST /adminapi/product/product/update
   */
  @Post("update")
  @UseGuards(AuthorityGuard)
  @Authorities("productManage")
  async updateProduct(@Body() body: any, @Req() req: any) {
    const productId = Number(body.productId ?? body.product_id ?? body.id);
    if (!Number.isFinite(productId) || productId <= 0) {
      return { code: 400, message: "#id 错误", data: null };
    }
    const shopId = Number((await this.panel.getUserShopId(req.user?.userId)) || 0) || 0;

    // 店铺隔离：校验归属
    const existing = await this.prisma.product.findFirst({ where: { product_id: productId, ...(shopId > 0 ? { shop_id: shopId } : {}) } });
    if (!existing) return { code: 404, message: "商品不存在", data: null };

    const pickNum = (v: any) => {
      if (v === null || v === undefined || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const pickStr = (v: any) => (v === null || v === undefined ? undefined : String(v));

    const firstImg = Array.isArray(body.imgList) && body.imgList.length ? body.imgList[0] : null;
    const productDescArr: Array<{ html?: string; pic?: string; type?: string }> = Array.isArray(body.productDescArr)
      ? body.productDescArr
      : [];
    const product_desc = productDescArr
      .map((it) => {
        if (it && typeof it.html === "string" && it.html) return it.html;
        if (it && typeof it.pic === "string" && it.pic) return `<div class=\"desc-pic-item\"><img src=\"${it.pic}\"></div>`;
        return "";
      })
      .filter(Boolean)
      .join("");

    // 电子卡券组：取第一个启用项作为绑定 group（若传入）
    let card_group_id_upd: number | undefined = undefined;
    if (Array.isArray(body.eCardList)) {
      const hit = body.eCardList.find((x: any) => (x?.isUse ?? x?.is_use ?? false) === true);
      const n = Number(hit?.groupId ?? hit?.group_id);
      if (Number.isFinite(n)) card_group_id_upd = n;
    }

    const data: any = {
      product_name: pickStr(body.productName ?? body.product_name),
      product_sn: pickStr(body.productSn ?? body.product_sn),
      product_tsn: pickStr(body.productTsn ?? body.product_tsn),
      category_id: pickNum(body.categoryId ?? body.category_id),
      brand_id: pickNum(body.brandId ?? body.brand_id),
      product_price: pickNum(body.productPrice ?? body.product_price),
      market_price: pickNum(body.marketPrice ?? body.market_price),
  product_status: pickNum(body.productStatus ?? body.product_status),
  product_type: (body.productType ?? body.product_type) !== undefined ? (Number(body.productType ?? body.product_type) ? true : false) : undefined,
      shipping_tpl_id: pickNum(body.shippingTplId ?? body.shipping_tpl_id),
      free_shipping: pickNum(body.freeShipping ?? body.free_shipping),
      keywords: pickStr(body.keywords ?? body.keyword),
      product_brief: pickStr(body.productBrief ?? body.product_brief),
      product_desc: product_desc || undefined,
      product_weight: pickNum(body.productWeight ?? body.product_weight),
      product_stock: pickNum(body.productStock ?? body.product_stock),
      shop_category_id: pickNum(body.shopCategoryId ?? body.shop_category_id),
      check_status: pickNum(body.checkStatus ?? body.check_status),
      check_reason: pickStr(body.checkReason ?? body.check_reason),
      remark: pickStr(body.remark),
      give_integral: pickNum(body.giveIntegral ?? body.give_integral),
      rank_integral: pickNum(body.rankIntegral ?? body.rank_integral),
      integral: pickNum(body.integral),
      no_shipping: pickNum(body.noShipping ?? body.no_shipping),
      fixed_shipping_type: pickNum(body.fixedShippingType ?? body.fixed_shipping_type),
      fixed_shipping_fee: pickNum(body.fixedShippingFee ?? body.fixed_shipping_fee),
      last_update: Math.floor(Date.now() / 1000),
    };

    if (card_group_id_upd !== undefined) data.card_group_id = card_group_id_upd || 0;

    // 主图字段
    const pic_url = pickStr(firstImg?.picUrl ?? firstImg?.pic_url ?? body.picUrl ?? body.pic_url);
    const pic_thumb = pickStr(firstImg?.picThumb ?? firstImg?.pic_thumb ?? body.picThumb ?? body.pic_thumb);
    const pic_original = pickStr(firstImg?.picOriginal ?? firstImg?.pic_original ?? body.picOriginal ?? body.pic_original);
    if (pic_url !== undefined) data.pic_url = pic_url;
    if (pic_thumb !== undefined) data.pic_thumb = pic_thumb;
    if (pic_original !== undefined) data.pic_original = pic_original;

    // 服务 ID 列表
    if (Array.isArray(body.productServiceIds)) {
      data.product_service_ids = body.productServiceIds.map((x: any) => String(x)).join(",");
    }

    await this.prisma.product.updateMany({ where: { product_id: productId, ...(shopId > 0 ? { shop_id: shopId } : {}) }, data });

    // 规格/属性同步：若传入 attrList 则重建 product_attributes
    if (body?.attrList && typeof body.attrList === "object") {
      await this.prisma.product_attributes.deleteMany({ where: { product_id: productId } });
      const groups: Array<{ typeGuess: number; list: any[] }> = [];
      const toNum = (v: any, d = 0) => {
        if (v === null || v === undefined || v === "") return d;
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };
      if (Array.isArray(body.attrList.normal)) groups.push({ typeGuess: 0, list: body.attrList.normal });
      if (Array.isArray(body.attrList.spe)) groups.push({ typeGuess: 1, list: body.attrList.spe });
      if (Array.isArray(body.attrList.extra)) groups.push({ typeGuess: 2, list: body.attrList.extra });
      const rows: any[] = [];
      for (const g of groups) {
        for (const grp of g.list) {
          const attrName = String(grp?.attrName ?? grp?.name ?? "");
          const arr = Array.isArray(grp?.attrList) ? grp.attrList : [];
          for (const it of arr) {
            const attrType = toNum(it?.attrType ?? g.typeGuess, g.typeGuess);
            rows.push({
              product_id: productId,
              attr_type: attrType,
              attr_name: attrName,
              attr_value: String(it?.attrValue ?? it?.value ?? ""),
              attr_price: toNum(it?.attrPrice ?? it?.price ?? 0, 0),
              attr_color: it?.attrColor ?? it?.color ?? "",
              attr_pic: it?.attrPic ?? it?.pic ?? "",
              attr_pic_thumb: it?.attrPicThumb ?? it?.picThumb ?? "",
            });
          }
        }
      }
      if (rows.length) await this.prisma.product_attributes.createMany({ data: rows });
    }

    // SKU 同步：根据 productList 增删改，并回写总库存
    if (Array.isArray(body.productList)) {
      const incoming: any[] = body.productList || [];
      const exists = await this.prisma.product_sku.findMany({
        where: { product_id: productId },
        select: { sku_id: true, sku_value: true },
      });
      const idByValue = new Map<string, number>();
      for (const r of exists) idByValue.set(String(r.sku_value || ""), r.sku_id);
      const keepIds: number[] = [];

      const toNumber = (v: any, d = 0) => {
        if (v === null || v === undefined || v === "") return d;
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };

      for (const item of incoming) {
        const rawSkuId = item?.skuId ?? item?.sku_id;
        const skuId = Number(rawSkuId);
        const skuValue = String(item?.skuValue ?? item?.sku_value ?? "");
        const skuData = item?.skuData ?? (Array.isArray(item?.attrs) ? JSON.stringify(item.attrs) : undefined);
        const skuSn = item?.skuSn ?? item?.sku_sn ?? "";
        const skuTsn = item?.skuTsn ?? item?.sku_tsn ?? "";
        const skuStock = toNumber(item?.skuStock ?? item?.sku_stock ?? 0, 0);
  const skuPrice = toNumber(item?.skuPrice ?? item?.sku_price ?? 0, 0);

        let targetId: number | null = null;
        if (Number.isFinite(skuId) && skuId > 0) targetId = skuId;
        else if (skuValue && idByValue.has(skuValue)) targetId = idByValue.get(skuValue)!;

        if (targetId) {
          await this.prisma.product_sku.update({
            where: { sku_id: targetId },
            data: {
              sku_value: skuValue,
              sku_data: skuData as any,
              sku_sn: String(skuSn || ""),
              sku_tsn: String(skuTsn || ""),
              sku_stock: skuStock,
              sku_price: skuPrice,
              vendor_product_sku_id: item?.vendorProductSkuId ?? item?.vendor_product_sku_id ?? null,
            },
          });
          keepIds.push(targetId);
        } else {
          const created = await this.prisma.product_sku.create({
            data: {
              product_id: productId,
              sku_value: skuValue,
              sku_data: skuData as any,
              sku_sn: String(skuSn || ""),
              sku_tsn: String(skuTsn || ""),
              sku_stock: skuStock,
              sku_price: skuPrice,
              vendor_product_sku_id: item?.vendorProductSkuId ?? item?.vendor_product_sku_id ?? null,
            },
            select: { sku_id: true },
          });
          keepIds.push(created.sku_id);
        }
      }

      // 删除未保留的 SKU
      if (exists.length) {
        const toDelete = exists.map((r) => r.sku_id).filter((id) => !keepIds.includes(id));
        if (toDelete.length) {
          await this.prisma.product_sku.deleteMany({ where: { product_id: productId, sku_id: { in: toDelete } } });
        }
      }

      // 汇总库存并回写商品总库存
      const agg = await this.prisma.product_sku.aggregate({ _sum: { sku_stock: true }, where: { product_id: productId } });
      const totalStock = Number(agg._sum.sku_stock ?? 0) || 0;
      await this.prisma.product.updateMany({ where: { product_id: productId }, data: { product_stock: totalStock } });
    }

    // 图集：若传入则简单重建
    if (Array.isArray(body.imgList)) {
      await this.prisma.product_gallery.deleteMany({ where: { product_id: productId } });
      let sort = 1;
      for (const img of body.imgList) {
        const url = img?.picUrl ?? img?.url ?? img?.pic_url;
        if (!url) continue;
        await this.prisma.product_gallery.create({
          data: {
            product_id: productId,
            pic_url: String(url),
            pic_thumb: String(img?.picThumb ?? img?.thumb ?? img?.pic_thumb ?? url),
            pic_large: String(img?.picLarge ?? img?.large ?? img?.pic_large ?? url),
            pic_original: String(img?.picOriginal ?? img?.original ?? img?.pic_original ?? url),
            sort_order: sort++,
          },
        });
      }
    }

    return { code: 0, message: "success", data: true };
  }

  // 商品列表（adminapi）- 映射前端 product/product/list
  @Get("list")
  @ApiOperation({ summary: "获取商品列表（admin）" })
  async getList(@Query() query: any) {
    const result = await this.productService.findAll(query);

    // 金额格式化使用统一工具
    const toMoney = toMoneyString;

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
