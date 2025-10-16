// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { GrouponService, GROUPON_STATUS_NAME } from "./groupon.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-ProductTeam")
@Controller("adminapi/promotion/productTeam")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminProductTeamCompatController {
  constructor(private readonly svc: GrouponService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "团购活动列表（兼容 /adminapi）" })
  async list(@Query() query: any) {
    const filter = {
      keyword: query.keyword || "",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      status:
        query.status === undefined || query.status === ""
          ? undefined
          : Number(query.status),
      sort_field: query.sortField || query.sort_field || "product_team_id",
      sort_order: query.sortOrder || query.sort_order || "desc",
    } as any;
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    return ResponseUtil.success({
      records,
      total,
      status_list: GROUPON_STATUS_NAME,
    });
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "团购活动配置（兼容 /adminapi）" })
  async config() {
    // PHP 无独立配置接口，这里返回状态枚举兼容前端
    return ResponseUtil.success({ status_config: GROUPON_STATUS_NAME });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "团购活动详情（兼容 /adminapi）" })
  async detail(@Query("id") id: number) {
    const item = await this.svc.getDetail(Number(id));
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建团购活动（兼容 /adminapi）" })
  async create(@Body() body: any) {
    const r = await this.svc.create(body);
    return ResponseUtil.success(r);
  }

  @Put("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新团购活动（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const id = Number(
      body.id || body.product_team_id || body.team_id || body.teamId,
    );
    const data = { ...body };
    delete (data as any).id;
    delete (data as any).team_id;
    delete (data as any).teamId;
    delete (data as any).product_team_id;
    const r = await this.svc.update(id, data);
    return ResponseUtil.success(r);
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除团购活动（兼容 /adminapi）" })
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
