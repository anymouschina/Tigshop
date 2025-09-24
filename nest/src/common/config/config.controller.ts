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
import { CommonConfigService } from "./config.service";

@ApiTags("通用-配置接口")
@Controller("common/config")
export class CommonConfigController {
  constructor(private readonly commonConfigService: CommonConfigService) {}

  @Get("themeSettings")
  @ApiOperation({ summary: "获取主题设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getThemeSettings() {
    // 从数据库获取主题设置
    return this.commonConfigService.getThemeSettings();
  }

  @Get("initConfigSettings")
  @ApiOperation({ summary: "获取初始化配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getInitConfigSettings() {
    // 从数据库获取初始化配置
    return this.commonConfigService.getInitConfigSettings();
  }

  @Get("mobileAreaCode")
  @ApiOperation({ summary: "获取手机区号配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMobileAreaCode() {
    // 从数据库获取手机区号配置
    return this.commonConfigService.getMobileAreaCode();
  }

  // Placeholder for future POST methods
  // @Post("themeSettings")
  // @Post("initConfigSettings")
}
