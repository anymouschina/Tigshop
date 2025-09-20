// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserDecorateService } from "./user-decorate.service";

@ApiTags("用户端页面装修")
@Controller("api/decorate")
export class UserDecorateController {
  constructor(private readonly userDecorateService: UserDecorateService) {}

  @Get("discrete/getOpenAdvertising")
  @ApiOperation({ summary: "获取开屏广告" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiQuery({ name: "position", required: false, description: "广告位置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getOpenAdvertising(@Query() query: { platform?: string; position?: string }) {
    const platform = query.platform || "h5";
    const position = query.position || "open";
    return this.userDecorateService.getOpenAdvertising(platform, position);
  }

  @Get("discrete/getBanner")
  @ApiOperation({ summary: "获取轮播图" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiQuery({ name: "position", required: false, description: "轮播图位置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getBanner(@Query() query: { platform?: string; position?: string }) {
    const platform = query.platform || "h5";
    const position = query.position || "home";
    return this.userDecorateService.getBanner(platform, position);
  }

  @Get("discrete/getNavigation")
  @ApiOperation({ summary: "获取导航菜单" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiQuery({ name: "position", required: false, description: "导航位置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getNavigation(@Query() query: { platform?: string; position?: string }) {
    const platform = query.platform || "h5";
    const position = query.position || "bottom";
    return this.userDecorateService.getNavigation(platform, position);
  }

  @Get("discrete/getFloatAd")
  @ApiOperation({ summary: "获取浮动广告" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiQuery({ name: "position", required: false, description: "浮动广告位置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getFloatAd(@Query() query: { platform?: string; position?: string }) {
    const platform = query.platform || "h5";
    const position = query.position || "float";
    return this.userDecorateService.getFloatAd(platform, position);
  }

  @Get("discrete/getPopupAd")
  @ApiOperation({ summary: "获取弹窗广告" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiQuery({ name: "position", required: false, description: "弹窗位置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPopupAd(@Query() query: { platform?: string; position?: string }) {
    const platform = query.platform || "h5";
    const position = query.position || "popup";
    return this.userDecorateService.getPopupAd(platform, position);
  }

  @Get("discrete/getHomePage")
  @ApiOperation({ summary: "获取首页装修配置" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getHomePage(@Query() query: { platform?: string }) {
    const platform = query.platform || "h5";
    return this.userDecorateService.getHomePage(platform);
  }

  @Get("discrete/getCategoryPage")
  @ApiOperation({ summary: "获取分类页装修配置" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCategoryPage(@Query() query: { platform?: string }) {
    const platform = query.platform || "h5";
    return this.userDecorateService.getCategoryPage(platform);
  }

  @Get("discrete/getCartPage")
  @ApiOperation({ summary: "获取购物车页装修配置" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCartPage(@Query() query: { platform?: string }) {
    const platform = query.platform || "h5";
    return this.userDecorateService.getCartPage(platform);
  }

  @Get("discrete/getUserPage")
  @ApiOperation({ summary: "获取用户中心页装修配置" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserPage(@Query() query: { platform?: string }) {
    const platform = query.platform || "h5";
    return this.userDecorateService.getUserPage(platform);
  }

  @Get("discrete/getProductPage")
  @ApiOperation({ summary: "获取商品详情页装修配置" })
  @ApiQuery({ name: "platform", required: false, description: "平台类型：h5,app,mini" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getProductPage(@Query() query: { platform?: string }) {
    const platform = query.platform || "h5";
    return this.userDecorateService.getProductPage(platform);
  }

  @Post("discrete/trackAdClick")
  @ApiOperation({ summary: "跟踪广告点击" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "记录成功" })
  async trackAdClick(
    @Request() req,
    @Body() body: { adId: number; adType: string; position: string },
  ) {
    const userId = req.user.userId;
    return this.userDecorateService.trackAdClick(userId, body);
  }

  @Post("discrete/trackAdView")
  @ApiOperation({ summary: "跟踪广告曝光" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async trackAdView(@Body() body: { adId: number; adType: string; position: string }) {
    return this.userDecorateService.trackAdView(body);
  }
}