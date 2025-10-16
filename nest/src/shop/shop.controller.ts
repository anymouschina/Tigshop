// @ts-nocheck
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';

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
  async getDetail(@Query('shopId') shopIdRaw: any) {
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

  // 收藏量与是否已收藏（当前 schema 未找到收藏店铺表，置 null/false）
  const collectCount = null;
  const collectShop = false;

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
    return { code: 0, message: 'success', data: { shopId, decorateType, modules } };
  }
}
