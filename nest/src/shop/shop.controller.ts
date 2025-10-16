// @ts-nocheck
import { Controller, Get, Query, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnyJwtAuthGuard } from 'src/auth/guards/any-jwt-auth.guard';

// 与 PHP 路径对齐：GET /api/shop/shop/detail?shopId=xx
@ApiTags('Shop Public')
@Controller('api/shop/shop')
export class ShopController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 店铺详情（用户端）- 对齐 PHP: shop/shop/detail
   * 返回字段力求覆盖前端常用：shopId, shopTitle, shopLogo, status/statusText, collectCount, hotProduct(5), listingProduct(5), listingCount, newProduct(5), bestProduct(5)
   */
  @Get('detail')
  @ApiOperation({ summary: '获取店铺详情（对齐 PHP shop/shop/detail）' })
  async getDetail(@Query('shopId') shopIdRaw: any, @Req() req: any) {
    const shopId = Number(shopIdRaw);
    if (!Number.isFinite(shopId) || shopId <= 0) {
      return { code: 400, message: '参数 shopId 无效', data: null };
    }

    const shop = await this.prisma.shop.findUnique({
      where: { shop_id: shopId },
      select: {
        shop_id: true,
        shop_title: true,
        shop_logo: true,
        status: true,
        add_time: true,
        kefu_inlet: true,
        merchant_id: true,
        click_count: true,
        shop_money: true,
        frozen_money: true,
        contact_mobile: true,
        description: true,
        kefu_phone: true,
        kefu_weixin: true,
        kefu_link: true,
        is_contact_kefu: true,
        vendor_set_price_type: true,
        vendor_set_price_auto_value: true,
        service_fee_rate: true,
        fee_rate: true,
      },
    });

    if (!shop) {
      return { code: 404, message: '店铺不存在', data: null };
    }

    // PHP 中 STATUS_LIST
    const STATUS_LIST: Record<number, string> = { 1: '开业', 4: '暂停运营', 10: '关店' };
    const statusText = STATUS_LIST[shop.status] || '';

    // 收藏量与是否已收藏
    let collectCount = 0;
    let collectShop = false;
    const userId = req?.user?.userId ? Number(req.user.userId) : 0;
    try {
      collectCount = await this.prisma.collect_shop.count({ where: { shop_id: shopId } });
      if (userId > 0) {
        const exist = await this.prisma.collect_shop.findFirst({ where: { shop_id: shopId, user_id: userId } });
        collectShop = !!exist;
      }
    } catch {}

    const baseProductSelect = {
      product_id: true,
      product_name: true,
      product_price: true,
      pic_thumb: true,
      pic_url: true,
      product_sn: true,
    };

    const whereOnSale = { shop_id: shopId, product_status: 1, is_delete: 0 } as any;

    const [hotList, newList, bestList, listingList, listingCount, productCount, newProductCount] = await Promise.all([
      this.prisma.product.findMany({ where: { ...whereOnSale, is_hot: 1 }, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.findMany({ where: { ...whereOnSale, is_new: 1 }, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.findMany({ where: { ...whereOnSale, is_best: 1 }, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.findMany({ where: whereOnSale, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.count({ where: whereOnSale }),
      this.prisma.product.count({ where: whereOnSale }),
      this.prisma.product.count({ where: { ...whereOnSale, is_new: 1 } }),
    ]);

    const toMoney = (v: any) => {
      const n = Number(v ?? 0);
      return n.toFixed(2);
    };
    const mapProduct = (p: any) => ({
      productId: p.product_id,
      productName: p.product_name,
      productPrice: toMoney(p.product_price),
      picThumb: p.pic_thumb || p.pic_url || '',
      productSn: p.product_sn || '',
    });

    // 商户信息（若存在）
    let merchantData: any = null;
    if (shop.merchant_id && shop.merchant_id > 0) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { merchant_id: shop.merchant_id },
        select: {
          merchant_id: true,
          merchant_apply_id: true,
          user_id: true,
          add_time: true,
          merchant_data: true,
          status: true,
          type: true,
          company_name: true,
          corporate_name: true,
          settlement_cycle: true,
        },
      });
      if (merchant) {
        // merchant_data JSON 解析
        let parsed: any = null;
        try { parsed = merchant.merchant_data ? JSON.parse(merchant.merchant_data) : null; } catch { parsed = null; }
        const typeText = merchant.type ? '个人认证' : '企业认证';
        merchantData = {
          typeText,
          statusText: null, // 可按状态枚举补充
          merchantId: merchant.merchant_id,
          merchantApplyId: merchant.merchant_apply_id || 0,
          userId: merchant.user_id || 0,
          addTime: merchant.add_time ? new Date(merchant.add_time * 1000).toISOString().replace('T', ' ').substring(0, 19) : '',
          merchantData: parsed || {},
          status: merchant.status || 0,
          type: merchant.type ? 1 : 0,
          companyName: merchant.company_name || '',
          corporateName: merchant.corporate_name || '',
          settlementCycle: merchant.settlement_cycle || 15,
        };
      }
    }

    const data = {
      shopId: shop.shop_id,
      shopTitle: shop.shop_title || '',
      shopLogo: shop.shop_logo || '',
      shopBanner: '',
      shopBg: '',
      status: shop.status,
      statusText,
      addTime: shop.add_time ? new Date((shop.add_time ?? 0) * 1000).toISOString().replace('T', ' ').substring(0, 19) : '',
      kefuInlet: shop.kefu_inlet || null,
      merchantId: shop.merchant_id || 0,
      collectCount,
      hotProduct: hotList.map(mapProduct),
      newProduct: newList.map(mapProduct),
      bestProduct: bestList.map(mapProduct),
      listingProduct: listingList.map(mapProduct),
      listing: listingCount,
      clickCount: shop.click_count || 0,
      shopMoney: Number(shop.shop_money || 0),
      frozenMoney: Number(shop.frozen_money || 0),
      contactMobile: shop.contact_mobile || '',
      description: shop.description || '',
      kefuPhone: shop.kefu_phone || '',
      kefuWeixin: shop.kefu_weixin || '',
      kefuLink: shop.kefu_link || '',
      isContactKefu: shop.is_contact_kefu || 0,
      collectShop,
      productCount,
      newProductCount,
      merchant: merchantData,
    };

    return { code: 0, message: 'success', data };
  }

  /**
   * 分类装修配置（用户端）- 对齐前端期望 /api/shop/shop/decorate?shopId=xx
   * PHP 逻辑：读取配置 productCategoryDecorateType 作为装修类型；未来可扩展按店铺定制。
   * 响应示例：{ code:0, message:'success', data:{ shopId, decorateType, modules:[] } }
   */
  @Get('decorate')
  @ApiOperation({ summary: '获取店铺分类装修配置（对齐 PHP decorate 接口）' })
  async getDecorate(@Query('shopId') shopIdRaw: any) {
    const shopId = Number(shopIdRaw) || 0;
    // 读取配置: biz_code = productCategoryDecorateType
    const cfg = await this.prisma.config.findFirst({ where: { biz_code: 'productCategoryDecorateType', is_del: 0 } });
    const decorateType = cfg?.biz_val ? String(cfg.biz_val) : '2'; // 默认用风格2
    // 预留 modules（可根据不同类型组装）
    const modules: any[] = [];
      const record = await this.prisma.decorate.findFirst({
        where: { shop_id: shopId },
        orderBy: { update_time: 'desc' },
        select: { decorate_id: true, data: true, draft_data: true }
      });

      // 默认空 pageModule
      const emptyPageModule = {
        type: 'page',
        module: [],
        backgroundRepeat: '',
        backgroundSize: '',
        style: 0,
        title: '',
        titleColor: '',
        headerStyle: 1,
        titleBackgroundColor: '',
        backgroundImage: { picUrl: '', picThumb: '' },
        backgroundColor: 'rgba(242, 242, 242, 1)'
      };

      let pageModule = emptyPageModule;
      let moduleList: any[] = [];
      let decorateId: number | null = null;

      const parseJson = (val: any) => {
        if (!val || typeof val !== 'string') return val || '';
        try { return JSON.parse(val); } catch { return ''; }
      };

      if (record) {
        const raw = parseJson(record.data) || parseJson(record.draft_data);
        if (raw && typeof raw === 'object') {
          // 兼容两种结构：{ pageModule, moduleList } 或直接数组
          if (raw.pageModule && raw.moduleList) {
            pageModule = { ...emptyPageModule, ...raw.pageModule };
            moduleList = Array.isArray(raw.moduleList) ? raw.moduleList : [];
          } else if (Array.isArray(raw)) {
            moduleList = raw;
          } else {
            // 尝试常见字段
            if (raw.moduleList && Array.isArray(raw.moduleList)) moduleList = raw.moduleList;
            if (raw.pageModule && typeof raw.pageModule === 'object') pageModule = { ...emptyPageModule, ...raw.pageModule };
          }
        }
        decorateId = record.decorate_id;
      }

      return { code: 0, message: 'success', data: { pageModule, moduleList, decorateId } };
  }

  /**
   * 店铺收藏 toggle 接口 - POST /api/shop/shop/collect
   * body: { shopId: number, action?: 'toggle' | 'add' | 'remove' }
   * 返回: { shopId, isCollected, collectCount }
   */
  @Post('collect')
  @UseGuards(AnyJwtAuthGuard)
  @ApiOperation({ summary: '店铺收藏/取消收藏 (toggle)' })
  async collect(@Body() body: any, @Req() req: any) {
    const shopId = Number(body?.shopId || body?.id);
    const action = (body?.action || 'toggle').toString();
    if (!Number.isFinite(shopId) || shopId <= 0) {
      return { code: 400, message: '参数 shopId 无效', data: null };
    }
    const userId = req?.user?.userId ? Number(req.user.userId) : 0;
    if (!userId) return { code: 401, message: '未登录无法收藏', data: null };
    const shop = await this.prisma.shop.findUnique({ where: { shop_id: shopId }, select: { shop_id: true } });
    if (!shop) return { code: 404, message: '店铺不存在', data: null };

    const existing = await this.prisma.collect_shop.findFirst({ where: { shop_id: shopId, user_id: userId } });
    let isCollected: boolean;
    if (action === 'add') {
      if (!existing) await this.prisma.collect_shop.create({ data: { shop_id: shopId, user_id: userId, add_time: Math.floor(Date.now()/1000) } });
      isCollected = true;
    } else if (action === 'remove') {
      if (existing) await this.prisma.collect_shop.delete({ where: { collect_id: existing.collect_id } });
      isCollected = false;
    } else { // toggle
      if (existing) {
        await this.prisma.collect_shop.delete({ where: { collect_id: existing.collect_id } });
        isCollected = false;
      } else {
        await this.prisma.collect_shop.create({ data: { shop_id: shopId, user_id: userId, add_time: Math.floor(Date.now()/1000) } });
        isCollected = true;
      }
    }
    const collectCount = await this.prisma.collect_shop.count({ where: { shop_id: shopId } });
    return { code: 0, message: 'success', data: { shopId, isCollected, collectCount } };
  }
}
