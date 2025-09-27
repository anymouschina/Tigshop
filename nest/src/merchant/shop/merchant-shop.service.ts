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

    // 获取管理员有权限的店铺列表
    const [adminUserShops, total] = await Promise.all([
      this.prisma.admin_user_shop.findMany({
        where: {
          admin_id: adminId,
          is_using: 1, // 只返回启用的权限
        },
        skip,
        take: size,
        orderBy: {
          add_time: 'desc',
        },
      }),
      this.prisma.admin_user_shop.count({
        where: {
          admin_id: adminId,
          is_using: 1,
        },
      }),
    ]);

    // 获取对应的店铺信息
    const shopIds = adminUserShops.map(aus => aus.shop_id).filter(Boolean);
    const shops = await this.prisma.shop.findMany({
      where: {
        shop_id: {
          in: shopIds,
        },
        status: 1, // 只返回启用状态的店铺
      },
    });

    // 将店铺信息关联到admin_user_shop记录
    const validShops = adminUserShops.map(aus => {
      const shop = shops.find(s => s.shop_id === aus.shop_id);
      return shop ? { ...aus, shop } : null;
    }).filter(Boolean);

    // 获取管理员信息
    const adminUser = await this.prisma.admin_user.findUnique({
      where: {
        admin_id: adminId,
      },
      select: {
        admin_id: true,
        username: true,
        email: true,
        mobile: true,
        admin_type: true,
      },
    });

    return {
      shops: validShops.map(aus => ({
        shop_id: aus.shop.shop_id,
        shop_title: aus.shop.shop_title,
        shop_logo: aus.shop.shop_logo,
        add_time: aus.shop.add_time,
        last_login_time: aus.shop.last_login_time,
        status: aus.shop.status,
        shop_money: aus.shop.shop_money,
        frozen_money: aus.shop.frozen_money,
        contact_mobile: aus.shop.contact_mobile,
        is_admin: aus.is_admin, // 是否为店铺管理员
        role_id: aus.role_id, // 角色ID
      })),
      vendors: [], // 暂时为空，PHP版本中没有此数据
      userinfo: adminUser ? {
        id: adminUser.admin_id,
        username: adminUser.username,
        email: adminUser.email,
        mobile: adminUser.mobile,
        admin_type: adminUser.admin_type,
        status: 1, // 管理员默认状态
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