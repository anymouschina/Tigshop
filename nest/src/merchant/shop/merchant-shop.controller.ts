// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { MerchantShopService } from './merchant-shop.service';
import { AdminJwtAuthGuard } from '../../auth/guards/admin-jwt-auth.guard';

@ApiTags('Merchant API - 店铺管理')
@Controller('adminapi/merchant/shop')
@UseGuards(AdminJwtAuthGuard)
export class MerchantShopController {
  constructor(private readonly merchantShopService: MerchantShopService) {}

  /**
   * 获取商户店铺列表 - 对应PHP的myShop接口
   */
  @Get('myShop')
    @ApiOperation({ summary: '获取商户店铺列表' })
  async getMyShops(
    @Query() query: any,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.getMyShops(userId, query);
  }

  /**
   * 获取店铺详情
   */
  @Get('detail')
    @ApiOperation({ summary: '获取店铺详情' })
  async getShopDetail(
    @Query('shopId') shopId: number,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.getShopDetail(shopId, userId);
  }

  /**
   * 创建店铺 - 对应PHP的create接口
   */
  @Post('create')
    @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建店铺' })
  async createShop(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    shopData: any,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.createShop(userId, shopData);
  }

  /**
   * 选择店铺 - 对应PHP的choose接口
   */
  @Post('choose')
    @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '选择店铺' })
  async chooseShop(
    @Body() body: { shopId: number },
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.chooseShop(userId, body.shopId);
  }

  /**
   * 更新店铺设置 - 对应PHP的setting接口
   */
  @Post('setting')
    @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新店铺设置' })
  async updateShopSetting(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    shopData: any,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.updateShop(userId, shopData.shopId, shopData);
  }

  /**
   * 更新店铺信息 - 对应PHP的updateInfo接口
   */
  @Post('updateInfo')
    @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新店铺信息' })
  async updateShopInfo(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    shopData: any,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.updateShop(userId, shopData.shopId, shopData);
  }

  /**
   * 获取当前店铺详情 - 对应PHP的currentDetail接口
   */
  @Get('currentDetail')
    @ApiOperation({ summary: '获取当前店铺详情' })
  async getCurrentShopDetail(@Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.getCurrentShopDetail(userId);
  }

  /**
   * 获取商家设置 - 对应PHP的getVendorSetting接口
   */
  @Get('getVendorSetting')
    @ApiOperation({ summary: '获取商家设置' })
  async getVendorSetting(@Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.getVendorSetting(userId);
  }

  /**
   * 更新商家设置 - 对应PHP的updateVendorSetting接口
   */
  @Post('updateVendorSetting')
    @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新商家设置' })
  async updateVendorSetting(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    settingData: any,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    return this.merchantShopService.updateVendorSetting(userId, settingData);
  }
}