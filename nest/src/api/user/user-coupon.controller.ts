// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Request,
  UseGuards,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserCouponService } from "./user-coupon.service";
import { CouponQueryDto, ReceiveCouponDto } from "./dto/user-coupon.dto";

@ApiTags("用户端优惠券")
@Controller("api/user/coupon")
export class UserCouponController {
  constructor(private readonly userCouponService: UserCouponService) {}

  @Get("list")
  @ApiOperation({ summary: "获取用户优惠券列表" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "size", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "coupon_type", required: false })
  @ApiQuery({ name: "keyword", required: false })
  @ApiQuery({ name: "sort_field", required: false })
  @ApiQuery({ name: "sort_order", required: false })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserCouponList(@Request() req, @Query() queryDto: CouponQueryDto) {
    const userId = req.user.userId;
    const data = await this.userCouponService.getUserCouponList(
      userId,
      queryDto,
    );
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("available")
  @ApiOperation({ summary: "获取可用优惠券列表" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "product_id", required: false })
  @ApiQuery({ name: "category_id", required: false })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAvailableCouponList(
    @Request() req,
    @Query("product_id") productId?: number,
    @Query("category_id") categoryId?: number,
  ) {
    const userId = req.user.userId;
    const data = await this.userCouponService.getAvailableCouponList(
      userId,
      productId,
      categoryId,
    );
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Post("receive")
  @ApiOperation({ summary: "领取优惠券" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "领取成功" })
  async receiveCoupon(@Request() req, @Body() receiveDto: ReceiveCouponDto) {
    const userId = req.user.userId;
    const data = await this.userCouponService.receiveCoupon(userId, receiveDto);
    return {
      code: 200,
      message: "领取成功",
      data,
    };
  }

  @Get("detail/:userCouponId")
  @ApiOperation({ summary: "获取优惠券详情" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "userCouponId", description: "用户优惠券ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCouponDetail(
    @Request() req,
    @Param("userCouponId") userCouponId: number,
  ) {
    const userId = req.user.userId;
    const data = await this.userCouponService.getCouponDetail(
      userId,
      userCouponId,
    );
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Post("use/:userCouponId")
  @ApiOperation({ summary: "使用优惠券" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "userCouponId", description: "用户优惠券ID" })
  @ApiResponse({ status: 200, description: "使用成功" })
  async useCoupon(
    @Request() req,
    @Param("userCouponId") userCouponId: number,
    @Body("order_id") orderId: number,
  ) {
    const userId = req.user.userId;
    const data = await this.userCouponService.useCoupon(
      userId,
      userCouponId,
      orderId,
    );
    return {
      code: 200,
      message: "使用成功",
      data,
    };
  }

  @Get("availableCoupons")
  @ApiOperation({ summary: "获取可领取的优惠券" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAvailableCoupons(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userCouponService.getAvailableCoupons(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("statistics")
  @ApiOperation({ summary: "获取用户优惠券统计" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserCouponStatistics(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userCouponService.getUserCouponStatistics(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("calculateDiscount")
  @ApiOperation({ summary: "计算优惠券折扣金额" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "coupon_id", required: true })
  @ApiQuery({ name: "order_amount", required: true })
  @ApiResponse({ status: 200, description: "计算成功" })
  async calculateCouponDiscount(
    @Request() req,
    @Query("coupon_id") couponId: number,
    @Query("order_amount") orderAmount: number,
  ) {
    const userId = req.user.userId;
    const data = await this.userCouponService.calculateCouponDiscount(
      userId,
      couponId,
      orderAmount,
    );
    return {
      code: 200,
      message: "计算成功",
      data,
    };
  }
}
