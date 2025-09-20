// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { TipsManageService } from "./tips-manage.service";
import {
  CreateTipsManageDto,
  UpdateTipsManageDto,
  QueryTipsManageDto,
} from "./dto/tips-manage.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("提示管理管理")
@Controller("admin/common/tips-manage")
@UseGuards(AdminAuthGuard)
export class TipsManageController {
  constructor(private readonly tipsmanageService: TipsManageService) {}

  @ApiOperation({ summary: "提示管理列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryTipsManageDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.tipsmanageService.getFilterList(filter);
    const total = await this.tipsmanageService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "提示管理详情" })
  @ApiParam({ name: "id", description: "ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.tipsmanageService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建提示管理" })
  @Post("create")
  async create(@Body() createData: CreateTipsManageDto) {
    const result = await this.tipsmanageService.createTipsManage(createData);
    if (result) {
      return ResponseUtil.success("提示管理创建成功");
    } else {
      return ResponseUtil.error("提示管理创建失败");
    }
  }

  @ApiOperation({ summary: "更新提示管理" })
  @Put("update/:id")
  async update(
    @Param("id") id: number,
    @Body() updateData: UpdateTipsManageDto,
  ) {
    const result = await this.tipsmanageService.updateTipsManage(
      id,
      updateData,
    );
    if (result) {
      return ResponseUtil.success("提示管理更新成功");
    } else {
      return ResponseUtil.error("提示管理更新失败");
    }
  }

  @ApiOperation({ summary: "删除提示管理" })
  @ApiParam({ name: "id", description: "ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.tipsmanageService.deleteTipsManage(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: "批量操作" })
  @Post("batch")
  async batch(@Body() batchData: any) {
    if (
      !batchData.ids ||
      !Array.isArray(batchData.ids) ||
      batchData.ids.length === 0
    ) {
      return ResponseUtil.error("未选择项目");
    }

    if (batchData.type === "del") {
      await this.tipsmanageService.batchDeleteTipsManage(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "提示管理统计" })
  @Get("statistics")
  async statistics() {
    const statistics = await this.tipsmanageService.getTipsManageStatistics();
    return ResponseUtil.success(statistics);
  }
}
