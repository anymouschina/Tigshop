import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UserCouponService } from "./coupon.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import {
  UserCouponListDto,
  AvailableCouponListDto,
  ClaimCouponDto,
  DeleteCouponDto,
  CouponDetailDto,
  ValidateCouponDto,
  UseCouponDto,
  CouponListResponse,
  CouponResponse,
  CouponValidationResponse,
  SuccessResponse,
} from "./dto/coupon.dto";

@ApiTags("User Coupon Management")
@Controller("user/coupon")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserCouponController {
  constructor(private readonly userCouponService: UserCouponService) {}

  /**
   * 获取用户优惠券列表 - 对齐PHP版本 user/coupon/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取用户优惠券列表" })
  async getUserCouponList(
    @Request() req,
    @Query() userCouponListDto: UserCouponListDto,
  ): Promise<CouponListResponse> {
    return this.userCouponService.getUserCouponList(
      req.user.userId,
      userCouponListDto,
    );
  }

  /**
   * 获取可领取的优惠券列表 - 对齐PHP版本 user/coupon/getList
   */
  @Get("getList")
  @ApiOperation({ summary: "获取可领取的优惠券列表" })
  async getAvailableCouponList(
    @Query() availableCouponListDto: AvailableCouponListDto,
  ): Promise<CouponListResponse> {
    return this.userCouponService.getAvailableCouponList(
      availableCouponListDto,
    );
  }

  /**
   * 领取优惠券 - 对齐PHP版本 user/coupon/claim
   */
  @Post("claim")
  @ApiOperation({ summary: "领取优惠券" })
  async claimCoupon(
    @Request() req,
    @Body() claimCouponDto: ClaimCouponDto,
  ): Promise<SuccessResponse> {
    return this.userCouponService.claimCoupon(req.user.userId, claimCouponDto);
  }

  /**
   * 删除用户优惠券 - 对齐PHP版本 user/coupon/del
   */
  @Post("del")
  @ApiOperation({ summary: "删除用户优惠券" })
  async deleteUserCoupon(
    @Request() req,
    @Body() deleteCouponDto: DeleteCouponDto,
  ): Promise<SuccessResponse> {
    return this.userCouponService.deleteUserCoupon(
      req.user.userId,
      deleteCouponDto,
    );
  }

  /**
   * 获取优惠券详情 - 对齐PHP版本 user/coupon/detail
   */
  @Get("detail")
  @ApiOperation({ summary: "获取优惠券详情" })
  async getCouponDetail(
    @Request() req,
    @Query() couponDetailDto: CouponDetailDto,
  ): Promise<CouponResponse> {
    return this.userCouponService.getCouponDetail(
      req.user.userId,
      couponDetailDto,
    );
  }

  /**
   * 验证优惠券
   */
  @Post("validate")
  @ApiOperation({ summary: "验证优惠券" })
  async validateCoupon(
    @Request() req,
    @Body() validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResponse> {
    return this.userCouponService.validateCoupon(
      req.user.userId,
      validateCouponDto,
    );
  }

  /**
   * 使用优惠券
   */
  @Post("use")
  @ApiOperation({ summary: "使用优惠券" })
  async useCoupon(
    @Request() req,
    @Body() useCouponDto: UseCouponDto,
  ): Promise<SuccessResponse> {
    return this.userCouponService.useCoupon(req.user.userId, useCouponDto);
  }

  /**
   * 获取用户优惠券数量统计
   */
  @Get("count")
  @ApiOperation({ summary: "获取用户优惠券数量统计" })
  async getCouponCount(@Request() req): Promise<{
    available: number;
    used: number;
    expired: number;
    total: number;
  }> {
    return this.userCouponService.getCouponCount(req.user.userId);
  }

  /**
   * 获取可用优惠券列表
   */
  @Get("available")
  @ApiOperation({ summary: "获取可用优惠券列表" })
  async getAvailableCoupons(
    @Request() req,
    @Query("orderAmount") orderAmount: number,
  ): Promise<CouponListResponse> {
    // 这里需要根据订单金额获取可用的优惠券
    // 由于现有接口不直接支持，我们需要先获取用户优惠券然后过滤
    const userCoupons = await this.userCouponService.getUserCouponList(
      req.user.userId,
      {
        page: 1,
        size: 100,
        status: "available" as any,
      },
    );

    // 过滤出满足订单金额要求的优惠券
    const availableCoupons = userCoupons.records.filter(
      (coupon) => Number(coupon.min_order_amount) <= orderAmount,
    );

    return {
      records: availableCoupons,
      total: availableCoupons.length,
    };
  }

  /**
   * 获取已使用的优惠券列表
   */
  @Get("used")
  @ApiOperation({ summary: "获取已使用的优惠券列表" })
  async getUsedCoupons(
    @Request() req,
    @Query() userCouponListDto: UserCouponListDto,
  ): Promise<CouponListResponse> {
    const usedListDto = {
      ...userCouponListDto,
      status: "used" as any,
    };
    return this.userCouponService.getUserCouponList(
      req.user.userId,
      usedListDto,
    );
  }

  /**
   * 获取已过期的优惠券列表
   */
  @Get("expired")
  @ApiOperation({ summary: "获取已过期的优惠券列表" })
  async getExpiredCoupons(
    @Request() req,
    @Query() userCouponListDto: UserCouponListDto,
  ): Promise<CouponListResponse> {
    const expiredListDto = {
      ...userCouponListDto,
      status: "expired" as any,
    };
    return this.userCouponService.getUserCouponList(
      req.user.userId,
      expiredListDto,
    );
  }
}
