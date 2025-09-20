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
import { ShareService } from "./share.service";
import {
  ShareProductDto,
  ShareOrderDto,
  ShareShopDto,
  GenerateShareDto,
  ShareStatsDto,
} from "./dto/share.dto";

@ApiTags("用户端分享功能")
@Controller("api/home/share")
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get("product")
  @ApiOperation({ summary: "生成商品分享链接" })
  @ApiQuery({ name: "product_id", required: true, description: "商品ID" })
  @ApiQuery({ name: "channel", required: false, description: "分享渠道" })
  @ApiResponse({ status: 200, description: "生成成功" })
  async shareProduct(@Query() query: ShareProductDto) {
    return this.shareService.generateProductShare(query);
  }

  @Get("order")
  @ApiOperation({ summary: "生成订单分享链接" })
  @ApiQuery({ name: "order_id", required: true, description: "订单ID" })
  @ApiQuery({ name: "channel", required: false, description: "分享渠道" })
  @ApiResponse({ status: 200, description: "生成成功" })
  async shareOrder(@Query() query: ShareOrderDto) {
    return this.shareService.generateOrderShare(query);
  }

  @Get("shop")
  @ApiOperation({ summary: "生成店铺分享链接" })
  @ApiQuery({ name: "shop_id", required: true, description: "店铺ID" })
  @ApiQuery({ name: "channel", required: false, description: "分享渠道" })
  @ApiResponse({ status: 200, description: "生成成功" })
  async shareShop(@Query() query: ShareShopDto) {
    return this.shareService.generateShopShare(query);
  }

  @Post("generate")
  @ApiOperation({ summary: "生成通用分享内容" })
  @ApiResponse({ status: 200, description: "生成成功" })
  async generateShare(@Body() body: GenerateShareDto) {
    return this.shareService.generateShareContent(body);
  }

  @Get("stats")
  @ApiOperation({ summary: "获取分享统计信息" })
  @ApiQuery({ name: "share_id", required: true, description: "分享ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getShareStats(@Query() query: ShareStatsDto) {
    return this.shareService.getShareStats(query.share_id);
  }

  @Get("myShares")
  @ApiOperation({ summary: "获取我的分享记录" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "type", required: false, description: "分享类型" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMyShares(
    @Request() req,
    @Query() query: { page?: number; size?: number; type?: string },
  ) {
    const userId = req.user.userId;
    return this.shareService.getUserShares(userId, query);
  }

  @Post("record")
  @ApiOperation({ summary: "记录分享行为" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async recordShare(@Body() body: { share_id: number; channel: string }) {
    return this.shareService.recordShareBehavior(body);
  }

  @Get("reward")
  @ApiOperation({ summary: "获取分享奖励信息" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "获取成功" })
  async getShareReward(@Request() req) {
    const userId = req.user.userId;
    return this.shareService.getShareReward(userId);
  }

  @Get("qrcode")
  @ApiOperation({ summary: "生成分享二维码" })
  @ApiQuery({ name: "url", required: true, description: "分享链接" })
  @ApiQuery({ name: "size", required: false, description: "二维码尺寸" })
  @ApiResponse({ status: 200, description: "生成成功" })
  async generateQRCode(@Query() query: { url: string; size?: number }) {
    return this.shareService.generateShareQRCode(query.url, query.size);
  }

  @Get("config")
  @ApiOperation({ summary: "获取分享配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getShareConfig() {
    return this.shareService.getShareConfig();
  }

  @Post("analyze")
  @ApiOperation({ summary: "分析分享效果" })
  @ApiQuery({ name: "share_id", required: true, description: "分享ID" })
  @ApiResponse({ status: 200, description: "分析成功" })
  async analyzeShare(@Query() query: { share_id: number }) {
    return this.shareService.analyzeShareEffect(query.share_id);
  }

  @Get("trending")
  @ApiOperation({ summary: "获取热门分享" })
  @ApiQuery({ name: "limit", required: false, description: "数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getTrendingShares(@Query() query: { limit?: number }) {
    const limit = query.limit || 10;
    return this.shareService.getTrendingShares(limit);
  }

  @Get("templates")
  @ApiOperation({ summary: "获取分享模板" })
  @ApiQuery({ name: "type", required: false, description: "模板类型" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getShareTemplates(@Query() query: { type?: string }) {
    return this.shareService.getShareTemplates(query.type);
  }
}
