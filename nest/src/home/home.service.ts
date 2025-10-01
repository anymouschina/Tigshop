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
    let decorateId = Number(query.decorateId ?? query.decorate_id ?? 0) || 0;

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
    let previewId = Number(query.previewId ?? query.preview_id ?? 0) || 0;
    let decorateId = Number(query.decorateId ?? query.decorate_id ?? 0) || 0;

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
        return {
          decorateId: previewId,
          moduleList: [],
          pageModule: this.getMockPageModuleV2(),
        };
      }

      // 预览规则：moduleList 来自 draft_data，pageModule 来自 data（对齐 PHP）
      let draftParsed: any = null;
      let pubParsed: any = null;
      try { draftParsed = decorate.draft_data ? JSON.parse(decorate.draft_data) : null; } catch (e) {
        this.logger.warn("draft_data 解析失败", e);
      }
      try { pubParsed = decorate.data ? JSON.parse(decorate.data) : null; } catch (e) {
        this.logger.warn("data 解析失败", e);
      }

      // 兼容两种历史结构
      const moduleList = draftParsed
        ? (draftParsed.moduleList ?? draftParsed.module_list ?? [])
        : [];
      const pageModule = pubParsed
        ? (pubParsed.pageModule ?? pubParsed.page_module ?? this.getMockPageModuleV2())
        : this.getMockPageModuleV2();

      return {
        decorateId: decorate.decorate_id,
        moduleList: moduleList || [],
        pageModule: pageModule || this.getMockPageModuleV2(),
      };
    } catch (error) {
      this.logger.error("获取预览装修失败", error);
      return {
        decorateId: previewId,
        moduleList: [],
        pageModule: this.getMockPageModuleV2(),
      };
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
        return { decorate_id: decorate.decorate_id, module_list: [], backgroundImage: "" };
      }

      try {
        const parsed = JSON.parse(dataToParse);
        return parsed;
      } catch (e) {
        this.logger.warn("PC 预览装修数据解析失败", e);
        return { decorate_id: decorate.decorate_id, module_list: [], backgroundImage: "" };
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

      if (!decorate) {
        return { decorateId: 0, moduleList: [], pageModule: this.getMockPageModuleV2() };
      }

      if (!decorate.data) {
        return { decorateId: decorate.decorate_id, moduleList: [], pageModule: this.getMockPageModuleV2() };
      }

      try {
        const parsed = JSON.parse(decorate.data);
        return this.normalizeDecorateData(parsed, decorate.decorate_id);
      } catch (e) {
        this.logger.warn("首页装修数据解析失败", e);
        return { decorateId: decorate.decorate_id, moduleList: [], pageModule: this.getMockPageModuleV2() };
      }
    } catch (error) {
      this.logger.error("获取默认首页失败", error);
      return { decorateId: 0, moduleList: [], pageModule: this.getMockPageModuleV2() };
    }
  }

  private async getPcHomeDecorate() {
    try {
      const decorate = await this.prisma.decorate.findFirst({
        where: { decorate_type: 2, is_home: 1, status: true, shop_id: 0 },
        orderBy: [{ update_time: "desc" }, { decorate_id: "desc" }],
      });

      if (!decorate) return { decorate_id: 0, module_list: [], backgroundImage: "" };
      if (!decorate.data) return { decorate_id: decorate.decorate_id, module_list: [], backgroundImage: "" };

      try {
        const parsed = JSON.parse(decorate.data);
        return parsed;
      } catch (e) {
        this.logger.warn("PC 首页装修数据解析失败", e);
        return { decorate_id: decorate.decorate_id, module_list: [], backgroundImage: "" };
      }
    } catch (error) {
      this.logger.error("获取 PC 默认首页失败", error);
      return { decorate_id: 0, module_list: [], backgroundImage: "" };
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
      return this.getPreviewDecorateModuleData(decorateId, moduleIndex, { page, size: 10 });
    }
    return this.getDecorateModuleData(decorateId, moduleIndex, { page, size: 10 });
  }

  private async getPreviewDecorateModuleData(
    decorateId: number,
    moduleIndex: string,
    pagination: { page: number; size: number },
  ) {
    // 这里没有装修模块引擎，返回模拟数据
    return {
      module_name: "推荐商品",
      module_type: "product",
      data: this.getMockProductList(pagination.page, pagination.size),
      pagination: { current: pagination.page, size: pagination.size, total: 100 },
    };
  }

  private async getDecorateModuleData(
    decorateId: number,
    moduleIndex: string,
    pagination: { page: number; size: number },
  ) {
    // 同上，返回模拟数据
    return {
      module_name: "推荐商品",
      module_type: "product",
      data: this.getMockProductList(pagination.page, pagination.size),
      pagination: { current: pagination.page, size: pagination.size, total: 100 },
    };
  }

  // -------- 秒杀 --------
  async getSeckill(query: { page?: number; un_started?: number }) {
    const page = Number(query.page ?? 1) || 1;
    const size = 15;
    const records = this.getMockSeckillList(page, size);
    return { records, total: 200 };
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

    const list = await this.prisma.coupon.findMany({ where, orderBy: [{ add_time: "desc" }], take: 5 });
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
      const item = await this.prisma.decorate_discrete.findFirst({ where: { decorate_sn: decorateSn } });
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
      const item = await this.prisma.decorate_discrete.findFirst({ where: { decorate_sn: decorateSn } });
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
    // 简化实现：读取环境变量或使用默认
    const serviceType = Number(process.env.KEFU_TYPE ?? 1);
    let openType = Number(process.env.KEFU_YZF_TYPE ?? 1);
    let url = "";
    let corpId = process.env.CORP_ID ?? "";

    switch (serviceType) {
      case 1:
        url = `${process.env.YZF_URL ?? "https://yzf.qq.com/"}${process.env.KEFU_YZF_SIGN ?? "mock_sign"}`;
        break;
      case 2:
        url = `${process.env.WORKWX_URL ?? "https://work.weixin.qq.com/kfid/"}${process.env.KEFU_WORKWX_ID ?? "mock"}`;
        openType = 0;
        break;
      case 3:
        url = process.env.KEFU_CODE ?? "";
        break;
      default:
        url = "";
    }

    return {
      h5_domain: process.env.H5_DOMAIN ?? "",
      corp_id: corpId,
      url,
      open_type: openType,
      service_type: serviceType,
      show: serviceType > 0 ? 1 : 0,
    };
  }

  // -------- 友情链接 --------
  async getFriendLinks() {
    return this.prisma.friend_links.findMany({ orderBy: [{ sort_order: "desc" }], take: 20 });
  }

  // ========== 工具 ==========
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  private getMockModuleList() {
    return [];
  }

  private getMockPageModule() {
    return { title: "", keywords: "商城,购物,商品", description: "欢迎访问我们的商城" };
  }

  private getMockPageModuleV2() {
    return {
      type: "page",
      module: [],
      backgroundRepeat: "",
      backgroundSize: "",
      style: 0,
      title: "",
      titleColor: "",
      headerStyle: 1,
      titleBackgroundColor: "",
      backgroundImage: { picUrl: "", picThumb: "" },
      backgroundColor: "",
    };
  }

  private normalizeDecorateData(input: any, fallbackDecorateId?: number) {
    if (!input || typeof input !== "object") {
      return { decorateId: fallbackDecorateId ?? 0, moduleList: [], pageModule: this.getMockPageModuleV2() };
    }
    const alreadyCamel = "decorateId" in input || "moduleList" in input;
    if (alreadyCamel) {
      return {
        decorateId: input.decorateId ?? fallbackDecorateId ?? 0,
        moduleList: input.moduleList ?? [],
        pageModule: input.pageModule ?? this.getMockPageModuleV2(),
      };
    }
    return {
      decorateId: input.decorate_id ?? fallbackDecorateId ?? 0,
      moduleList: input.module_list ?? [],
      pageModule: input.page_module ?? this.getMockPageModuleV2(),
    };
  }

  private getMockProductList(page: number, size: number) {
    const start = (page - 1) * size;
    return Array.from({ length: size }).map((_, i) => ({
      product_id: start + i + 1,
      product_name: `商品${start + i + 1}`,
      product_image: `/images/product${start + i + 1}.jpg`,
      product_price: (Math.random() * 1000 + 10).toFixed(2),
      market_price: (Math.random() * 1200 + 20).toFixed(2),
      sales_count: Math.floor(Math.random() * 1000),
    }));
  }

  private getMockSeckillList(page: number, size: number) {
    const start = (page - 1) * size;
    return Array.from({ length: size }).map((_, i) => ({
      seckill_id: start + i + 1,
      product_id: start + i + 1,
      product_name: `秒杀商品${start + i + 1}`,
      product_image: `/images/seckill${start + i + 1}.jpg`,
      seckill_price: (Math.random() * 100 + 1).toFixed(2),
      original_price: (Math.random() * 200 + 50).toFixed(2),
      start_time: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      end_time: new Date(Date.now() + Math.random() * 86400000 + 86400000).toISOString(),
      stock_count: Math.floor(Math.random() * 100) + 1,
      sold_count: Math.floor(Math.random() * 50),
    }));
  }
}
