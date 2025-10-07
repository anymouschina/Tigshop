// @ts-nocheck
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MerchantShopService {
  private readonly logger = new Logger(MerchantShopService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取商户店铺列表 - 对应PHP的myShop接口
   */
  async getMyShops(adminId: number, query: any = {}) {
    // 期望返回结构：{ userinfo: {...}, shop: {records:[], total, size, current, pages}, vendor: { ... } }
    const {
      page = 1,
      size = 15,
      sortField = "lastLoginTime",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * size;

    // 1. 管理员主信息
    const adminUser = await this.prisma.admin_user.findUnique({
      where: { admin_id: adminId },
    });
    if (!adminUser) {
      throw new Error("管理员不存在");
    }

    // 解析权限列表（含 all 展开）
    let authList: string[] = [];
    if (adminUser.auth_list) {
      try {
        const parsed = JSON.parse(adminUser.auth_list);
        if (Array.isArray(parsed)) authList = parsed.filter(Boolean);
        else if (typeof parsed === "string") authList = parsed.split(",").filter(Boolean);
      } catch {
        authList = adminUser.auth_list.split(",").filter(Boolean);
      }
    }
    if (authList.includes("all")) {
      const allAuth = await this.prisma.authority.findMany({ select: { authority_sn: true } });
      const extra = allAuth.map(a => a.authority_sn).filter(Boolean);
      const merged = new Set<string>([...authList, ...extra]);
      merged.delete("all"); // 展开后去掉 all 本身
      authList = Array.from(merged);
    }

    // 2. 关联店铺（全部 & 分页） — 如果没有 admin_user_shop 关联，兼容 PHP：
    //    1) 超级管理员(admin_type=admin) 查看全部店铺
    //    2) 普通商户按自身 merchant_id 查看店铺
    const shopRelationWhere = { admin_id: adminId, is_using: 1 } as any;
    let allRelations = await this.prisma.admin_user_shop.findMany({ where: shopRelationWhere });
    let total = await this.prisma.admin_user_shop.count({ where: shopRelationWhere });
    let pageRelations = await this.prisma.admin_user_shop.findMany({
      where: shopRelationWhere,
      skip,
      take: size,
      orderBy: { add_time: "desc" },
    });

    // Fallback: 若无绑定关系
    let fallbackMode = false;
    if (total === 0) {
      fallbackMode = true;
      let where: any = {};
      if (adminUser.admin_type === "admin") {
        // 超级管理员：全部店铺
        where = {};
      } else if (adminUser.merchant_id) {
        // 商户：其 merchant 下所有店铺 (注意 merchant_id 在 shop 中指向 merchant.merchant_id)
        where = { merchant_id: adminUser.merchant_id };
      } else {
        // 无 merchant_id 且非 admin，返回空
        where = { shop_id: -1 }; // 不命中
      }
      const [fallbackTotal, fallbackRecords] = await Promise.all([
        this.prisma.shop.count({ where }),
        this.prisma.shop.findMany({
          where,
          skip,
            take: size,
          orderBy: { shop_id: "desc" },
        }),
      ]);
      total = fallbackTotal;
      // 合成虚拟的 relation 结构供后续逻辑统一处理
      allRelations = fallbackRecords.map((s: any) => ({
        admin_id: adminId,
        shop_id: s.shop_id,
        is_using: 1,
        add_time: s.add_time || 0,
      }));
      pageRelations = allRelations; // 已经分页
    }

    const allShopIds = allRelations.map((r: any) => r.shop_id).filter(Boolean);
    const pageShopIds = pageRelations.map((r: any) => r.shop_id).filter(Boolean);
    const distinctShopIds = [...new Set(allShopIds)];
    const pageDistinctShopIds = [...new Set(pageShopIds)];

    const shopsOnPage = pageDistinctShopIds.length
      ? await this.prisma.shop.findMany({ where: { shop_id: { in: pageDistinctShopIds } } })
      : [];

    // 需要获取 merchant 数据
    const merchantIds = [...new Set(shopsOnPage.map((s) => s.merchant_id).filter(Boolean))];
    const merchants = merchantIds.length
      ? await this.prisma.merchant.findMany({ where: { merchant_id: { in: merchantIds as any } } })
      : [];
    const merchantMap = new Map<number, any>();
    merchants.forEach((m) => merchantMap.set(m.merchant_id, m));

    // 排序映射
    const sortFieldMap: Record<string, string> = {
      lastLoginTime: "last_login_time",
      shopTitle: "shop_title",
      addTime: "add_time",
    };
    const realSortField = sortFieldMap[sortField] || "last_login_time";

    const sortedShops = [...shopsOnPage].sort((a: any, b: any) => {
      const av = a[realSortField] || 0;
      const bv = b[realSortField] || 0;
      if (sortOrder.toLowerCase() === "asc") return av > bv ? 1 : av < bv ? -1 : 0;
      return av < bv ? 1 : av > bv ? -1 : 0;
    });

    // 构建分页 records
    const shopRecords = sortedShops.map((shop) => {
      const m = shop.merchant_id ? merchantMap.get(shop.merchant_id) : null;
      // 解析 merchant 结构中的 JSON 字段
      let baseData: any = null;
      let shopData: any = null;
      let merchantData: any = null;
      if (m?.base_data) {
        try { baseData = JSON.parse(m.base_data); } catch { baseData = m.base_data; }
      }
      if (m?.shop_data) {
        try { shopData = JSON.parse(m.shop_data); } catch { shopData = m.shop_data; }
      }
      if (m?.merchant_data) {
        try { merchantData = JSON.parse(m.merchant_data); } catch { merchantData = m.merchant_data; }
      }
      const typeText = m ? (m.type ? "个人认证" : "企业认证") : "";
      return {
        shop_type: shop.shop_type,
        store_parent_id: shop.store_parent_id,
        shop_cover_picture: shop.shop_cover_picture,
        shop_show_picture: shop.shop_show_picture,
        description: shop.description || "",
        status: shop.status,
        shop_contact_config: shop.shop_contact_config,
        shop_open_close_config: shop.shop_open_close_config,
        shop_region_ids: shop.shop_region_ids,
        shop_region_names: shop.shop_region_names,
        shop_detailed_address: shop.shop_detailed_address,
        shop_longitude: shop.shop_longitude,
        shop_latitude: shop.shop_latitude,
        shop_tips: shop.shop_tips,
        add_time: shop.add_time,
        click_count: shop.click_count || 0,
        contact_mobile: shop.contact_mobile || "",
        frozen_money: shop.frozen_money,
        is_contact_kefu: shop.is_contact_kefu,
        kefu_inlet: shop.kefu_inlet,
        kefu_link: shop.kefu_link || "",
        kefu_phone: shop.kefu_phone || "",
        kefu_weixin: shop.kefu_weixin || "",
        merchant_id: shop.merchant_id,
        shop_id: shop.shop_id,
        shop_logo: shop.shop_logo,
        shop_money: shop.shop_money,
        shop_title: shop.shop_title,
        status_text: shop.status === 1 ? "开业" : "关闭",
        merchant: m && {
          add_time: m.add_time,
          admin: {
            admin_id: 1, // 暂无直接关联，保持 PHP 示例结构
            admin_user_id: null,
            is_admin: null,
            merchant_id: null,
            merchant_user_id: null,
            user_id: null,
            username: "admin",
          },
          base_data: baseData,
          company_name: m.company_name || "",
            corporate_name: m.corporate_name || "",
          merchant_apply_id: m.merchant_apply_id || 0,
          merchant_data: merchantData,
          merchant_id: m.merchant_id,
          settlement_cycle: m.settlement_cycle,
          shop_data: shopData,
          status: m.status,
          status_text: m.status === 1 ? "正常" : "禁用",
          type: m.type,
          type_text: typeText,
          user_id: m.user_id || 0,
          user: null,
          shop_count: null,
        },
        admin_user_shop: null,
        check: false,
        store_parent_name: null,
        tips: null,
        use_shop_category: shop.use_shop_category || 0,
        shop_show_category: shop.shop_show_category || null,
      };
    });

    // 3. userShop & userVendor（与 admin-user.controller 保持一致结构）
    const fullShops = allShopIds.length
      ? await this.prisma.shop.findMany({ where: { shop_id: { in: distinctShopIds } } })
      : [];
    const fullShopMap = new Map<number, any>();
    fullShops.forEach((s) => fullShopMap.set(s.shop_id, s));
    const userShop = allRelations.map((rel: any) => {
      const s = fullShopMap.get(rel.shop_id);
      if (!s) return null;
      return {
        shop: {
          shop_type: s.shop_type,
          store_parent_id: s.store_parent_id,
          shop_cover_picture: s.shop_cover_picture,
          shop_show_picture: s.shop_show_picture,
          description: s.description,
          status: s.status,
          shop_contact_config: s.shop_contact_config,
          shop_open_close_config: s.shop_open_close_config,
          shop_region_ids: s.shop_region_ids,
          shop_region_names: s.shop_region_names,
          shop_detailed_address: s.shop_detailed_address,
          shop_longitude: s.shop_longitude,
          shop_latitude: s.shop_latitude,
          shop_tips: s.shop_tips,
          add_time: s.add_time,
          click_count: s.click_count,
          contact_mobile: s.contact_mobile,
          frozen_money: s.frozen_money,
          is_contact_kefu: s.is_contact_kefu,
          kefu_inlet: s.kefu_inlet,
          kefu_link: s.kefu_link,
          kefu_phone: s.kefu_phone,
          kefu_weixin: s.kefu_weixin,
          merchant_id: s.merchant_id,
          shop_id: s.shop_id,
          shop_logo: s.shop_logo,
          shop_money: s.shop_money,
          shop_title: s.shop_title,
          status_text: s.status === 1 ? "开业" : "关闭",
          merchant: null,
          admin_user_shop: null,
          check: false,
          store_parent_name: null,
          tips: null,
          use_shop_category: s.use_shop_category || 0,
          shop_show_category: s.shop_show_category || null,
        },
      };
    }).filter(Boolean);

    // 4. 供应商 (vendor) 分页（当前简单返回全部，后续可加分页参数）
    const vendorRelationWhere = { admin_id: adminId, is_using: 1 };
    const vendorRelations = await this.prisma.admin_user_vendor.findMany({ where: vendorRelationWhere });
    const vendorIds = vendorRelations.map((v) => v.vendor_id).filter(Boolean);
    const vendors = vendorIds.length
      ? await this.prisma.vendor.findMany({ where: { vendor_id: { in: vendorIds } } })
      : [];
    const vendorMap = new Map<number, any>();
    vendors.forEach((v) => vendorMap.set(v.vendor_id, v));
    const vendorRecords = vendorRelations.map((rel) => {
      const v = vendorMap.get(rel.vendor_id);
      if (!v) return null;
      return {
        vendor_id: v.vendor_id,
        vendor_name: v.vendor_name,
        vendor_logo: v.vendor_logo,
        contact_name: v.contact_name,
        contact_mobile: v.contact_mobile || "",
        login_account: v.login_account,
        type: v.type,
        status: v.status,
        add_time: v.add_time,
      };
    }).filter(Boolean);

    // 构建 userinfo（字段使用 camelCase 形式以避免再次转换）
    const userinfo: any = {
      adminId: adminUser.admin_id,
      username: adminUser.username,
      adminType: adminUser.admin_type,
      mobile: adminUser.mobile,
      avatar: adminUser.avatar,
      password: adminUser.password,
      email: adminUser.email,
      addTime: adminUser.add_time ? adminUser.add_time : null,
      authList: authList,
      userId: adminUser.user_id,
      suppliersId: adminUser.suppliers_id,
      roleId: adminUser.role_id,
      roleName: null,
      merchantId: adminUser.merchant_id,
      parentId: adminUser.parent_id,
      menuTag: adminUser.menu_tag || "",
      orderExport: adminUser.order_export,
      extra: adminUser.extra || "",
      shopId: adminUser.shop_id,
      isUsing: adminUser.is_using,
      oldPassword: null,
      pwdConfirm: null,
      initialPassword: adminUser.initial_password || "",
      userShop: userShop,
      userVendor: vendorRelations.map((rel) => {
        const v = vendorMap.get(rel.vendor_id);
        if (!v) return null;
        return {
          vendor: {
            vendorId: v.vendor_id,
            vendorName: v.vendor_name,
            vendorLogo: v.vendor_logo,
            contactName: v.contact_name,
            contactMobile: v.contact_mobile || "",
            loginAccount: v.login_account,
            type: v.type,
            status: v.status,
            addTime: v.add_time,
          },
        };
      }).filter(Boolean),
    };

    const shop = {
      records: shopRecords,
      total,
      size,
      current: page,
      pages: Math.ceil(total / size),
    };

    const vendor = {
      records: [], // 暂未做 vendor 分页返回，与示例一致为空
      total: 0,
      size: 10,
      current: 1,
      pages: 0,
    };

    return { code: 0, message: "success", data: { userinfo, shop, vendor } };
  }

  /**
   * 获取店铺详情
   */
  async getShopDetail(shopId: number, adminId: number) {
    // 先查店铺本身（shop 表无名为 merchant 的关系，避免 include 导致 Prisma 校验错误）
    const shop = await this.prisma.shop.findFirst({
      where: {
        shop_id: shopId,
        merchant_id: adminId,
      },
    });

    if (!shop) {
      throw new Error("店铺不存在或无权限访问");
    }

    // 补充商户信息（通过 merchant_id 二次查询）
    const merchant = shop.merchant_id
      ? await this.prisma.merchant.findUnique({
          where: { merchant_id: shop.merchant_id },
          select: {
            merchant_id: true,
            company_name: true,
            corporate_name: true,
            merchant_data: true, // 可能包含手机号等扩展信息
          },
        })
      : null;

    let merchantInfo: any = null;
    if (merchant) {
      // 兼容返回字段：名称/联系人/联系方式
      let extra: any = {};
      if (merchant.merchant_data) {
        try { extra = JSON.parse(merchant.merchant_data as any); } catch {}
      }
      merchantInfo = {
        merchantId: merchant.merchant_id,
        companyName: merchant.company_name,
        corporateName: merchant.corporate_name,
        contactMobile: extra.contact_mobile || extra.mobile || "",
      };
    }

    return {
      ...shop,
      merchant: merchantInfo,
    };
  }

  /**
   * 创建店铺
   */
  async createShop(adminId: number, shopData: any) {
    const { shopTitle, shopLogo, contactMobile, description } = shopData;
    const now = Math.floor(Date.now() / 1000);

    // TODO: 若需真正绑定 merchant，可在前端 / 账号体系中先创建 merchant 记录并传入 merchantId
    // 这里暂时沿用 adminId 作为 merchant_id (与现有数据保持兼容)，后续可迁移
    const shop = await this.prisma.shop.create({
      data: {
        shop_title: shopTitle,
        shop_logo: shopLogo || "",
        contact_mobile: contactMobile || "",
        description: description || "",
        merchant_id: shopData.merchantId || shopData.merchant_id || null, // 优先显式 merchantId
        add_time: now,
        status: 1,
        last_login_time: now,
      },
    });

    // 若没有 merchantId 传入，且当前 admin 不是超级管理员，则把该 admin 视作其 merchant 拥有者（兼容旧行为）
    if (!shop.merchant_id) {
      await this.prisma.shop.update({
        where: { shop_id: shop.shop_id },
        data: { merchant_id: adminId },
      });
    }

    // 建立 admin_user_shop 关联，避免 myShop 接口缺失
    try {
      const existRel = await this.prisma.admin_user_shop.findFirst({
        where: { admin_id: adminId, shop_id: shop.shop_id },
      });
      if (!existRel) {
        await this.prisma.admin_user_shop.create({
          data: {
            admin_id: adminId,
            user_id: 0,
            shop_id: shop.shop_id,
            username: "",
            email: "",
            is_using: 1,
            is_admin: 1,
            add_time: now,
            role_id: 0,
          },
        });
      }
    } catch (e) {
      this.logger.warn(`createShop relation failed: ${e.message}`);
    }

    return shop;
  }

  /** 清空当前选择店铺 (返回管理后台视角) */
  async clearCurrentShop(adminId: number) {
    try {
      await this.prisma.admin_user.update({
        where: { admin_id: adminId },
        data: { shop_id: 0 },
      });
    } catch (e) {
      this.logger.warn(`clearCurrentShop failed: ${e.message}`);
    }
  }

  /**
   * 员工概览 (staffShow)
   * 返回字段: usingUser, stopUsingUser, residue, adminLog[]
   * 说明:
   *  - usingUser: 正在使用的 admin_user 数( is_using = 1 )
   *  - stopUsingUser: 停用员工数 ( is_using = 0 且非主账号 )
   *  - residue: 剩余可用名额 (暂缺配置, 先返回 0, 后续可接入套餐/授权表)
   *  - adminLog: 最近 10 条操作日志 (admin_log), 关联用户名
   */
  async staffShow(adminId: number) {
    // 统计当前商户账号体系下的员工: 通过 merchant_id 反查所有 admin_user
    const currentAdmin = await this.prisma.admin_user.findUnique({ where: { admin_id: adminId } });
    if (!currentAdmin) {
      throw new Error("管理员不存在");
    }

    const merchantId = currentAdmin.merchant_id || 0;
    let usingUser = 0;
    let stopUsingUser = 0;

    if (merchantId) {
      const allAdminUsers = await this.prisma.admin_user.findMany({ where: { merchant_id: merchantId } });
      usingUser = allAdminUsers.filter(a => a.is_using === 1).length;
      // 主账号: parent_id = 0 且自身就是第一管理员; 停用员工不统计主账号
      stopUsingUser = allAdminUsers.filter(a => a.is_using === 0 && a.parent_id !== 0).length;
    } else {
      // 没有 merchant_id 时仅统计自己
      usingUser = currentAdmin.is_using === 1 ? 1 : 0;
      stopUsingUser = currentAdmin.is_using === 0 ? 1 : 0;
    }

    // residue 逻辑: 若有授权上限(例如在 config / license 表), 可在此计算; 目前返回 0
    const residue = 0;

    // 最近操作日志: 取最近 10 条 admin_log (log_time desc)
    const logs = await this.prisma.admin_log.findMany({
      orderBy: { log_time: "desc" },
      take: 10,
    });

    // 获取涉及的 user_id -> 取 admin_user.username 作为显示; 如果没有匹配则留空
    const logUserIds = Array.from(new Set(logs.map(l => l.user_id).filter(id => !!id)));
    const logAdmins = logUserIds.length
      ? await this.prisma.admin_user.findMany({ where: { admin_id: { in: logUserIds } } })
      : [];
    const adminNameMap = new Map<number, string>();
    logAdmins.forEach(a => adminNameMap.set(a.admin_id, a.username));

    const adminLog = logs.map(l => ({
      logId: l.log_id,
      userId: l.user_id,
      logInfo: l.log_info,
      logTime: this.formatUnix(l.log_time),
      ipAddress: l.ip_address,
      username: adminNameMap.get(l.user_id) || "",
    }));

    return { usingUser, stopUsingUser, residue, adminLog };
  }

  private formatUnix(ts: number | null | undefined) {
    if (!ts) return "";
    try {
      const d = new Date(ts * 1000);
      const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
      return (
        d.getFullYear() +
        "-" + pad(d.getMonth() + 1) +
        "-" + pad(d.getDate()) +
        " " + pad(d.getHours()) +
        ":" + pad(d.getMinutes()) +
        ":" + pad(d.getSeconds())
      );
    } catch {
      return "";
    }
  }

  /**
   * 更新店铺信息
   */
  async updateShop(shopId: number, adminId: number, shopData: any) {
    const {
      shopTitle,
      shopLogo,
      contactMobile,
      description,
      kefuPhone,
      kefuWeixin,
    } = shopData;

    const existingShop = await this.prisma.shop.findFirst({
      where: {
        shop_id: shopId,
        merchant_id: adminId,
      },
    });

    if (!existingShop) {
      throw new Error("店铺不存在或无权限访问");
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
  async getCurrentShopDetail(adminId: number, explicitShopId?: number) {
    // 读取管理员基础信息与权限
    const adminUser = await this.prisma.admin_user.findUnique({ where: { admin_id: adminId } });
    if (!adminUser) throw new Error("管理员不存在");

    // 解析 auth_list（可能为 JSON / 逗号分隔），展开 all
    let authList: string[] = [];
    if (adminUser.auth_list) {
      try {
        const parsed = JSON.parse(adminUser.auth_list);
        if (Array.isArray(parsed)) authList = parsed.filter(Boolean);
        else if (typeof parsed === 'string') authList = parsed.split(',').filter(Boolean);
      } catch {
        authList = adminUser.auth_list.split(',').filter(Boolean);
      }
    }
    if (authList.includes('all')) {
      const allAuth = await this.prisma.authority.findMany({ select: { authority_sn: true } });
      const merged = new Set<string>([...authList, ...allAuth.map(a => a.authority_sn).filter(Boolean)]);
      merged.delete('all');
      authList = Array.from(merged);
    }

    // 判断是否超级管理员：条件任一成立
    const isSuperAdmin = (
      adminUser.admin_type === 'admin' ||
      authList.length > 0 && authList.includes('systemManage') || // 示例：可按需要调整权限标识
      authList.length > 0 && authList.length > 100 // 粗糙判定：权限极多
    );

    // 如果提供了 explicitShopId：优先尝试按权限读取
    if (explicitShopId) {
      let canAccess = false;
      if (isSuperAdmin) {
        canAccess = true;
      } else {
        // 1) 绑定关系 admin_user_shop
        const bind = await this.prisma.admin_user_shop.findFirst({ where: { admin_id: adminId, shop_id: explicitShopId } });
        if (bind) canAccess = true;
        // 2) 作为其 merchant 下店铺 (adminUser.merchant_id) 可访问
        if (!canAccess && adminUser.merchant_id) {
          const shopOne = await this.prisma.shop.findFirst({ where: { shop_id: explicitShopId, merchant_id: adminUser.merchant_id } });
          if (shopOne) canAccess = true;
        }
      }
      if (!canAccess) throw new Error('无权访问该店铺');
      const shop = await this.prisma.shop.findFirst({ where: { shop_id: explicitShopId } });
      if (shop) return shop;
      // 若明确指定但不存在
      throw new Error('店铺不存在');
    }

    // 未指定 shopId：按优先级查找
    // 1) 若超级管理员：直接取最早（与原逻辑一致）
    let baseWhere: any = { status: 1 };
    if (!isSuperAdmin) {
      if (adminUser.merchant_id) baseWhere.merchant_id = adminUser.merchant_id;
      else {
        // 退化策略：尝试通过绑定关系推导 shop_id 列表
        const rels = await this.prisma.admin_user_shop.findMany({ where: { admin_id: adminId }, select: { shop_id: true } });
        const ids = rels.map(r => r.shop_id).filter(Boolean);
        if (ids.length === 0) throw new Error('暂无可用店铺');
        baseWhere.shop_id = { in: ids };
      }
    }

    const shop = await this.prisma.shop.findFirst({ where: baseWhere, orderBy: { add_time: 'asc' } });
    if (!shop) throw new Error('暂无可用店铺');
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
      throw new Error("暂无可用店铺");
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
    const {
      vendor_set_price_type,
      vendor_set_price_auto_value,
      service_fee_rate,
    } = settingData;

    const shop = await this.prisma.shop.findFirst({
      where: {
        merchant_id: adminId,
        status: 1,
      },
    });

    if (!shop) {
      throw new Error("暂无可用店铺");
    }

    const updatedShop = await this.prisma.shop.update({
      where: {
        shop_id: shop.shop_id,
      },
      data: {
        ...(vendor_set_price_type !== undefined && { vendor_set_price_type }),
        ...(vendor_set_price_auto_value !== undefined && {
          vendor_set_price_auto_value,
        }),
        ...(service_fee_rate !== undefined && { service_fee_rate }),
      },
    });

    return updatedShop;
  }

  /**
   * 选择店铺
   */
  async chooseShop(adminId: number, shopId: number) {
    // 对齐 PHP 逻辑：
    // 1. shopId 必须为正整数
    // 2. 超级管理员 (admin_type = admin) 可选择任意存在的店铺
    // 3. 非 admin：
    //    a) 若存在 admin_user_shop 绑定记录则必须在绑定列表中
    //    b) 否则按 merchant_id (当前账号的 merchant_id) 过滤
    if (!shopId || isNaN(Number(shopId))) throw new Error("无效的店铺ID");
    shopId = Number(shopId);

    const admin = await this.prisma.admin_user.findUnique({ where: { admin_id: adminId } });
    if (!admin) throw new Error("管理员不存在");

    // 先取店铺
    const targetShop = await this.prisma.shop.findUnique({ where: { shop_id: shopId } });
    if (!targetShop || targetShop.status !== 1) throw new Error("店铺不存在或已关闭");

    let allowed = false;
    if (admin.admin_type === "admin") {
      allowed = true; // 超管
    } else {
      // 先看是否有绑定关系
      const relation = await this.prisma.admin_user_shop.findFirst({
        where: { admin_id: adminId, shop_id: shopId, is_using: 1 },
      });
      if (relation) {
        allowed = true;
      } else if (admin.merchant_id && targetShop.merchant_id === admin.merchant_id) {
        allowed = true; // 同一个 merchant
        // 自动补建绑定（与 PHP 行为保持一致，方便后续 myShop 列出）
        try {
          await this.prisma.admin_user_shop.create({
            data: {
              admin_id: adminId,
              user_id: 0,
              shop_id: shopId,
              username: admin.username,
              email: admin.email,
              is_using: 1,
              is_admin: 0,
              add_time: Math.floor(Date.now() / 1000),
              role_id: admin.role_id || 0,
            },
          });
        } catch (e) {
          this.logger.debug(`chooseShop create relation ignore: ${e.message}`);
        }
      }
    }

    if (!allowed) throw new Error("店铺不存在或无权限访问");

    // 更新店铺 last_login_time
    const now = Math.floor(Date.now() / 1000);
    await this.prisma.shop.update({
      where: { shop_id: shopId },
      data: { last_login_time: now },
    });

    // 更新 admin_user 当前选择的 shop_id (PHP 通常会这样做以便后续接口上下文)
    try {
      await this.prisma.admin_user.update({
        where: { admin_id: adminId },
        data: { shop_id: shopId },
      });
    } catch (e) {
      this.logger.warn(`更新管理员 shop_id 失败: ${e.message}`);
    }

    return targetShop;
  }
}
