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
import { SignInService } from "./sign-in.service";
import { ResponseUtil } from "src/common/utils/response.util";

@ApiTags("AdminAPI-SignIn")
@Controller("adminapi/promotion/signIn")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminSignInCompatController {
  constructor(private readonly svc: SignInService) {}

  @Get("list")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "签到设置列表（兼容 /adminapi）" })
  async list(@Query() query: any) {
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(query),
      this.svc.getFilterCount(query),
    ]);
    return ResponseUtil.success({ records, total });
  }

  @Get("detail")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "签到设置详情（兼容 /adminapi）" })
  async detail(@Query("id") id: number) {
    const item = await this.svc.getDetail(Number(id));
    return ResponseUtil.success(item);
  }

  @Post("create")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "创建签到设置（兼容 /adminapi）" })
  async create(@Body() body: any) {
    const r = await this.svc.create(body);
    return ResponseUtil.success(r);
  }

  @Put("update")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "更新签到设置（兼容 /adminapi）" })
  async update(@Body() body: any) {
    const r = await this.svc.update(Number(body.id), body);
    return ResponseUtil.success(r);
  }

  @Post("del")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "删除签到设置（兼容 /adminapi）" })
  async del(@Body("id") id: number) {
    const ok = await this.svc.delete(Number(id));
    return ok ? ResponseUtil.success() : ResponseUtil.error("删除失败");
  }

  @Post("batch")
  @Authorities("promotionManage")
  @ApiOperation({ summary: "批量删除签到设置（兼容 /adminapi）" })
  async batch(@Body() body: any) {
    const { type, ids } = body;
    if (!Array.isArray(ids) || ids.length === 0)
      return ResponseUtil.error("未选择项目");
    if (type === "del") {
      const ok = await this.svc.batchDelete(ids.map(Number));
      return ok ? ResponseUtil.success() : ResponseUtil.error("删除失败");
    }
    return ResponseUtil.error("不支持的操作类型");
  }
}
