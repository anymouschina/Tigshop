// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("通用-配置接口")
@Controller("common/config")
export class CommonConfigController {
  constructor() {}

  @Get("themeSettings")
  @ApiOperation({ summary: "获取主题设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getThemeSettings() {
    // 默认主题配置
    const defaultTheme = {
      primaryColor: "#1890ff",
      secondaryColor: "#52c41a",
      backgroundColor: "#f0f2f5",
      textColor: "#262626",
      borderRadius: "4px",
      fontSize: "14px",
      themeMode: "light", // light, dark
      language: "zh-CN",
      currency: "CNY",
      timezone: "Asia/Shanghai",
      logo: "/images/logo.png",
      favicon: "/images/favicon.ico",
      siteName: "TigShop商城",
      siteDescription: "专业的电商购物平台",
      keywords: "商城,购物,电商,商品",
      copyright: "© 2024 TigShop. All rights reserved.",
      icpNumber: "",
      contactEmail: "support@tigshop.com",
      contactPhone: "400-123-4567",
      socialLinks: {
        wechat: "",
        weibo: "",
        qq: "",
      },
      features: {
        showPrice: true,
        showStock: true,
        showSales: true,
        enableComments: true,
        enableRating: true,
        enableShare: true,
        enableFavorite: true,
      },
      pageConfig: {
        homePageTitle: "首页 - TigShop商城",
        productPageTitle: "商品详情 - TigShop商城",
        categoryPageTitle: "商品分类 - TigShop商城",
        cartPageTitle: "购物车 - TigShop商城",
        userPageTitle: "个人中心 - TigShop商城",
      },
    };

    return defaultTheme;
  }

  @Get("initConfigSettings")
  @ApiOperation({ summary: "获取初始化配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getInitConfigSettings() {
    // 默认初始化配置
    const defaultConfig = {
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
        maxFileSize: 5 * 1024 * 1024, // 5MB
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

    return defaultConfig;
  }

  // Placeholder for future POST methods
  // @Post("themeSettings")
  // @Post("initConfigSettings")
}
