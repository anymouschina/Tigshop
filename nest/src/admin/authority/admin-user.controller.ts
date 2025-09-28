// @ts-nocheck
import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from 'src/auth/guards/admin-jwt-auth.guard';
import { AuthorityGuard } from '../../auth/guards/authority.guard';
import { Authorities } from '../../auth/decorators/authority.decorator';

@ApiTags('Admin API - 管理员用户')
@Controller('adminapi/authority/adminUser')
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserController {

  /**
   * 获取当前管理员详情
   */
  @Get('mineDetail')
  @ApiOperation({ summary: '获取当前管理员详情' })
  async mineDetail(@Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const adminUser = await req.prisma.admin_user.findUnique({
      where: { admin_id: userId },
    });

    if (!adminUser) {
      throw new Error('管理员不存在');
    }

    // 解析权限列表 - 基于PHP逻辑
    let authList: string[] = [];

    // 1. 首先从admin_user.auth_list获取基础权限
    if (adminUser.auth_list) {
      try {
        authList = JSON.parse(adminUser.auth_list);
      } catch (e) {
        authList = adminUser.auth_list.split(',').filter(Boolean);
      }
    }

    // 2. 如果有role_id，从admin_role获取角色权限
    if (adminUser.role_id && adminUser.role_id > 0) {
      const role = await req.prisma.admin_role.findUnique({
        where: { role_id: adminUser.role_id },
        select: { authority_list: true }
      });

      if (role?.authority_list) {
        try {
          const roleAuthList = JSON.parse(role.authority_list);
          // 合并权限，去重
          authList = [...new Set([...authList, ...roleAuthList])];
        } catch (e) {
          const roleAuthList = role.authority_list.split(',').filter(Boolean);
          authList = [...new Set([...authList, ...roleAuthList])];
        }
      }
    }

    // 3. 如果是店铺管理员，获取店铺特定权限
    if (adminUser.shop_id && adminUser.shop_id > 0) {
      const adminUserShop = await req.prisma.admin_user_shop.findFirst({
        where: {
          admin_id: userId,
          shop_id: adminUser.shop_id,
          is_using: 1
        },
        select: { auth_list: true }
      });

      if (adminUserShop?.auth_list) {
        try {
          const shopAuthList = JSON.parse(adminUserShop.auth_list);
          authList = [...new Set([...authList, ...shopAuthList])];
        } catch (e) {
          const shopAuthList = adminUserShop.auth_list.split(',').filter(Boolean);
          authList = [...new Set([...authList, ...shopAuthList])];
        }
      }
    }

    // 4. 如果是供应商管理员，获取供应商特定权限
    if (adminUser.suppliers_id && adminUser.suppliers_id > 0) {
      const adminUserVendor = await req.prisma.admin_user_vendor.findFirst({
        where: {
          admin_id: userId,
          vendor_id: adminUser.suppliers_id,
          is_using: 1
        },
        select: { auth_list: true }
      });

      if (adminUserVendor?.auth_list) {
        try {
          const vendorAuthList = JSON.parse(adminUserVendor.auth_list);
          authList = [...new Set([...authList, ...vendorAuthList])];
        } catch (e) {
          const vendorAuthList = adminUserVendor.auth_list.split(',').filter(Boolean);
          authList = [...new Set([...authList, ...vendorAuthList])];
        }
      }
    }

    // 查询用户店铺信息
    const userShopRelations = await req.prisma.admin_user_shop.findMany({
      where: {
        admin_id: userId,
        is_using: 1
      }
    });

    // 查询对应的店铺信息
    const shopIds = userShopRelations.map(item => item.shop_id).filter(Boolean);
    const shops = shopIds.length > 0 ? await req.prisma.shop.findMany({
      where: {
        shop_id: {
          in: shopIds
        }
      }
    }) : [];

    // 组合数据
    const userShop = userShopRelations.map(item => {
      const shop = shops.find(s => s.shop_id === item.shop_id);
      return {
        ...item,
        shop
      };
    });

    // 查询用户供应商信息
    const userVendorRelations = await req.prisma.admin_user_vendor.findMany({
      where: {
        admin_id: userId,
        is_using: 1
      }
    });

    // 查询对应的供应商信息
    const vendorIds = userVendorRelations.map(item => item.vendor_id).filter(Boolean);
    const vendors = vendorIds.length > 0 ? await req.prisma.vendor.findMany({
      where: {
        vendor_id: {
          in: vendorIds
        }
      }
    }) : [];

    // 组合数据
    const userVendor = userVendorRelations.map(item => {
      const vendor = vendors.find(v => v.vendor_id === item.vendor_id);
      return {
        ...item,
        vendor
      };
    });

    // 构建返回对象，匹配PHP格式
    const result = {
      adminId: adminUser.admin_id,
      username: adminUser.username,
      adminType: adminUser.admin_type,
      mobile: adminUser.mobile,
      avatar: adminUser.avatar,
      password: adminUser.password,
      email: adminUser.email,
      addTime: adminUser.add_time,
      authList: authList,
      userId: adminUser.user_id,
      suppliersId: adminUser.suppliers_id,
      roleId: adminUser.role_id,
      merchantId: adminUser.merchant_id,
      parentId: adminUser.parent_id,
      menuTag: adminUser.menu_tag,
      orderExport: adminUser.order_export,
      extra: adminUser.extra,
      shopId: adminUser.shop_id,
      isUsing: adminUser.is_using,
      initialPassword: adminUser.initial_password,
      userShop: userShop.map(item => ({
        shop: {
          shopType: item.shop.shop_type,
          storeParentId: item.shop.store_parent_id,
          shopCoverPicture: item.shop.shop_cover_picture,
          shopShowPicture: item.shop.shop_show_picture,
          description: item.shop.description,
          status: item.shop.status,
          shopContactConfig: item.shop.shop_contact_config,
          shopOpenCloseConfig: item.shop.shop_open_close_config,
          shopRegionIds: item.shop.shop_region_ids,
          shopRegionNames: item.shop.shop_region_names,
          shopDetailedAddress: item.shop.shop_detailed_address,
          shopLongitude: item.shop.shop_longitude,
          shopLatitude: item.shop.shop_latitude,
          shopTips: item.shop.shop_tips,
          addTime: item.shop.add_time,
          clickCount: item.shop.click_count,
          contactMobile: item.shop.contact_mobile,
          frozenMoney: item.shop.frozen_money,
          isContactKefu: item.shop.is_contact_kefu,
          kefuInlet: item.shop.kefu_inlet,
          kefuLink: item.shop.kefu_link,
          kefuPhone: item.shop.kefu_phone,
          kefuWeixin: item.shop.kefu_weixin,
          merchantId: item.shop.merchant_id,
          shopId: item.shop.shop_id,
          shopLogo: item.shop.shop_logo,
          shopMoney: item.shop.shop_money,
          shopTitle: item.shop.shop_title,
          statusText: item.shop.status === 1 ? '开业' : '关闭',
          merchant: null,
          adminUserShop: null,
          check: false,
          storeParentName: null,
          tips: null,
          useShopCategory: null,
          shopShowCategory: null
        }
      })),
      userVendor: userVendor.map(item => ({
        vendor: {
          vendorId: item.vendor.vendor_id,
          vendorName: item.vendor.vendor_name,
          vendorLogo: item.vendor.vendor_logo,
          contactName: item.vendor.contact_name,
          contactMobile: item.vendor.contact_mobile,
          loginAccount: item.vendor.login_account,
          type: item.vendor.type,
          status: item.vendor.status,
          addTime: item.vendor.add_time
        }
      }))
    };

    return result
  }
}