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
import { WechatLiveService } from "./wechat-live/wechatLive.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-WechatLive")
@Controller("adminapi/promotion/wechatLive")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminWechatLiveCompatController {
  constructor(private readonly svc: WechatLiveService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "微信直播列表（兼容 /adminapi）" })
  async list(@Query() query: any) {
    const q = {
      keyword: query.keyword || "",
      page: Number(query.page || 1),
      size: Number(query.size || 15),
      status:
        query.status === undefined || query.status === ""
          ? undefined
          : Number(query.status),
      sortField: query.sortField || query.sort_field || "live_id",
      sortOrder: query.sortOrder || query.sort_order || "desc",
    } as any;
    const { records, total, page, size, totalPages } =
      await this.svc.findAll(q);
    return ResponseUtil.success({ records, total, page, size, totalPages });
  }

  @Get("config")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "微信直播配置（兼容 /adminapi）" })
  async config() {
    const cfg = await this.svc.getConfig();
    return ResponseUtil.success({ status_config: cfg.statusConfig });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "微信直播详情（兼容 /adminapi）" })
  async detail(@Query("id") id: number) {
    const item = await this.svc.findById(Number(id));
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建微信直播（兼容 /adminapi）" })
  async create(@Body() body: any) {
    const r = await this.svc.create(body);
    return ResponseUtil.success(r);
  }

  @Put("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新微信直播（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const id = Number(body.id || body.live_id || body.liveId);
    const data = { ...body };
    delete (data as any).id;
    delete (data as any).live_id;
    delete (data as any).liveId;
    const r = await this.svc.update(id, data);
    return ResponseUtil.success(r);
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除微信直播（兼容 /adminapi）" })
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
