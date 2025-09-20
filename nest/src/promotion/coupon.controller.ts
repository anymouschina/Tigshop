// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CouponService } from "./coupon.service";
import {
  CreateCouponDto,
  UpdateCouponDto,
  CouponQueryDto,
  CouponUpdateFieldDto,
  CouponBatchDto,
} from "./dto/coupon.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";

@ApiTags("优惠券管理")
@Controller("admin/coupon")
@UseGuards(RolesGuard)
@Roles("admin")
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  @ApiOperation({ summary: "获取优惠券列表" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCouponList(@Query() query: CouponQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.couponService.getFilterResult(filter),
      this.couponService.getFilterCount(filter),
    ]);

    // 处理时间文本
    const processedRecords = records.map((record) => ({
      ...record,
      timeText: this.getTimeText(record),
    }));

    return {
      code: 200,
      message: "获取成功",
      data: {
        records: processedRecords,
        total,
      },
    };
  }

  @Get("config")
  @ApiOperation({ summary: "获取优惠券配置信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getConfig() {
    const rankList = await this.couponService.getUserRankList();
    return {
      code: 200,
      message: "获取成功",
      data: rankList,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "获取优惠券详情" })
  @ApiParam({ name: "id", description: "优惠券ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCouponDetail(@Param("id") id: number) {
    const coupon = await this.couponService.getDetail(id);
    return {
      code: 200,
      message: "获取成功",
      data: coupon,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建优惠券" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createCoupon(@Body() createCouponDto: CreateCouponDto) {
    const result = await this.couponService.createCoupon(createCouponDto);
    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put(":id")
  @ApiOperation({ summary: "更新优惠券" })
  @ApiParam({ name: "id", description: "优惠券ID" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateCoupon(
    @Param("id") id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const result = await this.couponService.updateCoupon(id, updateCouponDto);
    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Put(":id/field")
  @ApiOperation({ summary: "更新优惠券单个字段" })
  @ApiParam({ name: "id", description: "优惠券ID" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateCouponField(
    @Param("id") id: number,
    @Body() updateFieldDto: CouponUpdateFieldDto,
  ) {
    const result = await this.couponService.updateCouponField(
      id,
      updateFieldDto.field,
      updateFieldDto.value,
    );
    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除优惠券" })
  @ApiParam({ name: "id", description: "优惠券ID" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteCoupon(@Param("id") id: number) {
    await this.couponService.deleteCoupon(id);
    return {
      code: 200,
      message: "删除成功",
    };
  }

  @Post("batch")
  @ApiOperation({ summary: "批量操作优惠券" })
  @ApiResponse({ status: 200, description: "操作成功" })
  async batchOperation(@Body() batchDto: CouponBatchDto) {
    if (batchDto.type === "del") {
      await this.couponService.batchDelete(batchDto.ids);
      return {
        code: 200,
        message: "批量删除成功",
      };
    }
    return {
      code: 400,
      message: "不支持的操作类型",
    };
  }

  private getTimeText(coupon: any): string {
    if (!coupon.use_start_date && !coupon.use_end_date) {
      return "长期有效";
    }
    return `${coupon.use_start_date} 至 ${coupon.use_end_date}`;
  }
}
