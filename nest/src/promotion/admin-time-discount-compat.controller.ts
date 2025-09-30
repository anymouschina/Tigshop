// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { TimeDiscountService } from "./time-discount/timeDiscount.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-TimeDiscount")
@Controller("adminapi/promotion/timeDiscount")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminTimeDiscountCompatController {
  constructor(private readonly svc: TimeDiscountService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "时段折扣列表（兼容 /adminapi）" })
  async list(@Query() query: any) {
    const q = {
      keyword: query.keyword || "",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      status: query.status === undefined || query.status === "" ? undefined : Number(query.status),
      sortField: query.sortField || query.sort_field || "discount_id",
      sortOrder: query.sortOrder || query.sort_order || "desc",
    };
    const { records, total, page, size, totalPages } = await this.svc.findAll(q);
    return ResponseUtil.success({ records, total, page, size, totalPages });
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "时段折扣配置（兼容 /adminapi）" })
  async config() {
    const cfg = await this.svc.getConfig();
    return ResponseUtil.success({ status_config: cfg.statusConfig });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "时段折扣详情（兼容 /adminapi）" })
  async detail(@Query("id") id: number) {
    const item = await this.svc.findById(Number(id));
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建时段折扣（兼容 /adminapi）" })
  async create(@Body() body: any) {
    // 兼容 PHP：Name/StartTime/EndTime/Discount
    const payload = {
      name: body.name ?? body.Name,
      startTime: body.startTime ?? body.StartTime,
      endTime: body.endTime ?? body.EndTime,
      discount: Number(body.discount ?? body.Discount),
      status: Number(body.status ?? body.Status ?? 1),
    } as any;
    const r = await this.svc.create(payload);
    return ResponseUtil.success(r);
  }

  @Post("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新时段折扣（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const id = Number(body.id);
    const payload: any = {};
    if (body.name ?? body.Name) payload.name = body.name ?? body.Name;
    if (body.startTime ?? body.StartTime) payload.startTime = body.startTime ?? body.StartTime;
    if (body.endTime ?? body.EndTime) payload.endTime = body.endTime ?? body.EndTime;
    if (body.discount ?? body.Discount) payload.discount = Number(body.discount ?? body.Discount);
    if (body.status ?? body.Status) payload.status = Number(body.status ?? body.Status);
    const r = await this.svc.update(id, payload);
    return ResponseUtil.success(r);
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除时段折扣（兼容 /adminapi）" })
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
