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
import { BargainService, BARGAIN_STATUS_NAME } from "./bargain.service";
import {
  BargainQueryDto,
  BargainDetailDto,
  CreateBargainDto,
  UpdateBargainDto,
  UpdateBargainFieldDto,
  DeleteBargainDto,
  BatchDeleteBargainDto,
} from "./dto/bargain.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("砍价活动管理")
@Controller("admin/bargain")
@UseGuards(RolesGuard)
@Roles("admin")
export class BargainController {
  constructor(private readonly bargainService: BargainService) {}

  @Get()
  @ApiOperation({ summary: "获取砍价活动列表" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "status", required: false, description: "状态" })
  @ApiQuery({ name: "shop_id", required: false, description: "店铺ID" })
  @ApiQuery({ name: "is_show", required: false, description: "是否显示" })
  @ApiQuery({ name: "add_time", required: false, description: "创建时间范围" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getBargainList(@Query() query: BargainQueryDto) {
    const filter = {
      ...query,
      shop_id: query.shop_id || 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.bargainService.getFilterResult(filter),
      this.bargainService.getFilterCount(filter),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records,
        total,
        status_list: BARGAIN_STATUS_NAME,
      },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "获取砍价活动详情" })
  @ApiQuery({ name: "id", required: true, description: "砍价活动ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getBargainDetail(@Query() query: BargainDetailDto) {
    const item = await this.bargainService.getDetail(query.id);

    return {
      code: 200,
      message: "获取成功",
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建砍价活动" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createBargain(@Body() createDto: CreateBargainDto) {
    const result = await this.bargainService.create(createDto);

    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: "更新砍价活动" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateBargain(@Body() updateDto: UpdateBargainDto) {
    const result = await this.bargainService.update(
      updateDto.bargain_id,
      updateDto,
    );

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Put("field")
  @ApiOperation({ summary: "更新砍价活动字段" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateBargainField(@Body() updateDto: UpdateBargainFieldDto) {
    const result = await this.bargainService.updateField(
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
  @ApiOperation({ summary: "删除砍价活动" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteBargain(@Body() deleteDto: DeleteBargainDto) {
    const result = await this.bargainService.delete(deleteDto.id);

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
  @ApiOperation({ summary: "批量删除砍价活动" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeleteBargain(@Body() batchDto: BatchDeleteBargainDto) {
    const result = await this.bargainService.batchDelete(batchDto.ids);

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
