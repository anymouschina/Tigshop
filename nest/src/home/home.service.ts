// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {
    this.logger = new Logger(HomeService.name)
  }

  /**
   * 获取首页数据
   */
  async getHomeData(query: { preview_id?: number; decorate_id?: number }) {
    const { preview_id, decorate_id } = query;

    if (preview_id && preview_id > 0) {
      // 预览模式
      return this.getAppPreviewDecorate(preview_id);
    } else if (decorate_id && decorate_id > 0) {
      // 指定装修ID
      return this.getDecorate(1, decorate_id); // TYPE_H5 = 1
    } else {
      // 获取默认首页
      return this.getAppHomeDecorate();
    }
  }

  /**
   * 获取PC首页数据
   */
  async getPcHomeData(query: { preview_id?: number; decorate_id?: number }) {
    const { preview_id, decorate_id } = query;

    if (preview_id && preview_id > 0) {
      // 预览模式
      return this.getPcPreviewDecorate(preview_id);
    } else if (decorate_id && decorate_id > 0) {
      // 指定装修ID
      return this.getDecorate(2, decorate_id); // TYPE_PC = 2
    } else {
      // 获取默认PC首页
      return this.getPcHomeDecorate();
    }
  }

  /**
   * 获取应用预览装修数据
   */
  private async getAppPreviewDecorate(previewId: number) {
    try {
      // 查找预览装修配置，优先使用草稿数据
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          decorate_id: previewId,
          decorate_type: 1, // TYPE_H5
        },
      });

      if (!decorate) {
        // 如果没有找到装修配置，返回默认配置
        return {
          decorate_id: previewId,
          module_list: this.getMockModuleList(),
          page_module: this.getMockPageModule(),
          backgroundImage: "",
        };
      }

      // 解析装修数据，优先使用草稿数据
      let moduleList = this.getMockModuleList();
      const pageModule = this.getMockPageModule();
      const backgroundImage = "";

      try {
        const dataToParse = decorate.draft_data || decorate.data;
        if (dataToParse) {
          const parsedData = JSON.parse(dataToParse);
          return parsedData;
        }
      } catch (parseError) {
        this.logger.debug("解析预览装修数据失败:", parseError);
        moduleList = this.getMockModuleList();
      }

      return {
        decorate_id: decorate.decorate_id,
        decorate_title: decorate.decorate_title || "预览页面",
        module_list: moduleList,
        page_module: pageModule,
        backgroundImage: backgroundImage,
      };
    } catch (error) {
      this.logger.debug("获取预览装修数据失败:", error);
      // 出错时返回默认配置
      return {
        decorate_id: previewId,
        module_list: this.getMockModuleList(),
        page_module: this.getMockPageModule(),
        backgroundImage: "",
      };
    }
  }

  /**
   * 获取PC预览装修数据
   */
  private async getPcPreviewDecorate(previewId: number) {
    try {
      // 查找PC预览装修配置，优先使用草稿数据
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          decorate_id: previewId,
          decorate_type: 2, // TYPE_PC
        },
      });

      if (!decorate) {
        // 如果没有找到装修配置，返回默认配置
        return {
          decorate_id: previewId,
          module_list: this.getMockModuleList(),
          backgroundImage: "",
        };
      }

      // 解析装修数据，优先使用草稿数据
      let moduleList = this.getMockModuleList();
      let backgroundImage = "";

      try {
        const dataToParse = decorate.draft_data || decorate.data;
        if (dataToParse) {
          const parsedData = JSON.parse(dataToParse);
          moduleList = parsedData.module_list || this.getMockModuleList();
          backgroundImage = parsedData.backgroundImage || "";
        }
      } catch (parseError) {
        this.logger.debug("解析PC预览装修数据失败:", parseError);
        moduleList = this.getMockModuleList();
      }

      return {
        decorate_id: decorate.decorate_id,
        decorate_title: decorate.decorate_title || "PC预览页面",
        module_list: moduleList,
        backgroundImage: backgroundImage,
      };
    } catch (error) {
      this.logger.debug("获取PC预览装修数据失败:", error);
      // 出错时返回默认配置
      return {
        decorate_id: previewId,
        module_list: this.getMockModuleList(),
        backgroundImage: "",
      };
    }
  }

  /**
   * 获取装修数据
   */
  private async getDecorate(type: number, decorateId: number) {
    try {
      // 查找指定的装修配置
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          decorate_id: decorateId,
          decorate_type: type,
          status: true,
        },
      });

      if (!decorate) {
        // 如果没有找到装修配置，返回默认配置
        return {
          decorate_id: decorateId,
          module_list: this.getMockModuleList(),
          page_module: type === 1 ? this.getMockPageModule() : null,
          backgroundImage: "",
        };
      }

      // 解析装修数据
      let moduleList = this.getMockModuleList();
      const pageModule = type === 1 ? this.getMockPageModule() : null;
      const backgroundImage = "";

      try {
        if (decorate.data) {
          const parsedData = JSON.parse(decorate.data);
          return parsedData;
        }
      } catch (parseError) {
        this.logger.debug("解析装修数据失败:", parseError);
        moduleList = this.getMockModuleList();
      }

      return {
        decorate_id: decorate.decorate_id,
        decorate_title: decorate.decorate_title || "装修页面",
        module_list: moduleList,
        page_module: pageModule,
        backgroundImage: backgroundImage,
      };
    } catch (error) {
      this.logger.debug("获取装修数据失败:", error);
      // 出错时返回默认配置
      return {
        decorate_id: decorateId,
        module_list: this.getMockModuleList(),
        page_module: type === 1 ? this.getMockPageModule() : null,
        backgroundImage: "",
      };
    }
  }

  /**
   * 获取应用默认首页
   */
  private async getAppHomeDecorate() {
    try {
      // 查找启用的首页装修配置 (decorate_type = 1 for H5, is_home = 1 for homepage)
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          decorate_type: 1, // TYPE_H5
          is_home: 1, // 首页
          status: true, // 启用状态
          shop_id: 0, // 默认店铺
        },
        orderBy: [{ update_time: "desc" }, { decorate_id: "desc" }],
      });

      if (!decorate) {
        // 如果没有找到装修配置，返回默认配置
        return {
          decorate_id: 1,
          module_list: this.getMockModuleList(),
          page_module: this.getMockPageModule(),
          backgroundImage: "/images/default-background.jpg",
        };
      }

      // 解析装修数据
      let moduleList = [];
      const pageModule = this.getMockPageModule();
      const backgroundImage = "";

      try {
        if (decorate.data) {
          this.logger.debug("Raw decorate.data:", decorate.data);
          const parsedData = JSON.parse(decorate.data);
          return parsedData;
        }
      } catch (parseError) {
        this.logger.debug("解析装修数据失败:", parseError);
        this.logger.debug("Raw data that failed to parse:", decorate.data);
        moduleList = this.getMockModuleList();
      }

      return {
        decorate_id: decorate.decorate_id,
        decorate_title: decorate.decorate_title || "首页",
        module_list: moduleList,
        page_module: pageModule,
        backgroundImage: backgroundImage || "/images/default-background.jpg",
      };
    } catch (error) {
      this.logger.debug("获取首页装修数据失败:", error);
      // 出错时返回默认配置
      return {
        decorate_id: 1,
        module_list: this.getMockModuleList(),
        page_module: this.getMockPageModule(),
        backgroundImage: "/images/default-background.jpg",
      };
    }
  }

  /**
   * 获取PC默认首页
   */
  private async getPcHomeDecorate() {
    try {
      // 查找启用的PC首页装修配置 (decorate_type = 2 for PC, is_home = 1 for homepage)
      const decorate = await this.prisma.decorate.findFirst({
        where: {
          decorate_type: 2, // TYPE_PC
          is_home: 1, // 首页
          status: true, // 启用状态
          shop_id: 0, // 默认店铺
        },
        orderBy: [{ update_time: "desc" }, { decorate_id: "desc" }],
      });

      if (!decorate) {
        // 如果没有找到装修配置，返回默认配置
        return {
          decorate_id: 2,
          module_list: this.getMockModuleList(),
          backgroundImage: "",
        };
      }

      // 解析装修数据
      let moduleList = this.getMockModuleList();
      let backgroundImage = "";

      try {
        if (decorate.data) {
          const parsedData = JSON.parse(decorate.data);
          moduleList = parsedData.module_list || this.getMockModuleList();
          backgroundImage = parsedData.backgroundImage || "";
        }
      } catch (parseError) {
        this.logger.debug("解析PC装修数据失败:", parseError);
        moduleList = this.getMockModuleList();
      }

      return {
        decorate_id: decorate.decorate_id,
        decorate_title: decorate.decorate_title || "PC首页",
        module_list: moduleList,
        backgroundImage: backgroundImage,
      };
    } catch (error) {
      this.logger.debug("获取PC首页装修数据失败:", error);
      // 出错时返回默认配置
      return {
        decorate_id: 2,
        module_list: this.getMockModuleList(),
        backgroundImage: "",
      };
    }
  }

  /**
   * 获取首页推荐
   */
  async getRecommend(query: {
    decorate_id?: number;
    module_index?: string;
    page?: number;
    preview_id?: number;
  }) {
    const { decorate_id = 0, module_index, page = 1, preview_id = 0 } = query;

    if (preview_id > 0) {
      return this.getPreviewDecorateModuleData(decorate_id, module_index, {
        page,
        size: 10,
      });
    } else {
      return this.getDecorateModuleData(decorate_id, module_index, {
        page,
        size: 10,
      });
    }
  }

  /**
   * 获取预览装修模块数据
   */
  private async getPreviewDecorateModuleData(
    decorateId: number,
    moduleIndex: string,
    pagination: { page: number; size: number },
  ) {
    // 模拟获取预览模块数据
    return {
      module_name: "推荐商品",
      module_type: "product",
      data: this.getMockProductList(pagination.page, pagination.size),
      pagination: {
        current: pagination.page,
        size: pagination.size,
        total: 100,
      },
    };
  }

  /**
   * 获取装修模块数据
   */
  private async getDecorateModuleData(
    decorateId: number,
    moduleIndex: string,
    pagination: { page: number; size: number },
  ) {
    // 模拟获取模块数据
    return {
      module_name: "推荐商品",
      module_type: "product",
      data: this.getMockProductList(pagination.page, pagination.size),
      pagination: {
        current: pagination.page,
        size: pagination.size,
        total: 100,
      },
    };
  }

  /**
   * 获取首页秒杀
   */
  async getSeckill(query: { page?: number; un_started?: number }) {
    const { page = 1, un_started = 0 } = query;

    // 模拟获取秒杀商品
    const seckillProducts = this.getMockSeckillList(page, 15);

    return {
      records: seckillProducts,
      total: 50,
    };
  }

  /**
   * 获取首页优惠券
   */
  async getCoupon(query: { shop_id?: number }) {
    const { shop_id = -1 } = query;
    const now = Math.floor(Date.now() / 1000);

    const where: any = {
      is_show: 1,
      is_delete: false,
      send_start_date: { lte: now },
      send_end_date: { gte: now },
      use_start_date: { lte: now },
      use_end_date: { gte: now },
    };

    if (shop_id > -1) {
      where.shop_id = shop_id;
    }

    const coupons = await this.prisma.coupon.findMany({
      where,
      orderBy: [{ add_time: "desc" }],
      take: 5,
    });

    // 格式化金额
    return coupons.map((coupon) => ({
      ...coupon,
      coupon_money: this.formatAmount(Number(coupon.coupon_money || 0)),
      coupon_discount: this.formatAmount(Number(coupon.coupon_discount || 0)),
    }));
  }

  /**
   * 获取移动端分类导航
   */
  async getMobileCatNav() {
    const navItems = await this.prisma.mobile_cat_nav.findMany({
      where: { is_show: 1 },
      orderBy: [{ mobile_cat_nav_id: "desc" }],
    });

    return navItems;
  }

  /**
   * 获取移动端导航栏
   */
  async getMobileNav(decorateSn: string) {
    try {
      const item = await this.prisma.decorate_discrete.findFirst({
        where: { decorate_sn: decorateSn },
      });
      if (item) {
        const parsedData = JSON.parse(item.data || "[]");
        return {
          ...item,
          data: parsedData,
        };
      }

      // 返回默认导航数据 - 使用PHP版本期望的字段结构
      const defaultNavList = [
        {
          picId: 1,
          picName: "首页",
          picTitle: "首页",
          picThumb: "/images/nav/home.png",
          picActiveThumb: "/images/nav/home-active.png",
          picLink: "/pages/index/index",
          sort: 1,
        },
        {
          picId: 2,
          picName: "分类",
          picTitle: "分类",
          picThumb: "/images/nav/category.png",
          picActiveThumb: "/images/nav/category-active.png",
          picLink: "/pages/category/index",
          sort: 2,
        },
        {
          picId: 3,
          picName: "购物车",
          picTitle: "购物车",
          picThumb: "/images/nav/cart.png",
          picActiveThumb: "/images/nav/cart-active.png",
          picLink: "/pages/cart/index",
          sort: 3,
        },
        {
          picId: 4,
          picName: "我的",
          picTitle: "我的",
          picThumb: "/images/nav/user.png",
          picActiveThumb: "/images/nav/user-active.png",
          picLink: "/pages/user/index",
          sort: 4,
        },
      ];

      return {
        id: 1,
        decorate_sn: decorateSn,
        decorate_name: "移动端导航",
        data: {
          data: {
            navList: defaultNavList,
          },
        },
        navList: defaultNavList,
        shop_id: 0,
      };
    } catch (error) {
      this.logger.debug("Error fetching mobile nav:", error);
      // 返回默认导航数据 - 使用PHP版本期望的字段结构
      const defaultNavList = [
        {
          picId: 1,
          picName: "首页",
          picTitle: "首页",
          picThumb: "/images/nav/home.png",
          picActiveThumb: "/images/nav/home-active.png",
          picLink: "/pages/index/index",
          sort: 1,
        },
        {
          picId: 2,
          picName: "分类",
          picTitle: "分类",
          picThumb: "/images/nav/category.png",
          picActiveThumb: "/images/nav/category-active.png",
          picLink: "/pages/category/index",
          sort: 2,
        },
        {
          picId: 3,
          picName: "购物车",
          picTitle: "购物车",
          picThumb: "/images/nav/cart.png",
          picActiveThumb: "/images/nav/cart-active.png",
          picLink: "/pages/cart/index",
          sort: 3,
        },
        {
          picId: 4,
          picName: "我的",
          picTitle: "我的",
          picThumb: "/images/nav/user.png",
          picActiveThumb: "/images/nav/user-active.png",
          picLink: "/pages/user/index",
          sort: 4,
        },
      ];

      return {
        id: 1,
        decorate_sn: decorateSn,
        decorate_name: "移动端导航",
        data: defaultNavList,
        navList: defaultNavList,
        shop_id: 0,
      };
    }
  }

  /**
   * 获取个人中心装修数据
   */
  async getMemberDecorate(decorateSn: string) {
    try {
      const item = await this.prisma.decorate_discrete.findFirst({
        where: { decorate_sn: decorateSn },
      });

      return item || {};
    } catch (error) {
      this.logger.debug("Error fetching member decorate:", error);
      // 返回默认个人中心数据
      return {
        id: 2,
        decorate_sn: decorateSn,
        decorate_name: "个人中心装修",
        data: JSON.stringify({
          user_info: { nickname: "用户", avatar: "/images/default-avatar.png" },
          menu_items: [
            { name: "我的订单", icon: "order", url: "/user/orders" },
            { name: "收货地址", icon: "address", url: "/user/address" },
            { name: "优惠券", icon: "coupon", url: "/user/coupons" },
            { name: "设置", icon: "settings", url: "/user/settings" },
          ],
        }),
        shop_id: 0,
      };
    }
  }

  /**
   * 获取客服设置
   */
  async getCustomerServiceConfig() {
    // 模拟客服设置配置
    const serviceType = 1; // 默认易客服
    const openType = 1;

    let url = "";
    let corpId = "";

    switch (serviceType) {
      case 0:
        break;
      case 1:
        url = `https://yzf.qq.com/xvYW0uAK1?sign=mock_sign`;
        corpId = "mock_corp_id";
        break;
      case 2:
        url = `https://work.weixin.qq.com/kfid/mock_id`;
        openType = 0;
        corpId = "mock_corp_id";
        break;
      case 3:
        url = "mock_kefu_code";
        break;
      case 4:
        url = "";
        break;
    }

    return {
      h5_domain: "https://m.example.com",
      corp_id: corpId,
      url,
      open_type: openType,
      service_type: serviceType,
      show: serviceType > 0 ? 1 : 0,
    };
  }

  /**
   * 获取友情链接
   */
  async getFriendLinks() {
    const links = await this.prisma.friend_links.findMany({
      orderBy: [{ sort_order: "desc" }],
      take: 20,
    });

    return links;
  }

  /**
   * 格式化金额
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * 获取模拟模块列表
   */
  private getMockModuleList() {
    return [
      {
        module_name: "轮播图",
        module_type: "banner",
        data: [
          { image: "/images/banner1.jpg", url: "/product/1" },
          { image: "/images/banner2.jpg", url: "/product/2" },
        ],
      },
      {
        module_name: "导航菜单",
        module_type: "nav",
        data: [
          { name: "首页", icon: "home", url: "/" },
          { name: "分类", icon: "category", url: "/category" },
          { name: "购物车", icon: "cart", url: "/cart" },
          { name: "我的", icon: "user", url: "/user" },
        ],
      },
      {
        module_name: "推荐商品",
        module_type: "product",
        data: this.getMockProductList(1, 8),
      },
    ];
  }

  /**
   * 获取模拟页面模块
   */
  private getMockPageModule() {
    return {
      title: "首页",
      keywords: "商城,购物,商品",
      description: "欢迎访问我们的商城",
    };
  }

  /**
   * 获取模拟商品列表
   */
  private getMockProductList(page: number, size: number) {
    const start = (page - 1) * size;
    const products = [];

    for (let i = 0; i < size; i++) {
      products.push({
        product_id: start + i + 1,
        product_name: `商品${start + i + 1}`,
        product_image: `/images/product${start + i + 1}.jpg`,
        product_price: (Math.random() * 1000 + 10).toFixed(2),
        market_price: (Math.random() * 1200 + 20).toFixed(2),
        sales_count: Math.floor(Math.random() * 1000),
      });
    }

    return products;
  }

  /**
   * 获取模拟秒杀列表
   */
  private getMockSeckillList(page: number, size: number) {
    const start = (page - 1) * size;
    const products = [];

    for (let i = 0; i < size; i++) {
      products.push({
        seckill_id: start + i + 1,
        product_id: start + i + 1,
        product_name: `秒杀商品${start + i + 1}`,
        product_image: `/images/seckill${start + i + 1}.jpg`,
        seckill_price: (Math.random() * 100 + 1).toFixed(2),
        original_price: (Math.random() * 200 + 50).toFixed(2),
        start_time: new Date(
          Date.now() + Math.random() * 86400000,
        ).toISOString(),
        end_time: new Date(
          Date.now() + Math.random() * 86400000 + 86400000,
        ).toISOString(),
        stock_count: Math.floor(Math.random() * 100) + 1,
        sold_count: Math.floor(Math.random() * 50),
      });
    }

    return products;
  }
}
