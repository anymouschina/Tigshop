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
import { ProductTeamService } from "./productTeam.service";
import {
  CreateProductTeamDto,
  UpdateProductTeamDto,
  ProductTeamQueryDto,
  ProductTeamConfigDto,
} from "./dto/productTeam.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("ProductTeam Management")
@Controller("promotion/product_team")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductTeamController {
  constructor(private readonly productTeamService: ProductTeamService) {}

  @Get("list")
  @Roles("productTeamManage")
  @ApiOperation({ summary: "获取团购活动列表" })
  async list(@Query() queryDto: ProductTeamQueryDto) {
    const result = await this.productTeamService.findAll(queryDto);
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
  @Roles("productTeamManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.productTeamService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Roles("productTeamManage")
  @ApiOperation({ summary: "获取团购活动详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.productTeamService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Roles("productTeamManage")
  @ApiOperation({ summary: "创建团购活动" })
  @ApiBody({ type: CreateProductTeamDto })
  async create(@Body() createDto: CreateProductTeamDto) {
    const item = await this.productTeamService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Roles("productTeamManage")
  @ApiOperation({ summary: "更新团购活动" })
  @ApiBody({ type: UpdateProductTeamDto })
  async update(@Body() updateDto: UpdateProductTeamDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.productTeamService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: item,
    };
  }

  @Delete("del")
  @Roles("productTeamManage")
  @ApiOperation({ summary: "删除团购活动" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.productTeamService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Roles("productTeamManage")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.productTeamService.batchDelete(body.ids);
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
