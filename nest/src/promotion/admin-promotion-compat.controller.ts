// @ts-nocheck
import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PanelService } from "src/panel/panel.service";
import { PromotionService } from "./promotion.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-Promotion")
@Controller("adminapi/promotion/promotion")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminPromotionCompatController {
  constructor(
    private readonly svc: PromotionService,
    private readonly panel: PanelService,
  ) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动列表（兼容 /adminapi）" })
  async list(@Query() query: any, @Req() req: any) {
    const userId = req?.user?.userId;
    const shopId = await this.panel.getUserShopId(Number(userId));
    const filter = {
      time_type: query.time_type ? Number(query.time_type) : 0,
      type: query.type || "",
      sort_field: query.sortField || query.sort_field || "promotion_id",
      sort_order: query.sortOrder || query.sort_order || "desc",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      shop_id: shopId,
      is_delete: 0,
      is_available: 1,
    };
    const [records, total] = await Promise.all([
      this.svc.getFilterList(filter, [], ["type_text", "time_text"]),
      this.svc.getFilterCount(filter),
    ]);
    return ResponseUtil.success({ records, total });
  }

  @Get("getPromotionCount")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "活动数量统计（兼容 /adminapi）" })
  async getPromotionCount(@Req() req: any) {
    const userId = req?.user?.userId;
    const shopId = await this.panel.getUserShopId(Number(userId));
    const base = { is_available: 1, is_delete: 0, shop_id: shopId };
    const [timeType1Count, timeType2Count, timeType3Count] = await Promise.all([
      this.svc.getFilterCount({ ...base, time_type: 1 }),
      this.svc.getFilterCount({ ...base, time_type: 2 }),
      this.svc.getFilterCount({ ...base, time_type: 3 }),
    ]);
    return ResponseUtil.success({ timeType1Count, timeType2Count, timeType3Count });
  }
}
