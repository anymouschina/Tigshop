// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PanelService } from "src/panel/panel.service";
import { SeckillService, SECKILL_STATUS_NAME } from "./seckill.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-Seckill")
@Controller("adminapi/promotion/seckill")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminSeckillCompatController {
  constructor(private readonly svc: SeckillService, private readonly panel: PanelService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "秒杀活动列表（兼容 /adminapi）" })
  async list(@Query() query: any, @Req() req: any) {
    const userId = req?.user?.userId;
    const shopId = await this.panel.getUserShopId(Number(userId));
    const filter = {
      keyword: query.keyword || "",
      status: query.status === undefined || query.status === "" ? undefined : Number(query.status),
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      sort_field: query.sortField || query.sort_field || "seckill_id",
      sort_order: query.sortOrder || query.sort_order || "desc",
      shop_id: shopId,
    };
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    return ResponseUtil.success({ records, total, status_list: SECKILL_STATUS_NAME });
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "秒杀配置（状态枚举）" })
  async config() {
    return ResponseUtil.success({ status_list: SECKILL_STATUS_NAME });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "秒杀活动详情（兼容 /adminapi）" })
  async detail(@Query("id") id: number) {
    const item = await this.svc.getDetail(Number(id));
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建秒杀活动（兼容 /adminapi）" })
  async create(@Body() body: any, @Req() req: any) {
    const userId = req?.user?.userId;
    const shopId = await this.panel.getUserShopId(Number(userId));
    const toTs = (v: any) => {
      if (typeof v === "number") return v;
      if (typeof v === "string" && v) {
        const t = Date.parse(v.replace(/-/g, "/"));
        return Number.isNaN(t) ? 0 : Math.floor(t / 1000);
      }
      return 0;
    };
    const payload: any = {
      seckill_name: body.seckill_name ?? body.seckillName,
      seckill_remark: body.seckill_remark ?? body.seckillRemark ?? "",
      start_time: toTs(body.start_time ?? body.startTime),
      end_time: toTs(body.end_time ?? body.endTime),
      sort: Number(body.sort ?? 0),
      shop_id: shopId,
      items: body.items,
    };
    const r = await this.svc.create(payload);
    return ResponseUtil.success(r);
  }

  @Post("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新秒杀活动（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const toTs = (v: any) => {
      if (v == null) return undefined;
      if (typeof v === "number") return v;
      if (typeof v === "string" && v) {
        const t = Date.parse(v.replace(/-/g, "/"));
        return Number.isNaN(t) ? undefined : Math.floor(t / 1000);
      }
      return undefined;
    };
    const id = Number(body.seckill_id || body.seckillId || body.id);
    const data: any = { ...body };
    delete data.seckill_id; delete data.seckillId; delete data.id;
    if (data.start_time == null && data.startTime != null) data.start_time = toTs(data.startTime);
    if (data.end_time == null && data.endTime != null) data.end_time = toTs(data.endTime);
    const r = await this.svc.update(id, data);
    return ResponseUtil.success(r);
  }

  @Post("updateField")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新秒杀字段（兼容 /adminapi）" })
  async updateField(@Body() body: any) {
    const id = Number(body.seckill_id || body.seckillId || body.id);
    const field = body.field;
    const value = body.value ?? body.val;
    const ok = await this.svc.updateField(id, field, value);
    return ok ? ResponseUtil.success() : ResponseUtil.error("更新失败");
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除秒杀活动（兼容 /adminapi）" })
  async del(@Body("id") id: number) {
    await this.svc.delete(Number(id));
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
