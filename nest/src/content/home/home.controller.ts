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
import { HomeService } from "./home.service";
import {
  CreateHomeDto,
  UpdateHomeDto,
  HomeQueryDto,
  HomeConfigDto,
} from "./dto/home.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("Home Management")
@Controller("content/home")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get("list")
  @Roles("homeManage")
  @ApiOperation({ summary: "获取首页列表" })
  async list(@Query() queryDto: HomeQueryDto) {
    const result = await this.homeService.findAll(queryDto);
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
  @Roles("homeManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.homeService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Roles("homeManage")
  @ApiOperation({ summary: "获取首页详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.homeService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Roles("homeManage")
  @ApiOperation({ summary: "创建首页" })
  @ApiBody({ type: CreateHomeDto })
  async create(@Body() createDto: CreateHomeDto) {
    const item = await this.homeService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Roles("homeManage")
  @ApiOperation({ summary: "更新首页" })
  @ApiBody({ type: UpdateHomeDto })
  async update(@Body() updateDto: UpdateHomeDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.homeService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: item,
    };
  }

  @Delete("del")
  @Roles("homeManage")
  @ApiOperation({ summary: "删除首页" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.homeService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Roles("homeManage")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.homeService.batchDelete(body.ids);
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
