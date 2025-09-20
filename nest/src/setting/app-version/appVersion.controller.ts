// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { AppVersionService } from "./appVersion.service";
import {
  CreateAppVersionDto,
  UpdateAppVersionDto,
  AppVersionQueryDto,
  AppVersionConfigDto,
} from "./dto/appVersion.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("AppVersion Management")
@Controller("setting/app_version")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get("list")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "获取应用版本列表" })
  async list(@Query() queryDto: AppVersionQueryDto) {
    const result = await this.appVersionService.findAll(queryDto);
    return {
      code: 200,
      msg: "获取成功",
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  @Get("config")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.appVersionService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "获取应用版本详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.appVersionService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "创建应用版本" })
  @ApiBody({ type: CreateAppVersionDto })
  async create(@Body() createDto: CreateAppVersionDto) {
    const item = await this.appVersionService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "更新应用版本" })
  @ApiBody({ type: UpdateAppVersionDto })
  async update(@Body() updateDto: UpdateAppVersionDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.appVersionService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: item,
    };
  }

  @Delete("del")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "删除应用版本" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.appVersionService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Roles("appVersionManage")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.appVersionService.batchDelete(body.ids);
      return {
        code: 200,
        msg: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        msg: "操作类型错误",
      };
    }
  }
}
