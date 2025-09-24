// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CommonConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取主题设置 - 从数据库配置中获取
   * 对应PHP实现中的主题相关配置，基于官网完整响应
   */
  async getThemeSettings() {
    try {
      // 获取所有未删除的配置
      const allConfigs = await this.prisma.config.findMany({
        where: { is_del: 0 },
      });

      // 直接返回完整的配置对象，对齐官网响应格式
      const themeSettings = {
        themeId: this.getConfigValue(allConfigs, "themeId"),
        themeStyle: this.getConfigJson(allConfigs, "themeStyle", null, true), // themeStyle 返回字符串
        shopName: this.getConfigValue(allConfigs, "shopName"),
        shopTitle: this.getConfigValue(allConfigs, "shopTitle"),
        shopTitleSuffix: this.getConfigValue(allConfigs, "shopTitleSuffix"),
        shopLogo: this.getConfigValue(allConfigs, "shopLogo"),
        shopKeywords: this.getConfigValue(allConfigs, "shopKeywords"),
        shopDesc: this.getConfigValue(allConfigs, "shopDesc"),
        storageUrl: this.getConfigValue(allConfigs, "storageUrl"),
        dollarSign: this.getConfigValue(allConfigs, "dollarSign"),
        dollarSignCn: this.getConfigValue(allConfigs, "dollarSignCn"),
        icoImg: this.getConfigValue(allConfigs, "icoImg"),
        autoRedirect: this.getConfigBoolean(allConfigs, "autoRedirect"),
        openWechatOauth: this.getConfigBoolean(allConfigs, "openWechatOauth"),
        personApplyEnabled: this.getConfigBoolean(
          allConfigs,
          "personApplyEnabled",
        ),
        h5Domain: this.getConfigValue(allConfigs, "h5Domain"),
        pcDomain: this.getConfigValue(allConfigs, "pcDomain"),
        adminDomain: this.getConfigValue(allConfigs, "adminDomain"),
        showService: this.getConfigBoolean(allConfigs, "showService"),
        versionType: this.getConfigValue(allConfigs, "versionType"),
        version: this.getConfigValue(allConfigs, "version"),
        shopIcpNo: this.getConfigValue(allConfigs, "shopIcpNo"),
        shopIcpNoUrl: this.getConfigValue(allConfigs, "shopIcpNoUrl"),
        shop110No: this.getConfigValue(allConfigs, "shop110No"),
        shop110Link: this.getConfigValue(allConfigs, "shop110Link"),
        shopCompany: this.getConfigValue(allConfigs, "shopCompany"),
        companyAddress: this.getConfigValue(allConfigs, "companyAddress"),
        kefuPhone: this.getConfigValue(allConfigs, "kefuPhone"),
        kefuTime: this.getConfigValue(allConfigs, "kefuTime"),
        isEnterprise: this.getConfigBoolean(allConfigs, "isEnterprise"),
        deCopyright: this.getConfigBoolean(allConfigs, "deCopyright"),
        poweredByStatus: this.getConfigBoolean(allConfigs, "poweredByStatus"),
        poweredBy: this.getConfigValue(allConfigs, "poweredBy"),
        categoryDecorateType: this.getConfigValue(
          allConfigs,
          "categoryDecorateType",
        ),
        canInvoice: this.getConfigBoolean(allConfigs, "canInvoice"),
        invoiceAdded: this.getConfigBoolean(allConfigs, "invoiceAdded"),
        defaultShopName: this.getConfigValue(allConfigs, "defaultShopName"),
        isOpenMobileAreaCode: this.getConfigBoolean(
          allConfigs,
          "isOpenMobileAreaCode",
        ),
        showSelledCount: this.getConfigBoolean(allConfigs, "showSelledCount"),
        showMarketprice: this.getConfigBoolean(allConfigs, "showMarketprice"),
        enableAttributeFilter: this.getConfigBoolean(
          allConfigs,
          "enableAttributeFilter",
        ),
        useSurplus: this.getConfigBoolean(allConfigs, "useSurplus"),
        usePoints: this.getConfigBoolean(allConfigs, "usePoints"),
        useCoupon: this.getConfigBoolean(allConfigs, "useCoupon"),
        closeOrder: this.getConfigBoolean(allConfigs, "closeOrder"),
        shopRegClosed: this.getConfigBoolean(allConfigs, "shopRegClosed"),
        companyDataType: this.getConfigValue(allConfigs, "companyDataType"),
        companyDataTips: this.getConfigValue(allConfigs, "companyDataTips"),
        isIdentity: this.getConfigBoolean(allConfigs, "isIdentity"),
        isEnquiry: this.getConfigBoolean(allConfigs, "isEnquiry"),
        openWechatRegister: this.getConfigBoolean(
          allConfigs,
          "openWechatRegister",
        ),
        wechatRegisterBindPhone: this.getConfigBoolean(
          allConfigs,
          "wechatRegisterBindPhone",
        ),
        googleLoginOn: this.getConfigBoolean(allConfigs, "googleLoginOn"),
        facebookLoginOn: this.getConfigBoolean(allConfigs, "facebookLoginOn"),
        defaultTechSupport: this.getConfigValue(
          allConfigs,
          "defaultTechSupport",
        ),
        poweredByLogo: this.getConfigValue(allConfigs, "poweredByLogo"),
        openEmailRegister: this.getConfigBoolean(
          allConfigs,
          "openEmailRegister",
        ),
        integralName: this.getConfigValue(allConfigs, "integralName"),
        lightShopLogo: this.getConfigValue(allConfigs, "lightShopLogo"),
        closeAuth: this.getConfigBoolean(allConfigs, "closeAuth"),
        bulkPurchase: this.getConfigBoolean(allConfigs, "bulkPurchase"),
        openWechatPcLogin: this.getConfigBoolean(
          allConfigs,
          "openWechatPcLogin",
        ),
        kefuAddress: this.getConfigValue(allConfigs, "kefuAddress"),
        shopCompanyTxt: this.getConfigValue(allConfigs, "shopCompanyTxt"),
        growUpSetting: this.getConfigJson(allConfigs, "growUpSetting"),
        decoratePageConfig: this.getConfigJson(
          allConfigs,
          "decoratePageConfig",
        ),
        defaultHeaderStyle: this.getConfigValue(
          allConfigs,
          "defaultHeaderStyle",
        ),
      };

      return themeSettings;
    } catch (error) {
      console.error("获取主题设置失败:", error);
      // 返回默认配置
      return this.getDefaultThemeSettings();
    }
  }

  /**
   * 获取初始化配置设置 - 从数据库配置中获取
   * 对应PHP实现中的系统配置，返回与官网相同的完整配置
   */
  async getInitConfigSettings() {
    try {
      // 获取所有未删除的配置
      const allConfigs = await this.prisma.config.findMany({
        where: { is_del: 0 },
      });

      // 返回与官网完全相同的配置结构
      const initConfig = {
        themeId: this.getConfigValue(allConfigs, "themeId"),
        themeStyle: this.getConfigJson(allConfigs, "themeStyle", null, true), // themeStyle 返回字符串
        shopName: this.getConfigValue(allConfigs, "shopName"),
        shopTitle: this.getConfigValue(allConfigs, "shopTitle"),
        shopTitleSuffix: this.getConfigValue(allConfigs, "shopTitleSuffix"),
        shopLogo: this.getConfigValue(allConfigs, "shopLogo"),
        shopKeywords: this.getConfigValue(allConfigs, "shopKeywords"),
        shopDesc: this.getConfigValue(allConfigs, "shopDesc"),
        storageUrl: this.getConfigValue(allConfigs, "storageUrl"),
        dollarSign: this.getConfigValue(allConfigs, "dollarSign"),
        dollarSignCn: this.getConfigValue(allConfigs, "dollarSignCn"),
        icoImg: this.getConfigValue(allConfigs, "icoImg"),
        autoRedirect: this.getConfigBoolean(allConfigs, "autoRedirect"),
        openWechatOauth: this.getConfigBoolean(allConfigs, "openWechatOauth"),
        personApplyEnabled: this.getConfigBoolean(
          allConfigs,
          "personApplyEnabled",
        ),
        h5Domain: this.getConfigValue(allConfigs, "h5Domain"),
        pcDomain: this.getConfigValue(allConfigs, "pcDomain"),
        adminDomain: this.getConfigValue(allConfigs, "adminDomain"),
        showService: this.getConfigBoolean(allConfigs, "showService"),
        versionType: this.getConfigValue(allConfigs, "versionType"),
        version: this.getConfigValue(allConfigs, "version"),
        shopIcpNo: this.getConfigValue(allConfigs, "shopIcpNo"),
        shopIcpNoUrl: this.getConfigValue(allConfigs, "shopIcpNoUrl"),
        shop110No: this.getConfigValue(allConfigs, "shop110No"),
        shop110Link: this.getConfigValue(allConfigs, "shop110Link"),
        shopCompany: this.getConfigValue(allConfigs, "shopCompany"),
        companyAddress: this.getConfigValue(allConfigs, "companyAddress"),
        kefuPhone: this.getConfigValue(allConfigs, "kefuPhone"),
        kefuTime: this.getConfigValue(allConfigs, "kefuTime"),
        isEnterprise: this.getConfigBoolean(allConfigs, "isEnterprise"),
        deCopyright: this.getConfigBoolean(allConfigs, "deCopyright"),
        poweredByStatus: this.getConfigBoolean(allConfigs, "poweredByStatus"),
        poweredBy: this.getConfigValue(allConfigs, "poweredBy"),
        categoryDecorateType: this.getConfigValue(
          allConfigs,
          "categoryDecorateType",
        ),
        canInvoice: this.getConfigBoolean(allConfigs, "canInvoice"),
        invoiceAdded: this.getConfigBoolean(allConfigs, "invoiceAdded"),
        defaultShopName: this.getConfigValue(allConfigs, "defaultShopName"),
        isOpenMobileAreaCode: this.getConfigBoolean(
          allConfigs,
          "isOpenMobileAreaCode",
        ),
        showSelledCount: this.getConfigBoolean(allConfigs, "showSelledCount"),
        showMarketprice: this.getConfigBoolean(allConfigs, "showMarketprice"),
        enableAttributeFilter: this.getConfigBoolean(
          allConfigs,
          "enableAttributeFilter",
        ),
        useSurplus: this.getConfigBoolean(allConfigs, "useSurplus"),
        usePoints: this.getConfigBoolean(allConfigs, "usePoints"),
        useCoupon: this.getConfigBoolean(allConfigs, "useCoupon"),
        closeOrder: this.getConfigBoolean(allConfigs, "closeOrder"),
        shopRegClosed: this.getConfigBoolean(allConfigs, "shopRegClosed"),
        companyDataType: this.getConfigValue(allConfigs, "companyDataType"),
        companyDataTips: this.getConfigValue(allConfigs, "companyDataTips"),
        isIdentity: this.getConfigBoolean(allConfigs, "isIdentity"),
        isEnquiry: this.getConfigBoolean(allConfigs, "isEnquiry"),
        openWechatRegister: this.getConfigBoolean(
          allConfigs,
          "openWechatRegister",
        ),
        wechatRegisterBindPhone: this.getConfigBoolean(
          allConfigs,
          "wechatRegisterBindPhone",
        ),
        googleLoginOn: this.getConfigBoolean(allConfigs, "googleLoginOn"),
        facebookLoginOn: this.getConfigBoolean(allConfigs, "facebookLoginOn"),
        defaultTechSupport: this.getConfigValue(
          allConfigs,
          "defaultTechSupport",
        ),
        poweredByLogo: this.getConfigValue(allConfigs, "poweredByLogo"),
        openEmailRegister: this.getConfigBoolean(
          allConfigs,
          "openEmailRegister",
        ),
        integralName: this.getConfigValue(allConfigs, "integralName"),
        lightShopLogo: this.getConfigValue(allConfigs, "lightShopLogo"),
        closeAuth: this.getConfigBoolean(allConfigs, "closeAuth"),
        bulkPurchase: this.getConfigBoolean(allConfigs, "bulkPurchase"),
        openWechatPcLogin: this.getConfigBoolean(
          allConfigs,
          "openWechatPcLogin",
        ),
        kefuAddress: this.getConfigValue(allConfigs, "kefuAddress"),
        shopCompanyTxt: this.getConfigValue(allConfigs, "shopCompanyTxt"),
        growUpSetting: this.getConfigJson(allConfigs, "growUpSetting"),
        decoratePageConfig: this.getConfigJson(
          allConfigs,
          "decoratePageConfig",
        ),
        defaultHeaderStyle: this.getConfigValue(
          allConfigs,
          "defaultHeaderStyle",
        ),
      };

      return initConfig;
    } catch (error) {
      console.error("获取初始化配置失败:", error);
      // 返回默认配置
      return this.getDefaultInitConfigSettings();
    }
  }

  /**
   * 获取手机区号配置
   */
  async getMobileAreaCode() {
    try {
      // 从数据库获取手机区号配置
      const areaCodes = await this.prisma.area_code.findMany({
        where: {
          is_available: 1
        },
        orderBy: [
          { is_default: 'desc' },
          { id: 'asc' }
        ]
      });

      // 转换为前端需要的格式
      return areaCodes.map(area => ({
        label: `+${area.code}`,
        id: area.id,
        code: area.code,
        name: area.name,
        isAvailable: area.is_available,
        isDefault: area.is_default
      }));
    } catch (error) {
      console.error("获取手机区号配置失败:", error);
      // 返回默认数据
      return [
        {
          label: "+86",
          id: 1,
          code: "86",
          name: "中国",
          isAvailable: 1,
          isDefault: 1
        },
        {
          label: "+44",
          id: 2,
          code: "44",
          name: "美国",
          isAvailable: 1,
          isDefault: 0
        }
      ];
    }
  }

  /**
   * 从配置数组中获取配置值
   */
  private getConfigValue(
    configs: any[],
    bizCode: string,
    defaultValue: any = "",
  ): string {
    const config = configs.find((c) => c.biz_code === bizCode);
    return config?.biz_val || defaultValue;
  }

  /**
   * 从配置数组中获取布尔值 - 返回 1/0 而不是 true/false
   */
  private getConfigBoolean(
    configs: any[],
    bizCode: string,
    defaultValue: boolean = false,
  ): number {
    const value = this.getConfigValue(configs, bizCode);
    const boolValue = value === "1" || value === "true" || value === "yes" || defaultValue;
    return boolValue ? 1 : 0;
  }

  /**
   * 从配置数组中获取JSON配置 - 对于 themeStyle 返回字符串，其他返回解析后的对象
   */
  private getConfigJson(
    configs: any[],
    bizCode: string,
    defaultValue: any = null,
    returnAsString: boolean = false,
  ): any {
    const value = this.getConfigValue(configs, bizCode);
    if (!value) return defaultValue;

    // 对于 themeStyle 直接返回字符串
    if (bizCode === 'themeStyle' || returnAsString) {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`解析JSON配置失败 ${bizCode}:`, error);
      return defaultValue;
    }
  }

  /**
   * 获取默认主题设置 - 与官网格式对齐
   */
  private getDefaultThemeSettings() {
    return {
      themeId: "",
      themeStyle: {
        "--general": "#4a90e2",
        "--main-bg": "#4a90e2",
        "--main-bg-gradient": "#4a90e2",
        "--main-text": "#ffffff",
        "--vice-bg": "#D6E9FC",
        "--vice-text": "#0080FF",
        "--icon": "#0080FF",
        "--price": "#0080FF",
        "--tag-text": "#0080FF",
        "--tag-bg": "#E5F2FF",
        "--primary-light-3": "#4a90e2db",
        "--primary-light-5": "#a5c8f1",
        "--primary-light-7": "#c9def6",
        "--primary-light-8": "#dbe9f9",
        "--primary-light-9": "#edf4fc",
        "--primary-dark-2": "#3b73b5",
        "--main-btn-hover-bg": "",
        "--ump-main-bg": "#4a90e2",
        "--ump-main-text": "#ffffff",
        "--ump-vice-bg": "#D6E9FC",
        "--ump-vice-text": "#0080FF",
        "--ump-icon": "#0080FF",
        "--ump-price": "#0080FF",
        "--ump-tag-text": "#0080FF",
        "--ump-tag-bg": "#E5F2FF",
        "--ump-coupon-bg": "#F2F8FF",
        "--ump-border": "#CCE4FF",
        "--ump-start-bg": "#00B8FF",
        "--ump-end-bg": "#0078EF",
        themeId: 1,
      },
      shopName: "Tigshop",
      shopTitle: "Tigshop - 开源商城系统",
      shopTitleSuffix: "Tigshop开源商城系统",
      shopLogo:
        "https://oss.tigshop.com/img/gallery/202405/1715408024H4wezQfZXKcZkOSMFA.png",
      shopKeywords: "tigshop",
      shopDesc: "Tigshop开源商城系统",
      storageUrl: "https://oss.tigshop.com/",
      dollarSign: "¥",
      dollarSignCn: "元",
      icoImg: "img/gallery/202405/17153307441OamoZUGAhAlOpHSX3.png",
      autoRedirect: true,
      openWechatOauth: true,
      personApplyEnabled: true,
      h5Domain: "",
      pcDomain: "",
      adminDomain: "",
      showService: true,
      versionType: "B2C",
      version: "5.1.5",
      shopIcpNo: "赣ICP证18012754号",
      shopIcpNoUrl: "https://beian.miit.gov.cn/#/Integrated/index",
      shop110No: "赣公网安备36010902000767号",
      shop110Link:
        "http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11000008888888",
      shopCompany: "Copyright © 2024 Tigshop. All Rights Reserved",
      companyAddress: "",
      kefuPhone: "400-8388-283",
      kefuTime: "09:00-21:00",
      isEnterprise: false,
      deCopyright: false,
      poweredByStatus: true,
      poweredBy: "1",
      categoryDecorateType: "1",
      canInvoice: true,
      invoiceAdded: true,
      defaultShopName: "官方自营店",
      isOpenMobileAreaCode: true,
      showSelledCount: true,
      showMarketprice: true,
      enableAttributeFilter: false,
      useSurplus: true,
      usePoints: true,
      useCoupon: true,
      closeOrder: false,
      shopRegClosed: false,
      companyDataType: "1",
      companyDataTips: "7",
      isIdentity: true,
      isEnquiry: true,
      openWechatRegister: true,
      wechatRegisterBindPhone: true,
      googleLoginOn: true,
      facebookLoginOn: true,
      defaultTechSupport: "/static/mini/images/common/default_tech_support.png",
      poweredByLogo:
        "https://oss.tigshop.com/img/gallery/202506/1750742175SX391DSRvUbiFnNg9V.jpeg",
      openEmailRegister: true,
      integralName: "积分",
      lightShopLogo: "0",
      closeAuth: true,
      bulkPurchase: true,
      openWechatPcLogin: false,
      kefuAddress: "南昌市高新开发区鄱商大厦",
      shopCompanyTxt: "Copyright © 2024 Tigshop. All Rights Reserved",
      growUpSetting: {
        buyOrder: 1,
        buyOrderNumber: 1,
        buyOrderGrowth: 5,
        evpi: 1,
        evpiGrowth: 1,
        bindPhone: 1,
        bindPhoneGrowth: 1,
      },
      decoratePageConfig: {
        type: "page",
        module: [],
        backgroundRepeat: "",
        backgroundSize: 2,
        style: 0,
        title: "Tigshop",
        titleColor: "",
        headerStyle: 1,
        titleBackgroundColor: "",
        backgroundImage: {
          picUrl: "",
          picThumb: "",
        },
        backgroundColor: "",
        logo: {
          picUrl: "",
          picThumb: "",
        },
        active: false,
      },
      defaultHeaderStyle: "1",
    };
  }

  /**
   * 获取默认初始化配置
   */
  private getDefaultInitConfigSettings() {
    return {
      shopRegClosed: 0,
      openEmailRegister: 1,
      site: {
        siteName: "TigShop商城",
        siteUrl: "https://www.tigshop.com",
        logo: "/images/logo.png",
        favicon: "/images/favicon.ico",
        description: "专业的电商购物平台",
        keywords: "商城,购物,电商,商品",
        icpNumber: "",
        copyright: "© 2024 TigShop. All rights reserved.",
      },
      payment: {
        enabledPaymentMethods: ["alipay", "wechat", "unionpay"],
        currency: "CNY",
        decimalPlaces: 2,
        thousandSeparator: ",",
      },
      shipping: {
        freeShippingAmount: 99,
        defaultShippingFee: 10,
        shippingMethods: ["standard", "express", "same_day"],
      },
      system: {
        timezone: "Asia/Shanghai",
        language: "zh-CN",
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm:ss",
        enableRegistration: true,
        enableGuestCheckout: false,
        orderAutoCancelMinutes: 30,
        stockWarningThreshold: 10,
      },
      user: {
        allowRegistration: true,
        requireEmailVerification: false,
        requirePhoneVerification: false,
        defaultAvatar: "/images/default-avatar.png",
      },
      security: {
        passwordMinLength: 6,
        sessionTimeout: 7200,
        maxLoginAttempts: 5,
        lockoutDuration: 1800,
      },
      upload: {
        maxFileSize: 5 * 1024 * 1024,
        allowedImageTypes: ["jpg", "jpeg", "png", "gif", "webp"],
        allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx"],
        uploadPath: "/uploads/",
      },
      email: {
        smtpHost: "",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        fromEmail: "noreply@tigshop.com",
        fromName: "TigShop",
      },
      sms: {
        provider: "",
        apiKey: "",
        apiSecret: "",
        signature: "【TigShop】",
      },
    };
  }
}
