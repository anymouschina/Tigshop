import { Controller, Get, Post, Body, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UserCouponService } from "./coupon.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Public } from "src/auth/decorators/public.decorator";
import {
  UserCouponListDto,
  AvailableCouponListDto,
  ClaimCouponDto,
  DeleteCouponDto,
  CouponDetailDto,
  CouponListResponse,
  SuccessResponse,
  CouponResponse,
} from "./dto/coupon.dto";

@ApiTags("用户优惠券（API兼容）")
@Controller("api/user/coupon")
export class UserCouponApiCompatController {
  constructor(private readonly userCouponService: UserCouponService) {}

  // 对齐 PHP user/coupon/list 需要登录
  @Get("list")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户优惠券列表(兼容)" })
  async getUserCouponList(
    @Request() req,
    @Query() userCouponListDto: UserCouponListDto,
  ): Promise<CouponListResponse> {
    return this.userCouponService.getUserCouponList(req.user.userId, userCouponListDto);
  }

  // 对齐 PHP user/coupon/getList 为公开可领券列表
  @Get("getList")
  @Public()
  @ApiOperation({ summary: "获取可领取的优惠券列表(兼容)" })
  async getAvailableCouponList(
    @Query() availableCouponListDto: AvailableCouponListDto,
  ): Promise<CouponListResponse> {
    return this.userCouponService.getAvailableCouponList(availableCouponListDto);
  }

  // 领取需要登录
  @Post("claim")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "领取优惠券(兼容)" })
  async claimCoupon(
    @Request() req,
    @Body() claimCouponDto: ClaimCouponDto,
  ): Promise<SuccessResponse> {
    return this.userCouponService.claimCoupon(req.user.userId, claimCouponDto);
  }

  // 删除需要登录
  @Post("del")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "删除用户优惠券(兼容)" })
  async deleteUserCoupon(
    @Request() req,
    @Body() deleteCouponDto: DeleteCouponDto,
  ): Promise<SuccessResponse> {
    return this.userCouponService.deleteUserCoupon(req.user.userId, deleteCouponDto);
  }

  // 详情需要登录（按PHP路由中间件）
  @Get("detail")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取优惠券详情(兼容)" })
  async getCouponDetail(
    @Request() req,
    @Query() couponDetailDto: CouponDetailDto,
  ): Promise<CouponResponse> {
    return this.userCouponService.getCouponDetail(req.user.userId, couponDetailDto);
  }
}
