// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PanelService } from "src/panel/panel.service";
import {
  PointsExchangeService,
  POINTS_EXCHANGE_ENABLED,
  POINTS_EXCHANGE_HOT,
} from "./points-exchange.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-PointsExchange")
@Controller("adminapi/promotion/pointsExchange")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminPointsExchangeCompatController {
  constructor(
    private readonly svc: PointsExchangeService,
    private readonly panel: PanelService,
  ) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "积分兑换列表（兼容 /adminapi）" })
  async list(@Query() query: any, @Req() req: any) {
    // 注：points_exchange 无 shop_id 字段；若需按店铺过滤，应在服务层基于 product/shop 进行扩展
    const filter = {
      keyword: query.keyword || "",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sortField || query.sort_field || "id",
      sort_order: query.sortOrder || query.sort_order || "desc",
      is_enabled:
        query.is_enabled !== undefined && query.is_enabled !== ""
          ? Number(query.is_enabled)
          : undefined,
      is_hot:
        query.is_hot !== undefined && query.is_hot !== ""
          ? Number(query.is_hot)
          : undefined,
    };

    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);

    return ResponseUtil.success({
      records,
      total,
      enabledList: POINTS_EXCHANGE_ENABLED,
      hotList: POINTS_EXCHANGE_HOT,
    });
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "积分兑换配置（字典项）" })
  async config() {
    return ResponseUtil.success({
      enabledList: POINTS_EXCHANGE_ENABLED,
      hotList: POINTS_EXCHANGE_HOT,
    });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "积分兑换详情（兼容 /adminapi）" })
  async detail(
    @Query("id") id?: number,
    @Query("pointsExchangeId") id2?: number,
  ) {
    const realId = Number(id ?? id2);
    const item = await this.svc.getDetail(realId);
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建积分兑换（兼容 /adminapi）" })
  async create(@Body() body: any) {
    const r = await this.svc.create(body);
    return ResponseUtil.success(r);
  }

  @Post("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新积分兑换（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    const data = { ...body };
    delete data.id;
    const r = await this.svc.update(id, data);
    return ResponseUtil.success(r);
  }

  @Post("updateField")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新字段（兼容 /adminapi）" })
  async updateField(@Body() body: any) {
    const id = Number(body.id);
    const { field, value } = body;
    const r = await this.svc.updateField(id, field, value);
    return ResponseUtil.success(r);
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除积分兑换（兼容 /adminapi）" })
  async del(@Body("id") id: number) {
    await this.svc.delete(Number(id));
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
      await this.svc.batchDelete(ids.map(Number));
      return ResponseUtil.success();
    }
    return ResponseUtil.error("不支持的操作类型");
  }
}
