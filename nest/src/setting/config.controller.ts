// @ts-nocheck
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UseInterceptors, UploadedFile } from "@nestjs/common";
import { ConfigService } from "./config.service";
import { PrismaService } from "src/prisma/prisma.service";
import {
  ConfigQueryDto,
  ConfigDetailDto,
  CreateConfigDto,
  UpdateConfigDto,
  UpdateConfigFieldDto,
  DeleteConfigDto,
  BatchDeleteConfigDto,
  BatchUpdateConfigDto,
} from "./dto/config.dto";
// 旧版基于 RolesGuard 的实现保留给 admin/config 前缀；兼容 adminapi 需使用 AdminJwtAuthGuard + AuthorityGuard
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { Public } from "../auth/decorators/public.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import * as fs from "fs/promises";
import * as path from "path";
import axios from "axios";
import * as nodemailer from "nodemailer";

@ApiTags("系统配置管理")
@Controller(["admin/config", "adminapi/setting/config"])
// 对 adminapi 前缀使用 AdminJwtAuthGuard + AuthorityGuard，旧 admin/config 仍可由 RolesGuard 兼容
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
// Roles 仍保留以兼容原逻辑（非 adminapi 路径）
@Roles("admin")
export class ConfigController {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // 兼容 PHP: GET /adminapi/setting/config/basicSettings
  @Get("basicSettings")
  @ApiOperation({ summary: "获取基础设置（兼容）" })
  async basicSettings() {
    const keys = [
      "shopLogo",
      "shopName",
      "shopCompany",
      "shopCompanyTxt",
      "poweredBy",
      "poweredByLogo",
      "poweredByStatus",
      "kefuAddress",
      "shopIcpNo",
      "shopIcpNoUrl",
      "shop110No",
      "shop110Link",
      "shopRegClosed",
      "closeOrder",
      "defaultCopyright",
      "defaultTechSupport",
      "lightShopLogo",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    const data = {
      ...map,
      defaultTechSupport:
        map.defaultTechSupport ?? "/static/mini/images/common/default_tech_support.png",
    };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/productSettings
  @Get("productSettings")
  @ApiOperation({ summary: "获取商品设置（兼容）" })
  async productSettings() {
    const keys = [
      "dollarSign",
      "dollarSignCn",
      "snPrefix",
      "showSelledCount",
      "showMarketprice",
      "marketPriceRate",
    ];
    const data = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/notifySettings
  @Get("notifySettings")
  @ApiOperation({ summary: "获取通知配置（兼容）" })
  async notifySettings() {
    const keys = [
      "smsKeyId",
      "smsKeySecret",
      "smsSignName",
      "smsShopMobile",
      "serviceEmail",
      "sendConfirmEmail",
      "orderPayEmail",
      "sendServiceEmail",
      "sendShipEmail",
    ];
    const data = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/shoppingSettings
  @Get("shoppingSettings")
  @ApiOperation({ summary: "获取购物设置（兼容）" })
  async shoppingSettings() {
    const keys = [
      "childAreaNeedRegion",
      "integralName",
      "integralScale",
      "orderSendPoint",
      "integralPercent",
      "commentSendPoint",
      "showSendPoint",
      "useQiandaoPoint",
      "canInvoice",
      "invoiceAdded",
      "returnConsignee",
      "returnMobile",
      "returnAddress",
    ];
    const data = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/showSettings
  @Get("showSettings")
  @ApiOperation({ summary: "获取显示设置（兼容）" })
  async showSettings() {
    const keys = [
      "searchKeywords",
      "msgHackWord",
      "isOpenPscws",
      "selfStoreName",
      "shopDefaultRegions",
      "defaultCountry",
      "showCatLevel",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    const countries = await this.prisma.region.findMany({
      where: { parent_id: 0 },
      orderBy: { region_id: "asc" },
    });
    const data = { ...map, countries };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/kefuSettings
  @Get("kefuSettings")
  @ApiOperation({ summary: "获取客服设置（兼容）" })
  async kefuSettings() {
    const keys = [
      "kefuType",
      "kefuYzfType",
      "kefuYzfSign",
      "kefuWorkwxId",
      "corpId",
      "kefuCode",
      "kefuCodeBlank",
      "kefuPhone",
      "kefuTime",
    ];
    const raw = await this.configService.getConfigsByCodes(keys);

    // 需要输出为数字的字段
    const numericKeys = ["kefuType", "kefuYzfType", "kefuCodeBlank"];

    const data: any = {
      kefuType: 0,
      kefuYzfType: 0,
      kefuYzfSign: "",
      kefuWorkwxId: "",
      corpId: "",
      kefuCode: "",
      kefuCodeBlank: 0,
      kefuPhone: "",
      kefuTime: "",
    };

    for (const k of Object.keys(raw)) {
      if (numericKeys.includes(k)) {
        const n = Number(raw[k]);
        data[k] = Number.isFinite(n) ? n : 0;
      } else {
        data[k] = raw[k];
      }
    }

    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveKefu
  @Post("saveKefu")
  @ApiOperation({ summary: "保存客服设置（兼容）" })
  @Authorities("saveSettingKefuManage")
  async saveKefu(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveShopping
  @Post("saveShopping")
  @ApiOperation({ summary: "保存购物设置（兼容）" })
  async saveShopping(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/apiSettings
  @Get("apiSettings")
  @ApiOperation({ summary: "获取接口设置（兼容）" })
  async apiSettings() {
    const keys = [
      "wechatAppId",
      "wechatAppSecret",
      "wechatServerUrl",
      "wechatServerToken",
      "wechatServerSecret",
      "wechatMiniProgramAppId",
      "wechatMiniProgramSecret",
      "wechatPayAppId",
      "wechatPayAppSecret",
      "icoTigCss",
      "icoDefinedCss",
      "storageType",
      "storageLocalUrl",
      "storageOssUrl",
      "storageOssAccessKeyId",
      "storageOssAccessKeySecret",
      "storageOssBucket",
      "storageOssRegion",
      "storageCosUrl",
      "storageCosSecretId",
      "storageCosSecretKey",
      "storageCosBucket",
      "storageCosRegion",
      "langOn",
      "langType",
      "langVolcengineAccessKey",
      "langVolcengineSecret",
    ];
    const data = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveApi
  @Post("saveApi")
  @ApiOperation({ summary: "保存接口设置（兼容）" })
  @Authorities("saveBasicManage")
  async saveApi(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/mailSettings
  @Get("mailSettings")
  @ApiOperation({ summary: "获取邮箱设置（兼容）" })
  async mailSettings() {
    const keys = [
      "mailService",
      "smtpSsl",
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPass",
      "smtpMail",
      "mailCharset",
      "testMailAddress",
    ];
    const data = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveMail
  @Post("saveMail")
  @ApiOperation({ summary: "保存邮箱设置（兼容）" })
  async saveMail(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/shippingSettings
  @Get("shippingSettings")
  @ApiOperation({ summary: "获取物流设置（兼容）" })
  async shippingSettings() {
    const keys = [
      "kdniaoApiKey",
      "kdniaoBusinessId",
      "sender",
      "mobile",
      "provinceName",
      "cityName",
      "areaName",
      "address",
      "defaultLogisticsName",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    const hasAny = Object.values(map).some((v) => v !== undefined && v !== null && v !== "");
    return { code: 0, message: "success", data: hasAny ? map : null };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveShipping
  @Post("saveShipping")
  @ApiOperation({ summary: "保存物流设置（兼容）" })
  async saveShipping(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/merchantSettings
  @Get("merchantSettings")
  @ApiOperation({ summary: "获取商户配置（兼容）" })
  @Authorities("configMerchantView")
  async merchantSettings() {
    const data = await this.configService.getJsonConfig("merchantSettings");
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveMerchant
  @Post("saveMerchant")
  @ApiOperation({ summary: "保存商户配置（兼容）" })
  @Authorities("configMerchantUpdate")
  async saveMerchant(@Body() body: any) {
    await this.configService.setJsonConfig("merchantSettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/shopSettings
  @Get("shopSettings")
  @ApiOperation({ summary: "获取店铺配置（兼容）" })
  @Authorities("configShopView")
  async shopSettings() {
    const data = await this.configService.getJsonConfig("shopSettings");
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveShop
  @Post("saveShop")
  @ApiOperation({ summary: "保存店铺配置（兼容）" })
  @Authorities("configShopUpdate")
  async saveShop(@Body() body: any) {
    await this.configService.setJsonConfig("shopSettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/vendorSettings
  @Get("vendorSettings")
  @ApiOperation({ summary: "获取供应商配置（兼容）" })
  @Authorities("configVendorView")
  async vendorSettings() {
    const data = await this.configService.getJsonConfig("vendorSettings");
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveVendor
  @Post("saveVendor")
  @ApiOperation({ summary: "保存供应商配置（兼容）" })
  @Authorities("configVendorUpdate")
  async saveVendor(@Body() body: any) {
    await this.configService.setJsonConfig("vendorSettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/globalSettings
  @Get("globalSettings")
  @ApiOperation({ summary: "获取全局设置（兼容）" })
  async globalSettings() {
    const keys = [
      "layout",
      "navTheme",
      "primaryColor",
      "adminLightLogo",
      "versionInfoHidden",
      "pcDomain",
      "h5Domain",
      "adminDomain",
      "uploadMaxSize",
      "autoRedirect",
      "shopTitle",
      "shopTitleSuffix",
      "shopKeywords",
      "shopDesc",
      "defaultAvatar",
      "icoImg",
      "icoDefinedCss",
      "storageType",
      "storageLocalUrl",
      "storageOssUrl",
      "storageOssAccessKeyId",
      "storageOssAccessKeySecret",
      "storageOssBucket",
      "storageOssRegion",
      "storageCosUrl",
      "storageCosSecretId",
      "storageCosSecretKey",
      "storageCosBucket",
      "storageCosRegion",
      "langOn",
      "langType",
      "defaultCountry",
      "langVolcengineAccessKey",
      "langVolcengineSecret",
      "msgHackWord",
      "isOpenPscws",
      "shopDefaultRegions",
      "searchKeywords",
      "imDomain",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    const countries = await this.prisma.region.findMany({
      where: { parent_id: 0 },
      orderBy: { region_id: "asc" },
    });
    const data = { ...map, countries };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveGlobal
  @Post("saveGlobal")
  @ApiOperation({ summary: "保存全局设置（兼容）" })
  async saveGlobal(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/orderSettings
  @Get("orderSettings")
  @ApiOperation({ summary: "获取订单设置（兼容）" })
  async orderSettings() {
    const keys = [
      "autoDeliveryDays",
      "autoReturnGoods",
      "autoReturnGoodsDays",
      "afterSalesLimitDays",
      "autoCancelOrderMinute",
      "isPlatformCancelPaidOrder",
      "isPlatformCancelDeliverOrder",
      "isShopCancelDeliverOrder",
    ];
    const data = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveOrder
  @Post("saveOrder")
  @ApiOperation({ summary: "保存订单设置（兼容）" })
  async saveOrder(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/profitSharingSettings
  @Get("profitSharingSettings")
  @ApiOperation({ summary: "获取分账配置（兼容）" })
  @Authorities("configProfitSharingView")
  async profitSharingSettings() {
    const data = await this.configService.getJsonConfig(
      "profitSharingSettings",
    );
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/withdrawalSettings
  @Get("withdrawalSettings")
  @ApiOperation({ summary: "获取提现配置（兼容）" })
  @Authorities("configWithdrawalView")
  async withdrawalSettings() {
    // 读取统一 JSON 配置；如无则返回默认
    const data =
      (await this.configService.getJsonConfig("withdrawalSettings")) ?? {};
    const defaults = {
      enabled: true,
      minAmount: 1,
      maxAmount: 50000,
      feeRate: 0,
      methods: ["alipay", "wechat", "bank"],
      dailyLimit: 50000,
    };
    return { code: 0, message: "success", data: { ...defaults, ...data } };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveWithdrawal
  @Post("saveWithdrawal")
  @ApiOperation({ summary: "保存提现配置（兼容）" })
  @Authorities("configWithdrawalUpdate")
  async saveWithdrawal(@Body() body: any) {
    // 简单校验与字段归一
    const payload = body ?? {};
    if (payload.minAmount !== undefined)
      payload.minAmount = Number(payload.minAmount) || 0;
    if (payload.maxAmount !== undefined)
      payload.maxAmount = Number(payload.maxAmount) || 0;
    if (payload.feeRate !== undefined)
      payload.feeRate = Number(payload.feeRate) || 0;
    if (payload.dailyLimit !== undefined)
      payload.dailyLimit = Number(payload.dailyLimit) || 0;
    if (payload.enabled !== undefined)
      payload.enabled = !!(
        payload.enabled === true || String(payload.enabled) === "1"
      );
    if (!Array.isArray(payload.methods)) {
      payload.methods = ["alipay", "wechat", "bank"];
    }
    await this.configService.setJsonConfig("withdrawalSettings", payload);
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/categoryDecorateSettings
  @Get("categoryDecorateSettings")
  @ApiOperation({ summary: "获取分类装修设置（兼容）" })
  @Authorities("configDecorateView")
  async categoryDecorateSettings() {
    // 使用已有 biz_code：productCategoryDecorateType / defaultHeaderStyle / lightShopLogo
    const keys = [
      "productCategoryDecorateType",
      "defaultHeaderStyle",
      "lightShopLogo",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    const data = {
      productCategoryDecorateType: Number(map.productCategoryDecorateType ?? 1),
      defaultHeaderStyle: map.defaultHeaderStyle ?? "modern",
      lightShopLogo: map.lightShopLogo ?? "",
    };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/themeStyleSettings
  @Get("themeStyleSettings")
  @ApiOperation({ summary: "获取主题风格设置（兼容）" })
  @Authorities("configThemeView")
  async themeStyleSettings() {
    const keys = ["themeId", "themeStyle"];
    const map = await this.configService.getConfigsByCodes(keys);
    const data = {
      themeId: Number(map.themeId ?? 1),
      themeStyle: map.themeStyle ?? "default",
    };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/authSettings
  @Get("authSettings")
  @ApiOperation({ summary: "获取会员认证配置（兼容）" })
  @Authorities("userAuthenticationManage")
  async authSettings() {
    const keys = ["type", "isIdentity", "isEnquiry", "smsNote", "tips"];
    const map = await this.configService.getConfigsByCodes(keys);
    const toInt = (v: any, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const data = {
      type: toInt(map.type, 1),
      isIdentity: toInt(map.isIdentity, 0),
      isEnquiry: toInt(map.isEnquiry, 0),
      smsNote: map.smsNote ?? "",
      tips: map.tips ?? "",
    };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveAuth
  @Post("saveAuth")
  @ApiOperation({ summary: "保存会员认证配置（兼容）" })
  @Authorities("saveAuthSettingsManage")
  async saveAuth(@Body() body: any) {
    const payload = body ?? {};
    const stringify = (v: any) => (v === undefined || v === null ? "" : String(v));
    const toNumStr = (v: any) => String(Number(v || 0));
    await Promise.all([
      this.configService.setConfigByCode("type", toNumStr(payload.type)),
      this.configService.setConfigByCode("isIdentity", toNumStr(payload.isIdentity)),
      this.configService.setConfigByCode("isEnquiry", toNumStr(payload.isEnquiry)),
      this.configService.setConfigByCode("smsNote", stringify(payload.smsNote)),
      this.configService.setConfigByCode("tips", stringify(payload.tips)),
    ]);
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveThemeStyle
  @Post("saveThemeStyle")
  @ApiOperation({ summary: "保存主题风格设置（兼容）" })
  @Authorities("configThemeUpdate")
  async saveThemeStyle(@Body() body: any) {
    const themeId = Number(body?.themeId ?? 1);
    const themeStyle = String(body?.themeStyle ?? "default");
    await Promise.all([
      this.configService.setConfigByCode("themeId", String(themeId)),
      this.configService.setConfigByCode("themeStyle", themeStyle),
    ]);
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveCategoryDecorate
  @Post("saveCategoryDecorate")
  @ApiOperation({ summary: "保存分类装修设置（兼容）" })
  @Authorities("configDecorateUpdate")
  async saveCategoryDecorate(@Body() body: any) {
    const productCategoryDecorateType = Number(
      body?.productCategoryDecorateType ?? 1,
    );
    const defaultHeaderStyle = String(body?.defaultHeaderStyle ?? "modern");
    const lightShopLogo = String(body?.lightShopLogo ?? "");
    await Promise.all([
      this.configService.setConfigByCode(
        "productCategoryDecorateType",
        String(productCategoryDecorateType),
      ),
      this.configService.setConfigByCode("defaultHeaderStyle", defaultHeaderStyle),
      this.configService.setConfigByCode("lightShopLogo", lightShopLogo),
    ]);
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/afterSalesSettings
  @Get("afterSalesSettings")
  @ApiOperation({ summary: "获取售后设置（兼容）" })
  async afterSalesSettings() {
    const data =
      (await this.configService.getJsonConfig("afterSalesSettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveAfterSales
  @Post("saveAfterSales")
  @ApiOperation({ summary: "保存售后设置（兼容）" })
  async saveAfterSales(@Body() body: any) {
    await this.configService.setJsonConfig("afterSalesSettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/basicConfig
  @Get("basicConfig")
  @ApiOperation({ summary: "获取基础配置（兼容）" })
  async basicConfig() {
    const keys = [
      "shopLogo",
      "shopName",
      "shopCompany",
      "shopCompanyTxt",
      "poweredBy",
      "poweredByLogo",
      "poweredByStatus",
      "kefuAddress",
      "shopIcpNo",
      "shopIcpNoUrl",
      "shop110No",
      "shop110Link",
      "shopRegClosed",
      "closeOrder",
      "defaultCopyright",
      "defaultTechSupport",
      "lightShopLogo",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    return { code: 0, message: "success", data: map };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveBasic
  @Post("saveBasic")
  @ApiOperation({ summary: "保存基础配置（兼容）" })
  async saveBasic(@Body() body: any) {
    const payload = body ?? {};
    const entries = Object.entries(payload);
    await Promise.all(
      entries.map(([k, v]) => this.configService.setConfigByCode(k, String(v ?? "")))
    );
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/layoutThemeSwitchSettings
  @Get("layoutThemeSwitchSettings")
  @ApiOperation({ summary: "获取布局与主题切换设置（兼容）" })
  async layoutThemeSwitchSettings() {
    const keys = ["layout", "navTheme", "primaryColor", "adminLightLogo", "versionInfoHidden"];
    const map = await this.configService.getConfigsByCodes(keys);
    const data = {
      layout: map.layout ?? "mix",
      navTheme: map.navTheme ?? "light",
      primaryColor: map.primaryColor ?? "#1677ff",
      adminLightLogo: map.adminLightLogo ?? "",
      versionInfoHidden: Number(map.versionInfoHidden ?? 0),
    };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: GET /adminapi/setting/config/loginSettings
  @Get("loginSettings")
  @ApiOperation({ summary: "获取登录设置（兼容）" })
  async loginSettings() {
    const data = (await this.configService.getJsonConfig("loginSettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/saveLogin
  @Post("saveLogin")
  @ApiOperation({ summary: "保存登录设置（兼容）" })
  async saveLogin(@Body() body: any) {
    await this.configService.setJsonConfig("loginSettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/paySettings
  @Get("paySettings")
  @ApiOperation({ summary: "获取支付设置聚合（兼容）" })
  async paySettings() {
    const [basic, wechat, ali, yaband, offline, paypal, yun] = await Promise.all([
      this.configService.getJsonConfig("basicPaySettings"),
      this.configService.getJsonConfig("wechatPaySettings"),
      this.configService.getJsonConfig("aliPaySettings"),
      this.configService.getJsonConfig("yaBandPaySettings"),
      this.configService.getJsonConfig("offlinePaySettings"),
      this.configService.getJsonConfig("payPalSettings"),
      this.configService.getJsonConfig("yunPaySettings"),
    ]);
    const data = {
      basicPaySettings: basic ?? {},
      wechatPaySettings: wechat ?? {},
      aliPaySettings: ali ?? {},
      yaBandPaySettings: yaband ?? {},
      offlinePaySettings: offline ?? {},
      payPalSettings: paypal ?? {},
      yunPaySettings: yun ?? {},
    };
    return { code: 0, message: "success", data };
  }

  // 兼容 PHP: POST /adminapi/setting/config/savePay
  @Post("savePay")
  @ApiOperation({ summary: "保存支付设置聚合（兼容）" })
  async savePay(@Body() body: any) {
    const payload = body ?? {};
    const tasks: Promise<any>[] = [];
    const groups = [
      "basicPaySettings",
      "wechatPaySettings",
      "aliPaySettings",
      "yaBandPaySettings",
      "offlinePaySettings",
      "payPalSettings",
      "yunPaySettings",
    ];
    for (const g of groups) {
      if (payload[g] !== undefined) {
        tasks.push(this.configService.setJsonConfig(g, payload[g] ?? {}));
      }
    }
    await Promise.all(tasks);
    return { code: 0, message: "success", data: true };
  }

  @Get("basicPaySettings")
  @ApiOperation({ summary: "获取基础支付设置（兼容）" })
  async basicPaySettings() {
    const data = (await this.configService.getJsonConfig("basicPaySettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("saveBasicPay")
  @ApiOperation({ summary: "保存基础支付设置（兼容）" })
  async saveBasicPay(@Body() body: any) {
    await this.configService.setJsonConfig("basicPaySettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  @Get("wechatPaySettings")
  @ApiOperation({ summary: "获取微信支付设置（兼容）" })
  async wechatPaySettings() {
    const data = (await this.configService.getJsonConfig("wechatPaySettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("saveWechatPay")
  @ApiOperation({ summary: "保存微信支付设置（兼容）" })
  async saveWechatPay(@Body() body: any) {
    await this.configService.setJsonConfig("wechatPaySettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  @Get("aliPaySettings")
  @ApiOperation({ summary: "获取支付宝设置（兼容）" })
  async aliPaySettings() {
    const data = (await this.configService.getJsonConfig("aliPaySettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("saveAliPay")
  @ApiOperation({ summary: "保存支付宝设置（兼容）" })
  async saveAliPay(@Body() body: any) {
    await this.configService.setJsonConfig("aliPaySettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  @Get("yaBandPaySettings")
  @ApiOperation({ summary: "获取YA支付设置（兼容）" })
  async yaBandPaySettings() {
    const data = (await this.configService.getJsonConfig("yaBandPaySettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("saveYaBandPay")
  @ApiOperation({ summary: "保存YA支付设置（兼容）" })
  async saveYaBandPay(@Body() body: any) {
    await this.configService.setJsonConfig("yaBandPaySettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  @Get("offlinePaySettings")
  @ApiOperation({ summary: "获取线下支付设置（兼容）" })
  async offlinePaySettings() {
    const data = (await this.configService.getJsonConfig("offlinePaySettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("saveOfflinePay")
  @ApiOperation({ summary: "保存线下支付设置（兼容）" })
  async saveOfflinePay(@Body() body: any) {
    await this.configService.setJsonConfig("offlinePaySettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  @Get("payPalSettings")
  @ApiOperation({ summary: "获取PayPal设置（兼容）" })
  async payPalSettings() {
    const data = (await this.configService.getJsonConfig("payPalSettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("savePayPal")
  @ApiOperation({ summary: "保存PayPal设置（兼容）" })
  async savePayPal(@Body() body: any) {
    await this.configService.setJsonConfig("payPalSettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  @Get("yunPaySettings")
  @ApiOperation({ summary: "获取云支付设置（兼容）" })
  async yunPaySettings() {
    const data = (await this.configService.getJsonConfig("yunPaySettings")) ?? {};
    return { code: 0, message: "success", data };
  }

  @Post("saveYunPay")
  @ApiOperation({ summary: "保存云支付设置（兼容）" })
  async saveYunPay(@Body() body: any) {
    await this.configService.setJsonConfig("yunPaySettings", body ?? {});
    return { code: 0, message: "success", data: true };
  }

  // 兼容 PHP: GET /adminapi/setting/config/getIcon
  @Get("getIcon")
  @ApiOperation({ summary: "拉取与解析图标CSS（兼容）" })
  async getIcon() {
    const map = await this.configService.getConfigsByCodes([
      "icoTigCss",
      "icoDefinedCss",
    ]);
    const urls = [map.icoTigCss, map.icoDefinedCss].filter(Boolean) as string[];
    const icons: string[] = [];
    const families: string[] = [];
    for (const url of urls) {
      try {
        const res = await axios.get(url, { timeout: 5000 });
        const css = String(res?.data ?? "");
        const reIcon = /\.icon-([a-zA-Z0-9_-]+)/g;
        let m: RegExpExecArray | null;
        while ((m = reIcon.exec(css))) {
          const name = m[1];
          const cls = `icon-${name}`;
          if (!icons.includes(cls)) icons.push(cls);
        }
        const reFamily = /font-family:\s*['\"]([^'\"]+)['\"]/g;
        while ((m = reFamily.exec(css))) {
          const fam = m[1];
          if (!families.includes(fam)) families.push(fam);
        }
      } catch (e) {
        // ignore fetch error
      }
    }
    return { code: 0, message: "success", data: { icons, families } };
  }

  // 兼容 PHP: POST /adminapi/setting/config/sendTestEmail
  @Post("sendTestEmail")
  @ApiOperation({ summary: "发送测试邮件（兼容）" })
  async sendTestEmail(@Body() body: any) {
    const cfg = await this.configService.getConfigsByCodes([
      "smtpSsl",
      "smtpHost",
      "smtpPort",
      "smtpUser",
      "smtpPass",
      "smtpMail",
      "mailCharset",
      "testMailAddress",
    ]);
    const to = String(body?.to ?? cfg.testMailAddress ?? cfg.smtpMail ?? "");
    if (!to) {
      return { code: 0, message: "success", data: { success: false, error: "missing recipient" } };
    }
    const secure = String(cfg.smtpSsl ?? "0") === "1";
    const port = Number(cfg.smtpPort ?? (secure ? 465 : 25));
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost,
      port,
      secure,
      auth: cfg.smtpUser && cfg.smtpPass ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined,
    } as any);
    try {
      await transporter.verify();
      await transporter.sendMail({
        from: cfg.smtpMail || cfg.smtpUser,
        to,
        subject: "Tigshop 测试邮件",
        text: "这是一封测试邮件",
      });
      return { code: 0, message: "success", data: { success: true } };
    } catch (err: any) {
      return { code: 0, message: "success", data: { success: false, error: String(err?.message || err) } };
    }
  }

  // 兼容 PHP: POST /adminapi/setting/config/uploadFile
  @Post("uploadFile")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "上传证书等文件（兼容）" })
  async uploadFile(@UploadedFile() file: any, @Body() body: any) {
    if (!file) {
      throw new BadRequestException("缺少文件");
    }
    const type = String(body?.type ?? "");
    const certDir = path.resolve(process.cwd(), "cert");
    try {
      await fs.mkdir(certDir, { recursive: true });
    } catch {}
    let filename = file.originalname || "cert.pem";
    if (type === "wx_cert") filename = "apiclient_cert.pem";
    else if (type === "wx_key") filename = "apiclient_key.pem";
    else if (type === "wx_p12") filename = "apiclient_cert.p12";
    const target = path.join(certDir, filename);
    await fs.writeFile(target, file.buffer);
    return { code: 0, message: "success", data: { path: `/cert/${filename}` } };
  }

  // 兼容 PHP: POST /adminapi/setting/config/createPlatformCertificate
  @Post("createPlatformCertificate")
  @ApiOperation({ summary: "生成平台证书（占位兼容）" })
  async createPlatformCertificate() {
    return { code: 0, message: "success", data: true };
  }

  @Get()
  @ApiOperation({ summary: "获取配置列表" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "biz_code", required: false, description: "业务代码" })
  @ApiQuery({ name: "paging", required: false, description: "是否分页" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConfigList(@Query() query: ConfigQueryDto) {
    const [records, total] = await Promise.all([
      this.configService.getFilterResult(query),
      query.paging
        ? this.configService.getFilterCount(query)
        : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: query.paging
        ? {
            records,
            total,
          }
        : records,
    };
  }

  @Get("all")
  @ApiOperation({ summary: "获取所有配置" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "biz_code", required: false, description: "业务代码" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAllConfigs(@Query() query: Partial<ConfigQueryDto>) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.configService.getFilterResult(filter);

    return {
      code: 200,
      message: "获取成功",
      data: records,
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "获取配置详情" })
  @ApiQuery({ name: "id", required: true, description: "配置ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConfigDetail(@Query() query: ConfigDetailDto) {
    const item = await this.configService.getDetail(query.id);

    return {
      code: 200,
      message: "获取成功",
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建配置" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createConfig(@Body() createDto: CreateConfigDto) {
    const result = await this.configService.create(createDto);

    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: "更新配置" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateConfig(@Body() updateDto: UpdateConfigDto) {
    const result = await this.configService.update(updateDto.id, updateDto);

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Put("field")
  @ApiOperation({ summary: "更新配置字段" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateConfigField(@Body() updateDto: UpdateConfigFieldDto) {
    const result = await this.configService.updateField(
      updateDto.id,
      updateDto.field,
      updateDto.value,
    );

    if (result) {
      return {
        code: 200,
        message: "更新成功",
      };
    } else {
      return {
        code: 400,
        message: "更新失败",
      };
    }
  }

  @Delete()
  @ApiOperation({ summary: "删除配置" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteConfig(@Body() deleteDto: DeleteConfigDto) {
    const result = await this.configService.delete(deleteDto.id);

    if (result) {
      return {
        code: 200,
        message: "删除成功",
      };
    } else {
      return {
        code: 400,
        message: "删除失败",
      };
    }
  }

  @Delete("batch")
  @ApiOperation({ summary: "批量删除配置" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeleteConfig(@Body() batchDto: BatchDeleteConfigDto) {
    const result = await this.configService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        message: "批量删除失败",
      };
    }
  }

  @Put("batch")
  @ApiOperation({ summary: "批量更新配置" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async batchUpdateConfig(@Body() batchDto: BatchUpdateConfigDto) {
    const result = await this.configService.batchUpdate(batchDto);

    if (result) {
      return {
        code: 200,
        message: "批量更新成功",
      };
    } else {
      return {
        code: 400,
        message: "批量更新失败",
      };
    }
  }

  @Get("by-code/:bizCode")
  @ApiOperation({ summary: "根据业务代码获取配置值" })
  @ApiParam({ name: "bizCode", description: "业务代码" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConfigByCode(@Param("bizCode") bizCode: string) {
    const result = await this.configService.getConfigByCode(bizCode);

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Get("by-codes")
  @ApiOperation({ summary: "批量获取配置值" })
  @ApiQuery({
    name: "biz_codes",
    required: true,
    description: "业务代码数组，用逗号分隔",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConfigsByCodes(@Query("biz_codes") bizCodes: string) {
    const codes = bizCodes.split(",").map((code) => code.trim());
    const result = await this.configService.getConfigsByCodes(codes);

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  // 兼容 PHP: GET /adminapi/setting/config/getAdminBase
  @Get("getAdminBase")
  @ApiOperation({ summary: "获取后台基础配置（兼容）" })
  @Authorities("configAdminBaseView")
  async getAdminBase(@Query("shopId") shopId?: string, @Query("vendorId") vendorId?: string) {
    // 简化实现：读取所需键值，部分按 PHP 逻辑提供默认
    const keys = [
      "icoDefinedCss",
      "dollarSign",
      "storageType",
      // storageUrl 需要拼接，后续可从存储配置推导，这里先读取通用 storageUrl
      "storageUrl",
      "pcDomain",
      "h5Domain",
      "uploadMaxSize",
      "shopCompany",
      "shopCompanyTxt",
      "poweredBy",
      "poweredByLogo",
      "poweredByStatus",
      "layout",
      "navTheme",
      "primaryColor",
      "adminLightLogo",
      "versionInfoHidden",
      "defaultCopyright",
      "defaultTechSupport",
      "withdrawSettingVO",
    ];
    const map = await this.configService.getConfigsByCodes(keys);
    const toInt = (v: any, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const toBoolInt = (v: any) => (v === "1" || v === 1 || v === true ? 1 : 0);
    const hasScope = Number(shopId || 0) > 0 || Number(vendorId || 0) > 0;
    // PHP 在店铺/供应商作用域会强制 layout/navTheme 为特定常量，这里给出固定值
    const SHOP_LAYOUT = "mix";
    const SHOP_NAVTHEME = "light";
    const data = {
      ico_defined_css: map.icoDefinedCss ?? "",
      dollar_sign: map.dollarSign ?? "¥",
      storage_type: map.storageType ?? "local",
      storage_url: map.storageUrl ?? "",
      pc_domain: map.pcDomain ?? "",
      h5_domain: map.h5Domain ?? "",
      version_type: "professional", // 来自 env('VERSION_TYPE', config('app.version_type'))，这里给默认 professional
      upload_max_size: map.uploadMaxSize ?? "20MB",
      shop_company: map.shopCompany ?? "",
      shop_company_txt: map.shopCompanyTxt ?? "",
      powered_by: map.poweredBy ?? "Powered by Tigshop",
      powered_by_logo: map.poweredByLogo ?? "/static/mini/images/common/powered_by.png",
      powered_by_status: toBoolInt(map.poweredByStatus ?? 1),
      layout: hasScope ? SHOP_LAYOUT : (map.layout ?? "mix"),
      nav_theme: hasScope ? SHOP_NAVTHEME : (map.navTheme ?? "light"),
      primary_color: map.primaryColor ?? "#1677ff",
      admin_light_logo: map.adminLightLogo ?? "",
      version_info_hidden: toBoolInt(map.versionInfoHidden ?? 0),
      default_copyright: toBoolInt(map.defaultCopyright ?? 1),
      default_tech_support: map.defaultTechSupport ?? "/static/mini/images/common/default_tech_support.png",
      withdrawSettingVO: map.withdrawSettingVO ? JSON.parse(map.withdrawSettingVO) : {},
    };
    return { code: 0, message: "success", data };
  }

  @Public()
  @Get("getLoginProtocol")
  @ApiOperation({ summary: "获取登录协议设置" })
  async getLoginProtocol() {
    const data = await this.configService.getLoginProtocolSettings();

    return data;
  }

  @Public()
  @Get("getAdmin")
  @ApiOperation({ summary: "获取后台基础配置信息" })
  async getAdminConfig() {
    const data = await this.configService.getAdminConfig();

    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Public()
  @Get("getLoginProtocolContent")
  @ApiOperation({ summary: "获取登录协议内容" })
  @ApiQuery({
    name: "code",
    required: true,
    description: "协议类型",
  })
  async getLoginProtocolContent(@Query("code") code: string) {
    if (!code) {
      throw new BadRequestException("参数错误");
    }

    const data = await this.configService.getLoginProtocolContent(code);

    return {
      code: 0,
      message: "success",
      data,
    };
  }

  @Post("saveLoginProtocol")
  @ApiOperation({ summary: "保存登录协议" })
  async saveLoginProtocol(
    @Body()
    body: {
      code: string;
      show?: number | string;
      content?: string;
    },
  ) {
    if (!body?.code) {
      throw new BadRequestException("参数错误");
    }

    const showValue = this.normalizeShowValue(body.show);
    const content = body.content ?? "";

    await this.configService.saveLoginProtocol(body.code, showValue, content);

    return {
      code: 0,
      message: "success",
      data: null,
    };
  }

  private normalizeShowValue(value: number | string | undefined): number {
    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  @Get("get-all-configs")
  @ApiOperation({ summary: "获取所有配置键值对" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAllConfigsMap() {
    const result = await this.configService.getAllConfigs();

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Get("by-group")
  @ApiOperation({ summary: "获取配置分组" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConfigsByGroup() {
    const result = await this.configService.getConfigsByGroup();

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Get("json/:bizCode")
  @ApiOperation({ summary: "获取JSON配置值" })
  @ApiParam({ name: "bizCode", description: "业务代码" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getJsonConfig(@Param("bizCode") bizCode: string) {
    const result = await this.configService.getJsonConfig(bizCode);

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Post("json/:bizCode")
  @ApiOperation({ summary: "设置JSON配置值" })
  @ApiParam({ name: "bizCode", description: "业务代码" })
  @ApiResponse({ status: 200, description: "设置成功" })
  async setJsonConfig(@Param("bizCode") bizCode: string, @Body() data: any) {
    await this.configService.setJsonConfig(bizCode, data);

    return {
      code: 200,
      message: "设置成功",
    };
  }

  @Get("number/:bizCode")
  @ApiOperation({ summary: "获取数值配置值" })
  @ApiParam({ name: "bizCode", description: "业务代码" })
  @ApiQuery({ name: "default", required: false, description: "默认值" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getNumberConfig(
    @Param("bizCode") bizCode: string,
    @Query("default") defaultValue?: string,
  ) {
    const defaultNum = defaultValue ? Number(defaultValue) : undefined;
    const result = await this.configService.getNumberConfig(
      bizCode,
      defaultNum,
    );

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Get("boolean/:bizCode")
  @ApiOperation({ summary: "获取布尔配置值" })
  @ApiParam({ name: "bizCode", description: "业务代码" })
  @ApiQuery({ name: "default", required: false, description: "默认值" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getBooleanConfig(
    @Param("bizCode") bizCode: string,
    @Query("default") defaultValue?: string,
  ) {
    const defaultBool = defaultValue ? defaultValue === "true" : false;
    const result = await this.configService.getBooleanConfig(
      bizCode,
      defaultBool,
    );

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Post("init")
  @Public()
  @ApiOperation({ summary: "初始化系统配置设置" })
  @ApiResponse({ status: 200, description: "初始化成功" })
  async initConfigSettings() {
    await this.configService.initConfigSettings();
    return {
      code: 200,
      message: "配置设置初始化成功",
    };
  }
}
