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
import { ConfigService } from "./config.service";
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

@ApiTags("系统配置管理")
@Controller(["admin/config", "adminapi/setting/config"])
// 对 adminapi 前缀使用 AdminJwtAuthGuard + AuthorityGuard，旧 admin/config 仍可由 RolesGuard 兼容
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
// Roles 仍保留以兼容原逻辑（非 adminapi 路径）
@Roles("admin")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

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
