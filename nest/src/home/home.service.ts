import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

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
    // 模拟获取预览装修数据
    return {
      decorate_id: previewId,
      module_list: this.getMockModuleList(),
      page_module: this.getMockPageModule(),
    };
  }

  /**
   * 获取PC预览装修数据
   */
  private async getPcPreviewDecorate(previewId: number) {
    // 模拟获取PC预览装修数据
    return {
      decorate_id: previewId,
      module_list: this.getMockModuleList(),
    };
  }

  /**
   * 获取装修数据
   */
  private async getDecorate(type: number, decorateId: number) {
    // 模拟获取装修数据
    return {
      decorate_id: decorateId,
      module_list: this.getMockModuleList(),
      page_module: type === 1 ? this.getMockPageModule() : null,
    };
  }

  /**
   * 获取应用默认首页
   */
  private async getAppHomeDecorate() {
    // 模拟获取默认首页
    return {
      decorate_id: 1,
      module_list: this.getMockModuleList(),
      page_module: this.getMockPageModule(),
    };
  }

  /**
   * 获取PC默认首页
   */
  private async getPcHomeDecorate() {
    // 模拟获取PC默认首页
    return {
      decorate_id: 2,
      module_list: this.getMockModuleList(),
    };
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
      return this.getPreviewDecorateModuleData(decorate_id, module_index, { page, size: 10 });
    } else {
      return this.getDecorateModuleData(decorate_id, module_index, { page, size: 10 });
    }
  }

  /**
   * 获取预览装修模块数据
   */
  private async getPreviewDecorateModuleData(decorateId: number, moduleIndex: string, pagination: { page: number; size: number }) {
    // 模拟获取预览模块数据
    return {
      module_name: '推荐商品',
      module_type: 'product',
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
  private async getDecorateModuleData(decorateId: number, moduleIndex: string, pagination: { page: number; size: number }) {
    // 模拟获取模块数据
    return {
      module_name: '推荐商品',
      module_type: 'product',
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

    const where: any = {
      is_show: 1,
      is_delete: 0,
      valid_date: 1,
      receive_date: 1,
    };

    if (shop_id > -1) {
      where.shop_id = shop_id;
    }

    const coupons = await this.prisma.coupon.findMany({
      where,
      orderBy: [
        { add_time: 'desc' },
      ],
      take: 5,
    });

    // 格式化金额
    return coupons.map(coupon => ({
      ...coupon,
      coupon_money: this.formatAmount(coupon.coupon_money || 0),
      coupon_discount: this.formatAmount(coupon.coupon_discount || 0),
    }));
  }

  /**
   * 获取移动端分类导航
   */
  async getMobileCatNav() {
    const navItems = await this.prisma.mobileCatNav.findMany({
      where: { is_show: 1 },
      orderBy: [
        { mobile_cat_nav_id: 'desc' },
      ],
    });

    return navItems;
  }

  /**
   * 获取移动端导航栏
   */
  async getMobileNav(decorateSn: string) {
    const item = await this.prisma.decorateDiscrete.findFirst({
      where: { decorate_sn: decorateSn },
    });

    return item || {};
  }

  /**
   * 获取个人中心装修数据
   */
  async getMemberDecorate(decorateSn: string) {
    const item = await this.prisma.decorateDiscrete.findFirst({
      where: { decorate_sn: decorateSn },
    });

    return item || {};
  }

  /**
   * 获取客服设置
   */
  async getCustomerServiceConfig() {
    // 模拟客服设置配置
    const serviceType = 1; // 默认易客服
    const openType = 1;

    let url = '';
    let corpId = '';

    switch (serviceType) {
      case 0:
        break;
      case 1:
        url = `https://yzf.qq.com/xvYW0uAK1?sign=mock_sign`;
        corpId = 'mock_corp_id';
        break;
      case 2:
        url = `https://work.weixin.qq.com/kfid/mock_id`;
        openType = 0;
        corpId = 'mock_corp_id';
        break;
      case 3:
        url = 'mock_kefu_code';
        break;
      case 4:
        url = '';
        break;
    }

    return {
      h5_domain: 'https://m.example.com',
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
    const links = await this.prisma.friendLinks.findMany({
      orderBy: [
        { sort_order: 'desc' },
      ],
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
        module_name: '轮播图',
        module_type: 'banner',
        data: [
          { image: '/images/banner1.jpg', url: '/product/1' },
          { image: '/images/banner2.jpg', url: '/product/2' },
        ],
      },
      {
        module_name: '导航菜单',
        module_type: 'nav',
        data: [
          { name: '首页', icon: 'home', url: '/' },
          { name: '分类', icon: 'category', url: '/category' },
          { name: '购物车', icon: 'cart', url: '/cart' },
          { name: '我的', icon: 'user', url: '/user' },
        ],
      },
      {
        module_name: '推荐商品',
        module_type: 'product',
        data: this.getMockProductList(1, 8),
      },
    ];
  }

  /**
   * 获取模拟页面模块
   */
  private getMockPageModule() {
    return {
      title: '首页',
      keywords: '商城,购物,商品',
      description: '欢迎访问我们的商城',
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
        start_time: new Date(Date.now() + Math.random() * 86400000).toISOString(),
        end_time: new Date(Date.now() + Math.random() * 86400000 + 86400000).toISOString(),
        stock_count: Math.floor(Math.random() * 100) + 1,
        sold_count: Math.floor(Math.random() * 50),
      });
    }

    return products;
  }
}