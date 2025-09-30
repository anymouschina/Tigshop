// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PanelService } from "src/panel/panel.service";
import { CouponService } from "./coupon.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-Coupon")
@Controller("adminapi/promotion/coupon")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminCouponCompatController {
  constructor(private readonly svc: CouponService, private readonly panel: PanelService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "优惠券列表（兼容 /adminapi）" })
  async list(@Query() query: any) {
    const shopId = await this.panel.getUserShopId();
    const filter = {
      keyword: query.keyword || "",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sortField || query.sort_field || "coupon_id",
      sort_order: query.sortOrder || query.sort_order || "desc",
      shop_id: shopId,
    };
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    return ResponseUtil.success({ records, total });
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "优惠券配置（用户等级）" })
  async config() {
    const rankList = await this.svc.getUserRankList();
    return ResponseUtil.success(rankList);
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "优惠券详情（兼容 /adminapi）" })
  async detail(@Query("couponId") id?: number, @Query("id") id2?: number) {
    const realId = Number(id ?? id2);
    const item = await this.svc.getDetail(realId);
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建优惠券（兼容 /adminapi）" })
  async create(@Body() body: any) {
    const shopId = await this.panel.getUserShopId();
    const payload = { ...body, shop_id: shopId };
    const r = await this.svc.createCoupon(payload);
    return ResponseUtil.success(r);
  }

  @Post("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新优惠券（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const id = Number(body.couponId || body.id);
    const data = { ...body };
    delete data.couponId;
    delete data.id;
    const r = await this.svc.updateCoupon(id, data);
    return ResponseUtil.success(r);
  }

  @Post("updateField")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新优惠券字段（兼容 /adminapi）" })
  async updateField(@Body() body: any) {
    const id = Number(body.couponId || body.id);
    const { field, value } = body;
    const r = await this.svc.updateCouponField(id, field, value);
    return ResponseUtil.success(r);
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除优惠券（兼容 /adminapi）" })
  async del(@Body("id") id: number) {
    await this.svc.deleteCoupon(Number(id));
    return ResponseUtil.success();
  }

  @Post("batch")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "批量操作（兼容 /adminapi）" })
  async batch(@Body() body: any) {
    const { type, ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) return ResponseUtil.error("未选择项目");
    if (type === "del") {
      await this.svc.batchDelete(ids.map(Number));
      return ResponseUtil.success();
    }
    return ResponseUtil.error("不支持的操作类型");
  }
}
