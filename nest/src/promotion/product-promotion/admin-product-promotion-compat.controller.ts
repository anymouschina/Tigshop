// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PanelService } from "src/panel/panel.service";
import { ProductPromotionService } from "./product-promotion.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-ProductPromotion")
@Controller("adminapi/promotion/productPromotion")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminProductPromotionCompatController {
  constructor(
    private readonly svc: ProductPromotionService,
    private readonly panel: PanelService,
  ) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "优惠活动列表（兼容 /adminapi）" })
  async list(@Query() query: any, @Req() req: any) {
    const userId = req?.user?.userId;
    const shopId = await this.panel.getUserShopId(Number(userId));
    const filter = {
      keyword: query.keyword || "",
      promotion_type: query.promotionType ?? query.promotion_type,
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      is_going: query.isGoing ?? query.is_going,
      sort_field: query.sortField || query.sort_field || "promotion_id",
      sort_order: query.sortOrder || query.sort_order || "desc",
      shop_id: shopId,
    };
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    return ResponseUtil.success({ records, total });
  }

  @Get("conflictList")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动冲突列表（兼容 /adminapi）" })
  async conflictList(@Query() query: any) {
    const filter = {
      start_time: query.startTime ?? query.start_time,
      end_time: query.endTime ?? query.end_time,
      promotion_type: query.promotionType ?? query.promotion_type,
      page: Number(query.page || 1),
      size: Number(query.size || 15),
    };
    const res = await this.svc.getConflictList(filter);
    return ResponseUtil.success({ records: res.list, total: res.total });
  }

  // 路由别名：与 PHP 一致 GET /adminapi/promotion/productPromotion/conflict
  @Get("conflict")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动冲突列表（别名）" })
  async conflict(@Query() query: any) {
    return this.conflictList(query);
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动配置（rank/status 字典）" })
  async config() {
    const [rankList, promotionStatus] = await Promise.all([
      this.svc.getUserRankList(),
      this.svc.getPromotionStatus(),
    ]);
    return ResponseUtil.success({ rankList, promotionStatus });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动详情（兼容 /adminapi）" })
  async detail(@Query("promotionId") id?: number, @Query("id") id2?: number) {
    const realId = Number(id ?? id2);
    const item = await this.svc.getDetail(realId);
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建活动（兼容 /adminapi）" })
  async create(@Body() body: any, @Req() req: any) {
    const userId = req?.user?.userId;
    const shopId = await this.panel.getUserShopId(Number(userId));
    const payload = { ...body, shop_id: shopId };
    const r = await this.svc.createProductPromotion(payload);
    return ResponseUtil.success(r);
  }

  @Post("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新活动（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const id = Number(body.promotionId || body.id);
    const data = { ...body };
    delete data.promotionId;
    delete data.id;
    const r = await this.svc.updateProductPromotion(id, data);
    return ResponseUtil.success(r);
  }

  @Post("updateField")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新单字段（兼容 /adminapi）" })
  async updateField(@Body() body: any) {
    const id = Number(body.promotionId || body.id);
    const { field, value } = body;
    await this.svc.updateProductPromotionField(id, { [field]: value });
    return ResponseUtil.success();
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除活动（兼容 /adminapi）" })
  async del(@Body("id") id: number) {
    await this.svc.deleteProductPromotion(Number(id));
    return ResponseUtil.success();
  }

  @Post("batch")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "批量操作（兼容 /adminapi）" })
  async batch(@Body() body: any) {
    const { type, ids } = body;
    if (!Array.isArray(ids) || ids.length === 0)
      return ResponseUtil.error("未选择项目");
    if (type === "del") {
      await this.svc.batchDeleteProductPromotion(ids.map(Number));
      return ResponseUtil.success();
    }
    return ResponseUtil.error("不支持的操作类型");
  }

  @Get("statistics")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动统计（兼容 /adminapi）" })
  async statistics() {
    const s = await this.svc.getPromotionStatistics();
    return ResponseUtil.success(s);
  }
}
