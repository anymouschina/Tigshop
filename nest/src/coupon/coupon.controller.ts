import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  UseCouponDto,
  GetUserCouponsDto,
  ValidateCouponDto,
} from './dto/coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Coupon Management')
@Controller('coupon')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * 创建优惠券 - 对齐PHP版本 coupon/create
   */
  @Post('create')
  @ApiOperation({ summary: '创建优惠券' })
  async createCoupon(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.createCoupon(createCouponDto);
  }

  /**
   * 获取优惠券列表 - 对齐PHP版本 coupon/list
   */
  @Get('list')
  @ApiOperation({ summary: '获取优惠券列表' })
  async getCouponList(@Query() query: any) {
    return this.couponService.getCouponList(query);
  }

  /**
   * 获取用户优惠券列表 - 对齐PHP版本 coupon/user/list
   */
  @Get('user/list')
  @ApiOperation({ summary: '获取用户优惠券列表' })
  async getUserCoupons(@Request() req, @Query() query: GetUserCouponsDto) {
    return this.couponService.getUserCoupons(req.user.userId, query);
  }

  /**
   * 获取优惠券详情 - 对齐PHP版本 coupon/detail
   */
  @Get('detail/:couponId')
  @ApiOperation({ summary: '获取优惠券详情' })
  async getCouponDetail(@Param('couponId') couponId: number) {
    return this.couponService.getCouponDetail(Number(couponId));
  }

  /**
   * 更新优惠券 - 对齐PHP版本 coupon/update
   */
  @Put('update/:couponId')
  @ApiOperation({ summary: '更新优惠券' })
  async updateCoupon(
    @Param('couponId') couponId: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponService.updateCoupon(Number(couponId), updateCouponDto);
  }

  /**
   * 删除优惠券 - 对齐PHP版本 coupon/delete
   */
  @Delete('delete/:couponId')
  @ApiOperation({ summary: '删除优惠券' })
  async deleteCoupon(@Param('couponId') couponId: number) {
    return this.couponService.deleteCoupon(Number(couponId));
  }

  /**
   * 领取优惠券 - 对齐PHP版本 coupon/receive
   */
  @Post('receive/:couponId')
  @ApiOperation({ summary: '领取优惠券' })
  async receiveCoupon(@Request() req, @Param('couponId') couponId: number) {
    return this.couponService.receiveCoupon(req.user.userId, Number(couponId));
  }

  /**
   * 验证优惠券 - 对齐PHP版本 coupon/validate
   */
  @Post('validate')
  @ApiOperation({ summary: '验证优惠券' })
  async validateCoupon(@Request() req, @Body() validateCouponDto: ValidateCouponDto) {
    return this.couponService.validateCoupon(req.user.userId, validateCouponDto);
  }

  /**
   * 使用优惠券 - 对齐PHP版本 coupon/use
   */
  @Post('use')
  @ApiOperation({ summary: '使用优惠券' })
  async useCoupon(@Request() req, @Body() useCouponDto: UseCouponDto) {
    return this.couponService.useCoupon(req.user.userId, useCouponDto);
  }

  /**
   * 获取可用优惠券列表 - 对齐PHP版本 coupon/available
   */
  @Get('available')
  @ApiOperation({ summary: '获取可用优惠券列表' })
  async getAvailableCoupons(
    @Request() req,
    @Query('orderAmount') orderAmount: number,
  ) {
    return this.couponService.getAvailableCoupons(
      req.user.userId,
      Number(orderAmount),
    );
  }

  /**
   * 获取优惠券折扣金额 - 对齐PHP版本 cart/cart/getCouponDiscount
   */
  @Post('getCouponDiscount')
  @ApiOperation({ summary: '获取优惠券折扣金额' })
  async getCouponDiscount(@Request() req, @Body() data: { code: string; orderAmount: number }) {
    const validation = await this.couponService.validateCoupon(req.user.userId, {
      code: data.code,
      orderAmount: data.orderAmount,
    });

    return {
      isValid: validation.isValid,
      discountAmount: validation.discountAmount,
      message: validation.message,
    };
  }
}