// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AppVersionService } from "./appVersion.service";

@ApiTags("Admin API - App版本(兼容路径)")
@Controller("adminapi/setting/appVersion")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminAppVersionCompatController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "App版本列表（兼容）" })
  async list(@Query() query: any) {
    const result = await this.appVersionService.findAll({
      keyword: query.keyword,
      page: Number(query.page) || 1,
      size: Number(query.size) || 15,
      status: query.status !== undefined ? Number(query.status) : undefined,
      sortField: query.sortField || "version_id",
      sortOrder: query.sortOrder || "desc",
    });
    return { code: 0, message: "success", data: result };
  }

  @Get("detail")
  @Authorities("setting")
  @ApiOperation({ summary: "App版本详情（兼容）" })
  async detail(@Query("id") id: string) {
    const item = await this.appVersionService.findById(Number(id));
    return { code: 0, message: "success", data: item };
  }

  @Get("config")
  @Authorities("setting")
  @ApiOperation({ summary: "App版本配置（兼容）" })
  async config() {
    const cfg = await this.appVersionService.getConfig();
    return { code: 0, message: "success", data: cfg };
  }

  @Post("create")
  @Authorities("setting")
  async create(@Body() body: any) {
    const created = await this.appVersionService.create(body);
    return { code: 0, message: "success", data: created };
  }

  @Put("update")
  @Authorities("setting")
  async update(@Body() body: any) {
    const { id, ...rest } = body;
    const updated = await this.appVersionService.update(Number(id), rest);
    return { code: 0, message: "success", data: updated };
  }

  @Delete("del")
  @Authorities("setting")
  async del(@Query("id") id: string) {
    await this.appVersionService.delete(Number(id));
    return { code: 0, message: "success", data: true };
  }
}
