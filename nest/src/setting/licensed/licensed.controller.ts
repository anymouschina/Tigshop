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
import { LicensedService } from "./licensed.service";
import {
  CreateLicensedDto,
  UpdateLicensedDto,
  LicensedQueryDto,
  LicensedConfigDto,
} from "./dto/licensed.dto";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "../../auth/guards/authority.guard";
import { Authorities } from "../../auth/decorators/authority.decorator";

@ApiTags("Admin API - 授权管理")
@Controller("adminapi/setting/licensed")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class LicensedController {
  constructor(private readonly licensedService: LicensedService) {}

  @Get("index")
  @Authorities("adminapi/setting/licensed/index")
  @ApiOperation({ summary: "获取授权列表" })
  async index(@Query() queryDto: LicensedQueryDto) {
    const config = await this.licensedService.getConfig();
    return {
      code: 0,
      message: "success",
      data: config,
    };
  }

  @Get("list")
  @Authorities("adminapi/setting/licensed/list")
  @ApiOperation({ summary: "获取授权列表" })
  async list(@Query() queryDto: LicensedQueryDto) {
    const result = await this.licensedService.findAll(queryDto);
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
  @Authorities("adminapi/setting/licensed/config")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.licensedService.getStatusConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Authorities("adminapi/setting/licensed/detail")
  @ApiOperation({ summary: "获取授权详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.licensedService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Authorities("adminapi/setting/licensed/create")
  @ApiOperation({ summary: "创建授权" })
  @ApiBody({ type: CreateLicensedDto })
  async create(@Body() createDto: CreateLicensedDto) {
    const item = await this.licensedService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Authorities("adminapi/setting/licensed/update")
  @ApiOperation({ summary: "更新授权" })
  @ApiBody({ type: UpdateLicensedDto })
  async update(@Body() updateDto: UpdateLicensedDto & { id: number }) {
    const { id, ...data } = updateDto;
    const realId = Number.isFinite(Number(id)) ? Number(id) : 1;

    const item = await this.licensedService.update(realId, data);
    return { code: 0, message: "success" };
  }

  // 兼容老前端：使用 POST 调用 update
  @Post("update")
  @Authorities("adminapi/setting/licensed/update")
  @ApiOperation({ summary: "更新授权（兼容 POST）" })
  @ApiBody({ type: UpdateLicensedDto })
  async updateCompat(@Body() updateDto: UpdateLicensedDto & { id: number }) {
    const { id, ...data } = updateDto;
    const realId = Number.isFinite(Number(id)) ? Number(id) : 1;

    const item = await this.licensedService.update(realId, data);
    return { code: 0, message: "success" };
  }

  @Delete("del")
  @Authorities("adminapi/setting/licensed/del")
  @ApiOperation({ summary: "删除授权" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.licensedService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Authorities("adminapi/setting/licensed/batch")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.licensedService.batchDelete(body.ids);
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
