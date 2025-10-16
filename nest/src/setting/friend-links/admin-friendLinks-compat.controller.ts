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
import { FriendLinksService } from "./friendLinks.service";

@ApiTags("Admin API - 友情链接(兼容路径)")
@Controller("adminapi/setting/friendLinks")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminFriendLinksCompatController {
  constructor(private readonly friendLinksService: FriendLinksService) {}

  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "友情链接列表（兼容）" })
  async list(@Query() query: any) {
    const result = await this.friendLinksService.findAll({
      keyword: query.keyword,
      page: Number(query.page) || 1,
      size: Number(query.size) || 15,
      status: query.status !== undefined ? Number(query.status) : undefined,
      sortField: query.sortField || "link_id",
      sortOrder: query.sortOrder || "desc",
    });
    return { code: 0, message: "success", data: result };
  }

  @Get("detail")
  @Authorities("setting")
  @ApiOperation({ summary: "友情链接详情（兼容）" })
  async detail(@Query("id") id: string) {
    const item = await this.friendLinksService.findById(Number(id));
    return { code: 0, message: "success", data: item };
  }

  @Get("config")
  @Authorities("setting")
  @ApiOperation({ summary: "友情链接配置（兼容）" })
  async config() {
    const cfg = await this.friendLinksService.getConfig();
    return { code: 0, message: "success", data: cfg };
  }

  @Post("create")
  @Authorities("setting")
  async create(@Body() body: any) {
    const created = await this.friendLinksService.create(body);
    return { code: 0, message: "success", data: created };
  }

  @Put("update")
  @Authorities("setting")
  async update(@Body() body: any) {
    const { id, ...rest } = body;
    const updated = await this.friendLinksService.update(Number(id), rest);
    return { code: 0, message: "success", data: updated };
  }

  @Delete("del")
  @Authorities("setting")
  async del(@Query("id") id: string) {
    await this.friendLinksService.delete(Number(id));
    return { code: 0, message: "success", data: true };
  }
}
