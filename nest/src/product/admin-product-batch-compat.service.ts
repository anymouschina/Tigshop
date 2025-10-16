// @ts-nocheck
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PanelService } from "src/panel/panel.service";

type DealRange = 0 | 1 | 2 | 3; // 0: 全部, 1: 分类, 2: 品牌, 3: 商品

@Injectable()
export class AdminProductBatchCompatService {
  private readonly logger = new Logger(AdminProductBatchCompatService.name);
  constructor(
    private prisma: PrismaService,
    private panel: PanelService,
  ) {}

  // 解析 rangeIds 支持多种格式
  private parseIds(raw: any): number[] {
    const ids: number[] = [];
    const pushId = (v: any) => {
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) ids.push(n);
    };
    if (Array.isArray(raw)) raw.forEach(pushId);
    else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed: any = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsed.forEach(pushId);
          else if (parsed && Array.isArray(parsed.ids))
            parsed.ids.forEach(pushId);
        } catch (_) {
          trimmed.split(",").forEach(pushId);
        }
      } else {
        trimmed.split(",").forEach(pushId);
      }
    } else if (typeof raw === "number") pushId(raw);
    return Array.from(new Set(ids));
  }

  // 获取分类全量映射：id -> {name, parent_id}
  private async getCategoryMap() {
    const cats = await this.prisma.category.findMany({
      select: { category_id: true, category_name: true, parent_id: true },
    });
    const map = new Map<number, { name: string; parentId: number }>();
    for (const c of cats)
      map.set(c.category_id, { name: c.category_name, parentId: c.parent_id });
    return map;
  }

  // 递归向上构造分类路径名称 a|b|c
  private buildCategoryTreeName(
    catMap: Map<number, { name: string; parentId: number }>,
    cid?: number,
  ) {
    if (!cid) return "";
    const names: string[] = [];
    let cur = cid;
    const guard = new Set<number>();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      const c = catMap.get(cur);
      if (!c) break;
      names.unshift(c.name || "");
      if (!c.parentId || c.parentId === 0) break;
      cur = c.parentId;
    }
    return names.filter(Boolean).join("|");
  }

  // 展开分类所有子孙（包含自身）
  private expandCategoryIds(
    catMap: Map<number, { name: string; parentId: number }>,
    ids: number[],
  ): number[] {
    // 构建 parent -> children 索引
    const children = new Map<number, number[]>();
    for (const [id, c] of catMap.entries()) {
      const arr = children.get(c.parentId) || [];
      arr.push(id);
      children.set(c.parentId, arr);
    }
    const result = new Set<number>();
    const dfs = (id: number) => {
      if (result.has(id)) return;
      result.add(id);
      const ch = children.get(id) || [];
      ch.forEach(dfs);
    };
    ids.forEach(dfs);
    return Array.from(result);
  }

  // 批量导出，返回 [header[], rows[]]
  async buildExportRows(query: any, adminUserId: number) {
    const dealRange: DealRange = Number(
      query.dealRange ?? query.deal_range ?? 0,
    ) as DealRange;
    const rangeIds = this.parseIds(
      query.rangeIds ?? query.range_ids ?? query.ids ?? [],
    );

    const { shopId } = (await this.panel.validateUserAndGetShopId({
      user: { userId: adminUserId },
    })) || { shopId: 0 };

    const where: any = { is_delete: 0 };
    if (shopId > 0) where.shop_id = shopId;

    const catMap = await this.getCategoryMap();

    if (dealRange === 1) {
      if (!rangeIds.length) throw new BadRequestException("请选择分类");
      const allCatIds = this.expandCategoryIds(catMap, rangeIds);
      where.category_id = { in: allCatIds };
    } else if (dealRange === 2) {
      if (!rangeIds.length) throw new BadRequestException("请选择品牌");
      where.brand_id = { in: rangeIds };
    } else if (dealRange === 3) {
      if (!rangeIds.length) throw new BadRequestException("请选择商品");
      where.product_id = { in: rangeIds };
    }

    const fields = {
      product_name: true,
      product_sn: true,
      category_id: true,
      product_price: true,
      market_price: true,
      product_status: true,
      brand_id: true,
      pic_thumb: true,
      keywords: true,
      product_brief: true,
      product_desc: true,
      product_weight: true,
      product_stock: true,
    } as const;

    const products = await this.prisma.product.findMany({
      where,
      select: fields,
    });
    // 预取品牌映射
    const brandIds = Array.from(
      new Set(products.map((p) => p.brand_id).filter(Boolean)),
    );
    const brands = brandIds.length
      ? await this.prisma.brand.findMany({
          where: { brand_id: { in: brandIds as any } },
          select: { brand_id: true, brand_name: true },
        })
      : [];
    const brandMap = new Map<number, string>();
    for (const b of brands) brandMap.set(b.brand_id, b.brand_name);

    const header = [
      "商品名称",
      "商品编号",
      "分类",
      "商品售价",
      "市场价",
      "是否上架",
      "品牌",
      "商品相册",
      "关键词",
      "商品描述",
      "详细描述",
      "商品重量(KG)",
      "库存",
    ];

    const rows: string[][] = [];
    for (const p of products) {
      const catName = this.buildCategoryTreeName(catMap, p.category_id);
      const brandName = p.brand_id ? brandMap.get(p.brand_id) || "" : "";
      rows.push([
        String(p.product_name ?? ""),
        String(p.product_sn ?? ""),
        catName,
        String(p.product_price ?? ""),
        String(p.market_price ?? ""),
        String(p.product_status ?? 0),
        brandName,
        String(p.pic_thumb ?? ""),
        String(p.keywords ?? ""),
        String(p.product_brief ?? ""),
        String(p.product_desc ?? ""),
        String(p.product_weight ?? 0),
        String(p.product_stock ?? 0),
      ]);
    }
    return { header, rows };
  }

  private async ensureBrandIdByName(
    name?: string,
    isAuto = false,
  ): Promise<number> {
    if (!name) return 0;
    const ex = await this.prisma.brand.findFirst({
      where: { brand_name: name },
      select: { brand_id: true },
    });
    if (ex) return ex.brand_id;
    if (!isAuto) return 0;
    const created = await this.prisma.brand.create({
      data: { brand_name: name },
    });
    return created.brand_id;
  }

  private async ensureCategoryIdByTree(
    names: string[],
    isAuto = false,
  ): Promise<number | null> {
    if (!names || !names.length) return null;
    // 自上而下寻找/创建
    let parentId = 0;
    let currentId: number | null = null;
    for (const raw of names) {
      const name = String(raw).trim();
      if (!name) continue;
      const existed = await this.prisma.category.findFirst({
        where: { category_name: name, parent_id: parentId },
        select: { category_id: true },
      });
      if (existed) {
        currentId = existed.category_id;
        parentId = currentId;
        continue;
      }
      if (!isAuto) return null;
      const created = await this.prisma.category.create({
        data: { category_name: name, parent_id: parentId },
      });
      currentId = created.category_id;
      parentId = currentId;
    }
    return currentId;
  }

  private async genUniqueProductSn(prefix = "SN"): Promise<string> {
    // 简单唯一生成，避免冲突
    for (let i = 0; i < 5; i++) {
      const sn = `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;
      const exist = await this.prisma.product.count({
        where: { product_sn: sn },
      });
      if (!exist) return sn;
      await new Promise((r) => setTimeout(r, 5));
    }
    // 退化：再加随机段
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 100000)}`;
  }

  async batchUploadFromCsv(fileBuffer: Buffer, body: any, adminUserId: number) {
    if (!fileBuffer || !fileBuffer.length)
      throw new BadRequestException("请上传文件");
    const { isAutoCat = 0, isAutoBrand = 0 } = body || {};
    // 惰性加载 csv-parse/sync
    const { parse } = await import("csv-parse/sync");
    let records: string[][] = [];
    try {
      records = parse(fileBuffer, { skip_empty_lines: true });
    } catch (e) {
      throw new BadRequestException("CSV 解析失败: " + (e as Error).message);
    }
    if (!records.length) return { count: 0, msg: "请上传有数据的文件" };
    // 尝试跳过表头（若第一行包含“商品名称”）
    const maybeHeader = records[0];
    const headerIsTitle =
      maybeHeader &&
      maybeHeader[0] &&
      String(maybeHeader[0]).includes("商品名称");
    const rows = headerIsTitle ? records.slice(1) : records;

    const userCtx = { user: { userId: adminUserId } } as any;
    const shopId =
      (await this.panel.validateUserAndGetShopId(userCtx))?.shopId || 0;
    let count = 0;
    let msg = "";

    for (let k = 0; k < rows.length; k++) {
      const row = rows[k] || [];
      const index = k + 1 + (headerIsTitle ? 1 : 0);
      const name = row[0]?.trim();
      const snRaw = row[1]?.trim();
      const catPath = row[2]?.trim();
      if (!name || !catPath) {
        msg += `LINE ${index} 存在商品名称为空或分类为空的数据，已忽略此数据\n`;
        continue;
      }
      // 商品编号
      let productSn = snRaw;
      if (!productSn) productSn = await this.genUniqueProductSn();
      else {
        const exists = await this.prisma.product.count({
          where: { product_sn: productSn },
        });
        if (exists) {
          msg += `LINE ${index} 错误：存在商品编号重复的数据，已忽略此数据\n`;
          continue;
        }
      }
      // 分类处理
      const names = catPath
        .split("|")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const catId = await this.ensureCategoryIdByTree(
        names,
        Number(isAutoCat) === 1,
      );
      if (!catId) {
        msg += `LINE ${index} 错误：存在分类不存在的数据，已忽略此数据\n`;
        continue;
      }
      // 品牌
      const brandName = (row[6] || "").toString().trim();
      const brandId = await this.ensureBrandIdByName(
        brandName,
        Number(isAutoBrand) === 1,
      );

      const productPrice = row[3] ? Number(row[3]) : 0;
      const marketPrice = row[4]
        ? Number(row[4])
        : Number(
            (
              Number(process.env.MARKET_PRICE_RATE || 1.0) * productPrice
            ).toFixed(2),
          );

      const data: any = {
        product_name: name,
        product_sn: productSn,
        category_id: catId,
        product_price: productPrice,
        market_price: marketPrice,
        product_status: row[5] && Number(row[5]) ? 1 : 0,
        brand_id: brandId || 0,
        pic_url: row[7] || "",
        pic_thumb: row[7] || "",
        pic_original: row[7] || "",
        keywords: row[8] || "",
        product_brief: row[9] || "",
        product_desc: row[10] || "",
        product_weight: row[11] ? Number(row[11]) : 0,
        product_stock: row[12] ? Number(row[12]) : 0,
        shop_id: shopId,
        add_time: Math.floor(Date.now() / 1000),
      };

      const created = await this.prisma.product.create({ data });
      if (row[7]) {
        await this.prisma.product_gallery.create({
          data: {
            product_id: created.product_id,
            pic_url: row[7],
            pic_thumb: row[7],
            pic_large: row[7],
            pic_original: row[7],
            sort_order: 1,
          },
        });
      }
      count++;
    }
    return { count, msg: msg || "上传完成" };
  }

  async batchEdit(rows: any[]) {
    if (!Array.isArray(rows)) throw new BadRequestException("参数必须为数组");
    const allow = new Set([
      "product_name",
      "category_id",
      "brand_id",
      "product_sn",
      "product_tsn",
      "product_price",
      "market_price",
      "shipping_tpl_id",
      "free_shipping",
      "is_new",
      "is_best",
      "is_hot",
      "sort_order",
      "product_id",
      "product_status",
    ]);
    // 兼容驼峰 -> 下划线
    const keyMap: Record<string, string> = {
      productName: "product_name",
      categoryId: "category_id",
      brandId: "brand_id",
      productSn: "product_sn",
      productTsn: "product_tsn",
      productPrice: "product_price",
      marketPrice: "market_price",
      shippingTplId: "shipping_tpl_id",
      freeShipping: "free_shipping",
      isNew: "is_new",
      isBest: "is_best",
      isHot: "is_hot",
      sortOrder: "sort_order",
      productId: "product_id",
      productStatus: "product_status",
    };

    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      const index = i + 1;
      const raw = rows[i] || {};
      // 规范化键
      const row: Record<string, any> = {};
      for (const [k, v] of Object.entries(raw)) {
        const key = keyMap[k] || k;
        row[key] = v;
      }
      // 字段校验
      for (const k of Object.keys(row)) {
        if (!allow.has(k))
          throw new BadRequestException(
            `LINE ${index} 错误：不支持的字段 ${k}`,
          );
      }
      const pid = Number(row["product_id"]);
      if (!pid)
        throw new BadRequestException(`LINE ${index} 错误：缺少 product_id`);
      if (row["product_sn"] !== undefined) {
        const sn = String(row["product_sn"]).trim();
        if (!sn)
          throw new BadRequestException(`LINE ${index} 错误：商品编号不能为空`);
        const dup = await this.prisma.product.findFirst({
          where: { product_sn: sn, product_id: { not: pid } },
          select: { product_id: true },
        });
        if (dup)
          throw new BadRequestException(`LINE ${index} 错误：商品编号重复`);
      }
      if (row["product_name"] !== undefined) {
        const name = String(row["product_name"]).trim();
        if (!name)
          throw new BadRequestException(`LINE ${index} 错误：商品名称不能为空`);
      }

      // 通过原生 SQL 更新（绕过复合主键 where 复杂性）
      const updates: string[] = [];
      const vals: any[] = [];
      const add = (col: string, val: any) => {
        updates.push(`${col} = ?`);
        vals.push(val);
      };
      for (const k of allow) {
        if (k in row && k !== "product_id") add(k, row[k]);
      }
      if (!updates.length) continue;
      const sql = `UPDATE product SET ${updates.join(", ")}, last_update = UNIX_TIMESTAMP() WHERE product_id = ?`;
      vals.push(pid);
      await this.prisma.$executeRawUnsafe(sql, ...vals);
      count++;
    }
    return { count };
  }
}
