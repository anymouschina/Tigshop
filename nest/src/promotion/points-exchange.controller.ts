// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  PointsExchangeService,
  POINTS_EXCHANGE_ENABLED,
  POINTS_EXCHANGE_HOT,
} from "./points-exchange.service";
import {
  PointsExchangeQueryDto,
  PointsExchangeDetailDto,
  CreatePointsExchangeDto,
  UpdatePointsExchangeDto,
  UpdatePointsExchangeFieldDto,
  DeletePointsExchangeDto,
  BatchDeletePointsExchangeDto,
} from "./dto/points-exchange.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("积分商城管理")
@Controller("admin/points-exchange")
@UseGuards(RolesGuard)
@Roles("admin")
export class PointsExchangeController {
  constructor(private readonly pointsExchangeService: PointsExchangeService) {}

  @Get()
  @ApiOperation({ summary: "获取积分商品列表" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "is_enabled", required: false, description: "启用状态" })
  @ApiQuery({ name: "is_hot", required: false, description: "热门状态" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPointsExchangeList(@Query() query: PointsExchangeQueryDto) {
    const [records, total] = await Promise.all([
      this.pointsExchangeService.getFilterResult(query),
      this.pointsExchangeService.getFilterCount(query),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records,
        total,
        enabled_list: POINTS_EXCHANGE_ENABLED,
        hot_list: POINTS_EXCHANGE_HOT,
      },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "获取积分商品详情" })
  @ApiQuery({ name: "id", required: true, description: "积分商品ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getPointsExchangeDetail(@Query() query: PointsExchangeDetailDto) {
    const item = await this.pointsExchangeService.getDetail(query.id);

    return {
      code: 200,
      message: "获取成功",
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建积分商品" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createPointsExchange(@Body() createDto: CreatePointsExchangeDto) {
    const result = await this.pointsExchangeService.create(createDto);

    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: "更新积分商品" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updatePointsExchange(@Body() updateDto: UpdatePointsExchangeDto) {
    const result = await this.pointsExchangeService.update(
      updateDto.id,
      updateDto,
    );

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Put("field")
  @ApiOperation({ summary: "更新积分商品字段" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updatePointsExchangeField(
    @Body() updateDto: UpdatePointsExchangeFieldDto,
  ) {
    const result = await this.pointsExchangeService.updateField(
      updateDto.id,
      updateDto.field,
      updateDto.value,
    );

    if (result) {
      return {
        code: 200,
        message: "更新成功",
      };
    } else {
      return {
        code: 400,
        message: "更新失败",
      };
    }
  }

  @Delete()
  @ApiOperation({ summary: "删除积分商品" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deletePointsExchange(@Body() deleteDto: DeletePointsExchangeDto) {
    const result = await this.pointsExchangeService.delete(deleteDto.id);

    if (result) {
      return {
        code: 200,
        message: "删除成功",
      };
    } else {
      return {
        code: 400,
        message: "删除失败",
      };
    }
  }

  @Delete("batch")
  @ApiOperation({ summary: "批量删除积分商品" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeletePointsExchange(
    @Body() batchDto: BatchDeletePointsExchangeDto,
  ) {
    const result = await this.pointsExchangeService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: "删除成功",
      };
    } else {
      return {
        code: 400,
        message: "删除失败",
      };
    }
  }
}
