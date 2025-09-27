// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantShopService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取商户店铺列表 - 对应PHP的myShop接口
   */
  async getMyShops(adminId: number, query: any = {}) {
    const { page = 1, size = 20, sortField = 'last_login_time', sortOrder = 'desc' } = query;
    const skip = (page - 1) * size;

    // 构建排序条件
    const orderBy: any = {};
    switch (sortField) {
      case 'lastLoginTime':
        orderBy.last_login_time = sortOrder;
        break;
      case 'shopTitle':
        orderBy.shop_title = sortOrder;
        break;
      case 'addTime':
        orderBy.add_time = sortOrder;
        break;
      default:
        orderBy.last_login_time = 'desc';
    }

    // 获取店铺列表
    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where: {
          merchant_id: adminId,
          status: 1, // 只返回启用状态的店铺
        },
        skip,
        take: size,
        orderBy,
        include: {
          merchant: {
            select: {
              merchant_name: true,
              contact_person: true,
              mobile: true,
            },
          },
        },
      }),
      this.prisma.shop.count({
        where: {
          merchant_id: adminId,
          status: 1,
        },
      }),
    ]);

    // 获取商户信息
    const merchant = await this.prisma.merchant.findFirst({
      where: {
        merchant_id: adminId,
      },
      select: {
        merchant_id: true,
        merchant_name: true,
        contact_person: true,
        mobile: true,
        email: true,
        status: true,
        add_time: true,
      },
    });

    return {
      shops: shops.map(shop => ({
        shop_id: shop.shop_id,
        shop_title: shop.shop_title,
        shop_logo: shop.shop_logo,
        add_time: shop.add_time,
        last_login_time: shop.last_login_time,
        status: shop.status,
        shop_money: shop.shop_money,
        frozen_money: shop.frozen_money,
        contact_mobile: shop.contact_mobile,
        merchant_name: shop.merchant?.merchant_name || '',
      })),
      vendors: merchant ? [{
        vendor_id: merchant.merchant_id,
        vendor_name: merchant.merchant_name,
        contact_person: merchant.contact_person,
        mobile: merchant.mobile,
        status: merchant.status,
        add_time: merchant.add_time,
      }] : [],
      userinfo: merchant ? {
        id: merchant.merchant_id,
        username: merchant.merchant_name,
        email: merchant.email,
        mobile: merchant.mobile,
        status: merchant.status,
      } : null,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  /**
   * 获取店铺详情
   */
  async getShopDetail(shopId: number, adminId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        shop_id: shopId,
        merchant_id: adminId,
      },
      include: {
        merchant: {
          select: {
            merchant_name: true,
            contact_person: true,
            mobile: true,
          },
        },
      },
    });

    if (!shop) {
      throw new Error('店铺不存在或无权限访问');
    }

    return shop;
  }

  /**
   * 创建店铺
   */
  async createShop(adminId: number, shopData: any) {
    const { shopTitle, shopLogo, contactMobile, description } = shopData;

    const shop = await this.prisma.shop.create({
      data: {
        shop_title: shopTitle,
        shop_logo: shopLogo || '',
        contact_mobile: contactMobile || '',
        description: description || '',
        merchant_id: adminId,
        add_time: Math.floor(Date.now() / 1000),
        status: 1,
        last_login_time: Math.floor(Date.now() / 1000),
      },
    });

    return shop;
  }

  /**
   * 更新店铺信息
   */
  async updateShop(shopId: number, adminId: number, shopData: any) {
    const { shopTitle, shopLogo, contactMobile, description, kefuPhone, kefuWeixin } = shopData;

    const existingShop = await this.prisma.shop.findFirst({
      where: {
        shop_id: shopId,
        merchant_id: adminId,
      },
    });

    if (!existingShop) {
      throw new Error('店铺不存在或无权限访问');
    }

    const shop = await this.prisma.shop.update({
      where: {
        shop_id: shopId,
      },
      data: {
        ...(shopTitle && { shop_title: shopTitle }),
        ...(shopLogo && { shop_logo: shopLogo }),
        ...(contactMobile && { contact_mobile: contactMobile }),
        ...(description !== undefined && { description }),
        ...(kefuPhone && { kefu_phone: kefuPhone }),
        ...(kefuWeixin && { kefu_weixin: kefuWeixin }),
      },
    });

    return shop;
  }

  /**
   * 获取当前店铺详情
   */
  async getCurrentShopDetail(adminId: number) {
    // 获取商户的第一个店铺
    const shop = await this.prisma.shop.findFirst({
      where: {
        merchant_id: adminId,
        status: 1,
      },
      orderBy: {
        add_time: 'asc',
      },
    });

    if (!shop) {
      throw new Error('暂无可用店铺');
    }

    return shop;
  }

  /**
   * 获取商家设置
   */
  async getVendorSetting(adminId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        merchant_id: adminId,
        status: 1,
      },
      select: {
        vendor_set_price_type: true,
        vendor_set_price_auto_value: true,
        service_fee_rate: true,
      },
    });

    if (!shop) {
      throw new Error('暂无可用店铺');
    }

    return {
      vendor_set_price_type: shop.vendor_set_price_type,
      vendor_set_price_auto_value: shop.vendor_set_price_auto_value,
      service_fee_rate: shop.service_fee_rate,
    };
  }

  /**
   * 更新商家设置
   */
  async updateVendorSetting(adminId: number, settingData: any) {
    const { vendor_set_price_type, vendor_set_price_auto_value, service_fee_rate } = settingData;

    const shop = await this.prisma.shop.findFirst({
      where: {
        merchant_id: adminId,
        status: 1,
      },
    });

    if (!shop) {
      throw new Error('暂无可用店铺');
    }

    const updatedShop = await this.prisma.shop.update({
      where: {
        shop_id: shop.shop_id,
      },
      data: {
        ...(vendor_set_price_type !== undefined && { vendor_set_price_type }),
        ...(vendor_set_price_auto_value !== undefined && { vendor_set_price_auto_value }),
        ...(service_fee_rate !== undefined && { service_fee_rate }),
      },
    });

    return updatedShop;
  }

  /**
   * 选择店铺
   */
  async chooseShop(adminId: number, shopId: number) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        shop_id: shopId,
        merchant_id: adminId,
        status: 1,
      },
    });

    if (!shop) {
      throw new Error('店铺不存在或无权限访问');
    }

    // 更新最后登录时间
    await this.prisma.shop.update({
      where: {
        shop_id: shopId,
      },
      data: {
        last_login_time: Math.floor(Date.now() / 1000),
      },
    });

    return shop;
  }
}