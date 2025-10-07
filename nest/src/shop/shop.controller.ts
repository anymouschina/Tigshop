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
        last_login_time: true,
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

    // 统计收藏量（若表存在）
    // 收藏数量：当前 schema 未定义 collect_shop 模型，这里置 0（后续若加表可填充）
    const collectCount = 0;

    const baseProductSelect = {
      product_id: true,
      product_name: true,
      product_price: true,
      pic_thumb: true,
      pic_url: true,
      product_sn: true,
    };

    const whereOnSale = { shop_id: shopId, product_status: 1, is_delete: 0 } as any;

    const [hotList, newList, bestList, listingList, listingCount] = await Promise.all([
      this.prisma.product.findMany({ where: { ...whereOnSale, is_hot: 1 }, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.findMany({ where: { ...whereOnSale, is_new: 1 }, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.findMany({ where: { ...whereOnSale, is_best: 1 }, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.findMany({ where: whereOnSale, select: baseProductSelect, orderBy: { product_id: 'desc' }, take: 5 }),
      this.prisma.product.count({ where: whereOnSale }),
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
    };

    return { code: 0, message: 'success', data };
  }
}
