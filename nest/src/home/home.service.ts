// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HomeService {
  private readonly logger: Logger;

  constructor(private prisma: PrismaService) {
    this.logger = new Logger(HomeService.name);
  }

  // -------- 首页（H5） --------
  async getHomeData(query: {
    preview_id?: number;
    decorate_id?: number;
    previewId?: number;
    decorateId?: number;
  }) {
    // 同时兼容驼峰和下划线参数名
    let previewId = Number(query.previewId ?? query.preview_id ?? 0) || 0;
    const decorateId = Number(query.decorateId ?? query.decorate_id ?? 0) || 0;

    // 对齐 PHP: 支持 DEMO_DEFAULT_DECORATE_ID 覆盖预览
    const demoPreview = Number(process.env.DEMO_DEFAULT_DECORATE_ID || 0);
    // 仅当未显式传入预览参数时使用 DEMO 覆盖，避免开发态干扰
    if (previewId <= 0 && demoPreview > 0) previewId = demoPreview;

    if (previewId > 0) {
      const data = await this.getAppPreviewDecorate(previewId);
      return data; // camelCase: { decorateId, moduleList, pageModule }
    }

    if (decorateId > 0) {
      const data = await this.getDecorate(1, decorateId);
      return this.normalizeDecorateData(data, decorateId);
    }

    return this.getAppHomeDecorate();
  }

  // -------- PC 首页 --------
  async getPcHomeData(query: {
    preview_id?: number;
    decorate_id?: number;
    previewId?: number;
    decorateId?: number;
  }) {
    const previewId = Number(query.previewId ?? query.preview_id ?? 0) || 0;
    const decorateId = Number(query.decorateId ?? query.decorate_id ?? 0) || 0;

    if (previewId > 0) {
      const data = await this.getPcPreviewDecorate(previewId);
      // 兼容输出：转 camelCase（PC 端不返回 pageModule）
      return this.normalizeDecorateData(data, previewId);
    }

    if (decorateId > 0) {
      const data = await this.getDecorate(2, decorateId);
      return this.normalizeDecorateData(data, decorateId);
    }

    const pcData = await this.getPcHomeDecorate();
    return this.normalizeDecorateData(pcData, pcData?.decorate_id);
  }

  // ========== 装修数据内部实现 ==========
  private async getAppPreviewDecorate(previewId: number) {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: { decorate_id: previewId, decorate_type: 1 },
      });

      if (!decorate) {
        this.logger.warn("首页装修模板不存在，返回空结构");
        return { decorateId: 0, moduleList: [], pageModule: {} };
      }

      // 预览规则：moduleList 来自 draft_data，pageModule 来自 data（对齐 PHP）
      let draftParsed: any = null;
      let pubParsed: any = null;
      try {
        draftParsed = decorate.draft_data
          ? JSON.parse(decorate.draft_data)
          : null;
      } catch (e) {
        this.logger.warn("draft_data 解析失败", e);
      }
      try {
        pubParsed = decorate.data ? JSON.parse(decorate.data) : null;
      } catch (e) {
        this.logger.warn("data 解析失败", e);
      }

      // 兼容两种历史结构
      const moduleList = draftParsed
        ? (draftParsed.moduleList ?? draftParsed.module_list ?? [])
        : [];
      const pageModule = pubParsed
        ? (pubParsed.pageModule ?? pubParsed.page_module ?? {})
        : {};

      return {
        decorateId: decorate.decorate_id,
        moduleList: moduleList || [],
        pageModule: pageModule || {},
      };
    } catch (error) {
      this.logger.error("获取预览装修失败", error);
      throw error;
    }
  }

  private async getPcPreviewDecorate(previewId: number) {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: { decorate_id: previewId, decorate_type: 2 },
      });

      if (!decorate) {
        return { decorate_id: previewId, module_list: [], backgroundImage: "" };
      }

      const dataToParse = decorate.draft_data || decorate.data;
      if (!dataToParse) {
        return {
          decorate_id: decorate.decorate_id,
          module_list: [],
          backgroundImage: "",
        };
      }

      try {
        const parsed = JSON.parse(dataToParse);
        return parsed;
      } catch (e) {
        this.logger.warn("PC 预览装修数据解析失败", e);
        return {
          decorate_id: decorate.decorate_id,
          module_list: [],
          backgroundImage: "",
        };
      }
    } catch (error) {
      this.logger.error("获取 PC 预览装修失败", error);
      return { decorate_id: previewId, module_list: [], backgroundImage: "" };
    }
  }

  private async getDecorate(type: number, decorateId: number) {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: { decorate_id: decorateId, decorate_type: type, status: true },
      });
      if (!decorate) {
        return {
          decorate_id: decorateId,
          module_list: [],
          page_module: type === 1 ? this.getMockPageModule() : null,
          backgroundImage: "",
        };
      }

      if (!decorate.data) {
        return {
          decorate_id: decorate.decorate_id,
          module_list: [],
          page_module: type === 1 ? this.getMockPageModule() : null,
          backgroundImage: "",
        };
      }

      try {
        const parsed = JSON.parse(decorate.data);
        return parsed;
      } catch (e) {
        this.logger.warn("装修数据解析失败", e);
        return {
          decorate_id: decorate.decorate_id,
          module_list: [],
          page_module: type === 1 ? this.getMockPageModule() : null,
          backgroundImage: "",
        };
      }
    } catch (error) {
      this.logger.error("获取装修失败", error);
      return {
        decorate_id: decorateId,
        module_list: [],
        page_module: type === 1 ? this.getMockPageModule() : null,
        backgroundImage: "",
      };
    }
  }

  private async getAppHomeDecorate() {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: { decorate_type: 1, is_home: 1, status: true, shop_id: 0 },
        orderBy: [{ update_time: "desc" }, { decorate_id: "desc" }],
      });

      if (!decorate) throw new Error("模板不存在");
      if (!decorate.data)
        return {
          decorateId: decorate.decorate_id,
          moduleList: [],
          pageModule: {},
        };

      try {
        const parsed = JSON.parse(decorate.data);
        return this.normalizeDecorateData(parsed, decorate.decorate_id);
      } catch (e) {
        this.logger.warn("首页装修数据解析失败", e);
        throw e;
      }
    } catch (error) {
      this.logger.error("获取默认首页失败", error);
      throw error;
    }
  }

  private async getPcHomeDecorate() {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: { decorate_type: 2, is_home: 1, status: true, shop_id: 0 },
        orderBy: [{ update_time: "desc" }, { decorate_id: "desc" }],
      });

      if (!decorate) {
        this.logger.warn("PC 首页装修模板不存在，返回空结构");
        return { decorate_id: 0, module_list: [], backgroundImage: "" };
      }
      if (!decorate.data)
        return {
          decorate_id: decorate.decorate_id,
          module_list: [],
          backgroundImage: "",
        };

      try {
        const parsed = JSON.parse(decorate.data);
        return parsed;
      } catch (e) {
        this.logger.warn("PC 首页装修数据解析失败", e);
        throw e;
      }
    } catch (error) {
      this.logger.error("获取 PC 默认首页失败", error);
      throw error;
    }
  }

  // -------- 今日推荐（模块数据） --------
  async getRecommend(query: {
    decorate_id?: number;
    module_index?: string;
    page?: number;
    preview_id?: number;
    decorateId?: number;
    moduleIndex?: string;
    previewId?: number;
  }) {
    const decorateId = Number(query.decorateId ?? query.decorate_id ?? 0) || 0;
    const moduleIndex = String(query.moduleIndex ?? query.module_index ?? "");
    const page = Number(query.page ?? 1) || 1;
    const previewId = Number(query.previewId ?? query.preview_id ?? 0) || 0;

    if (previewId > 0) {
      return this.getPreviewDecorateModuleData(decorateId, moduleIndex, {
        page,
        size: 10,
      });
    }
    return this.getDecorateModuleData(decorateId, moduleIndex, {
      page,
      size: 10,
    });
  }

  private async getPreviewDecorateModuleData(
    decorateId: number,
    moduleIndex: string,
    pagination: { page: number; size: number },
  ) {
    // TODO: 装修模块引擎尚未迁移，这里使用真实商品数据作为推荐占位
    const { page, size } = pagination;
    const skip = (page - 1) * size;
    const where: any = { product_status: 1, is_delete: 0 };
    const [list, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [
          { is_hot: "desc" },
          { sort_order: "asc" },
          { product_id: "desc" },
        ],
        skip,
        take: size,
        select: {
          product_id: true,
          product_name: true,
          pic_thumb: true,
          product_price: true,
          market_price: true,
          virtual_sales: true,
          product_stock: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    const data = list.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      product_image: p.pic_thumb,
      product_price: this.formatAmount(Number(p.product_price)),
      market_price: this.formatAmount(Number(p.market_price)),
      sales_count: p.virtual_sales ?? 0,
      product_stock: p.product_stock,
    }));
    return {
      module_name: "推荐商品",
      module_type: "product",
      data,
      pagination: { current: page, size, total },
    };
  }

  private async getDecorateModuleData(
    decorateId: number,
    moduleIndex: string,
    pagination: { page: number; size: number },
  ) {
    // 同 getPreviewDecorateModuleData，占位真实商品列表
    return this.getPreviewDecorateModuleData(
      decorateId,
      moduleIndex,
      pagination,
    );
  }

  // -------- 秒杀 --------
  async getSeckill(query: { page?: number; un_started?: number }) {
    const page = Number(query.page ?? 1) || 1;
    const size = 15;
    const unStarted = Number(query.un_started ?? 0) === 1;
    const now = Math.floor(Date.now() / 1000);
    const skip = (page - 1) * size;

    // 查询活动
    const seckillWhere: any = unStarted
      ? { seckill_start_time: { gt: now } }
      : { seckill_start_time: { lt: now }, seckill_end_time: { gt: now } };

    const seckills = await this.prisma.seckill.findMany({
      where: seckillWhere,
      orderBy: [{ seckill_start_time: "asc" }],
      skip,
      take: size,
      select: {
        seckill_id: true,
        seckill_name: true,
        seckill_start_time: true,
        seckill_end_time: true,
        seckill_limit_num: true,
        product_id: true,
      },
    });

    if (!seckills.length) return { records: [], total: 0 };

    const productIds = seckills.map((s) => s.product_id!).filter(Boolean);
    const items = await this.prisma.seckill_item.findMany({
      where: { product_id: { in: productIds } },
      select: {
        product_id: true,
        sku_id: true,
        seckill_price: true,
        seckill_stock: true,
        seckill_sales: true,
        seckill_start_time: true,
        seckill_end_time: true,
      },
      orderBy: [{ seckill_price: "asc" }],
    });
    const productMap: Record<number, any> = {};
    for (const it of items) {
      if (!it.product_id) continue;
      if (!productMap[it.product_id]) {
        productMap[it.product_id] = {
          items: [],
          totalStock: 0,
          totalSales: 0,
          firstSku: it,
        };
      }
      productMap[it.product_id].items.push(it);
      productMap[it.product_id].totalStock += it.seckill_stock ?? 0;
      productMap[it.product_id].totalSales += it.seckill_sales ?? 0;
    }

    const products = await this.prisma.product.findMany({
      where: {
        product_id: { in: productIds },
        is_delete: 0,
        product_status: 1,
      },
      select: {
        product_id: true,
        product_name: true,
        pic_thumb: true,
        product_price: true,
        market_price: true,
        product_stock: true,
        virtual_sales: true,
      },
    });

    const records = products.map((p) => {
      const agg = productMap[p.product_id] || {
        totalStock: 0,
        totalSales: 0,
        firstSku: {},
      };
      const firstSku = agg.firstSku;
      return {
        product_id: p.product_id,
        product_name: p.product_name,
        product_image: p.pic_thumb,
        market_price: this.formatAmount(
          Number(firstSku?.seckill_price ?? p.market_price),
        ),
        product_price: this.formatAmount(Number(p.product_price)),
        seckill_limit_num:
          seckills.find((s) => s.product_id === p.product_id)
            ?.seckill_limit_num || 0,
        seckill_sales: agg.totalSales,
        seckill_stock: agg.totalStock,
        sku_id: firstSku?.sku_id || 0,
        seckill_start_time:
          firstSku?.seckill_start_time ||
          seckills.find((s) => s.product_id === p.product_id)
            ?.seckill_start_time,
        seckill_end_time:
          firstSku?.seckill_end_time ||
          seckills.find((s) => s.product_id === p.product_id)?.seckill_end_time,
      };
    });

    return { records, total: records.length };
  }

  // -------- 优惠券 --------
  async getCoupon(query: { shop_id?: number; shopId?: number }) {
    const now = Math.floor(Date.now() / 1000);
    const shopId = query.shopId ?? query.shop_id;

    const where: any = {
      is_show: 1,
      is_delete: false,
      send_start_date: { lte: now },
      send_end_date: { gte: now },
      use_start_date: { lte: now },
      use_end_date: { gte: now },
    };
    if (typeof shopId === "number" && shopId > -1) where.shop_id = shopId;

    const list = await this.prisma.coupon.findMany({
      where,
      orderBy: [{ add_time: "desc" }],
      take: 5,
    });
    return list.map((c) => ({
      ...c,
      coupon_money: this.formatAmount(Number(c.coupon_money || 0)),
      coupon_discount: this.formatAmount(Number(c.coupon_discount || 0)),
    }));
  }

  // -------- 分类栏 --------
  async getMobileCatNav() {
    const list = await this.prisma.mobile_cat_nav.findMany({
      where: { is_show: 1 },
      orderBy: [{ mobile_cat_nav_id: "desc" }],
    });
    return list;
  }

  // -------- 移动端导航 --------
  async getMobileNav(decorateSn: string) {
    try {
      const item = await this.prisma.decorate_discrete.findFirst({
        where: { decorate_sn: decorateSn },
      });
      if (!item) return null;

      let data = item.data as any;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          this.logger.warn("移动端导航 data 解析失败", e);
        }
      }

      return { ...item, data };
    } catch (e) {
      this.logger.error("获取移动端导航失败", e);
      return null;
    }
  }

  // -------- 个人中心 --------
  async getMemberDecorate(decorateSn: string) {
    try {
      const item = await this.prisma.decorate_discrete.findFirst({
        where: { decorate_sn: decorateSn },
      });
      if (!item) return {};

      let data = item.data as any;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          this.logger.warn("个人中心 data 解析失败", e);
        }
      }

      return { ...item, data };
    } catch (e) {
      this.logger.error("获取个人中心装修失败", e);
      return {};
    }
  }

  // -------- 客服设置 --------
  async getCustomerServiceConfig() {
    // 对齐 PHP: 走 config 表 (biz_code) 读取；ENV 仅兜底
    const codes = [
      "kefuType",
      "kefuYzfType",
      "kefuYzfSign",
      "corpId",
      "kefuWorkwxId",
      "kefuCode",
      "h5Domain",
    ];
    const rows = await this.prisma.config.findMany({
      where: { biz_code: { in: codes }, OR: [{ is_del: 0 }, { is_del: null }] },
      select: { biz_code: true, biz_val: true },
    });
    const cfg: Record<string, string> = {};
    for (const r of rows) {
      if (r.biz_code) cfg[r.biz_code] = r.biz_val ?? "";
    }
    const get = (k: string, envFallback?: string, def: any = ""): string => {
      return (cfg[k] ?? envFallback ?? def) as string;
    };
    const num = (v: any, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const serviceType = num(get("kefuType", process.env.KEFU_TYPE, 0));
    let openType = num(get("kefuYzfType", process.env.KEFU_YZF_TYPE, 0));
    const yzfSign = get("kefuYzfSign", process.env.KEFU_YZF_SIGN, "");
    const corpId = get("corpId", process.env.CORP_ID, "");
    const workwxId = get("kefuWorkwxId", process.env.KEFU_WORKWX_ID, "");
    const kefuCode = get("kefuCode", process.env.KEFU_CODE, "");
    const h5Domain = get("h5Domain", process.env.H5_DOMAIN, "");

    let url = "";
    switch (serviceType) {
      case 0:
        break;
      case 1: // 易支付/yzf
        url = `${process.env.YZF_URL ?? "https://yzf.qq.com/"}${yzfSign}`;
        break;
      case 2: // 企业微信
        url = `${process.env.WORKWX_URL ?? "https://work.weixin.qq.com/kfid/"}${workwxId}`;
        openType = 0; // PHP 逻辑：企业微信强制 open_type=0
        break;
      case 3: // 自定义代码/链接
        url = kefuCode;
        break;
      case 4: // 关闭 / 预留
        url = "";
        break;
      default:
        url = "";
    }

    return {
      // camelCase 主输出
      h5Domain,
      corpId,
      url,
      openType,
      serviceType,
      show: serviceType > 0 ? 1 : 0,
      // snake_case 兼容（前端完成迁移后可移除）
      h5_domain: h5Domain,
      corp_id: corpId,
      open_type: openType,
      service_type: serviceType,
    };
  }

  // -------- 友情链接 --------
  async getFriendLinks() {
    return this.prisma.friend_links.findMany({
      orderBy: [{ sort_order: "desc" }],
      take: 20,
    });
  }

  // ========== 工具 ==========
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  // 预留：模块格式化（尚未移植 PHP modules 下各 Service）
  private formatModule(
    type: string,
    module: any,
    params?: any,
    decorate?: any,
  ) {
    return module;
  }

  private normalizeDecorateData(input: any, fallbackDecorateId?: number) {
    if (!input || typeof input !== "object") {
      return {
        decorateId: fallbackDecorateId ?? 0,
        moduleList: [],
        pageModule: {},
      };
    }
    const alreadyCamel = "decorateId" in input || "moduleList" in input;
    if (alreadyCamel) {
      return {
        decorateId: input.decorateId ?? fallbackDecorateId ?? 0,
        moduleList: input.moduleList ?? [],
        pageModule: input.pageModule ?? {},
      };
    }
    return {
      decorateId: input.decorate_id ?? fallbackDecorateId ?? 0,
      moduleList: input.module_list ?? [],
      pageModule: input.page_module ?? {},
    };
  }

  // 旧 mock 函数已移除
}
