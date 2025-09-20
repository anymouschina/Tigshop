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
import { ECardService } from "./ecard.service";
import { CreateECardDto, UpdateECardDto, QueryECardDto } from "./dto/ecard.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("电子卡券管理")
@Controller("admin/product/ecard")
@UseGuards(AdminAuthGuard)
export class ECardController {
  constructor(private readonly eCardService: ECardService) {}

  @ApiOperation({ summary: "电子卡券列表" })
  @ApiQuery({ name: "group_id", description: "分组ID", required: false })
  @ApiQuery({ name: "is_use", description: "使用状态", required: false })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryECardDto) {
    const filter = {
      group_id: query.group_id || 0,
      is_use: query.is_use || -1,
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.eCardService.getFilterList(filter);
    const total = await this.eCardService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "电子卡券详情" })
  @ApiParam({ name: "id", description: "卡券ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.eCardService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建电子卡券" })
  @Post("create")
  async create(@Body() createData: CreateECardDto) {
    const result = await this.eCardService.createECard(createData);
    if (result) {
      return ResponseUtil.success("电子卡券创建成功");
    } else {
      return ResponseUtil.error("电子卡券创建失败");
    }
  }

  @ApiOperation({ summary: "更新电子卡券" })
  @Put("update/:id")
  async update(@Param("id") id: number, @Body() updateData: UpdateECardDto) {
    const result = await this.eCardService.updateECard(id, updateData);
    if (result) {
      return ResponseUtil.success("电子卡券更新成功");
    } else {
      return ResponseUtil.error("电子卡券更新失败");
    }
  }

  @ApiOperation({ summary: "删除电子卡券" })
  @ApiParam({ name: "id", description: "卡券ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.eCardService.deleteECard(id);
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
      await this.eCardService.batchDeleteECard(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "电子卡券统计" })
  @Get("statistics")
  async statistics() {
    const statistics = await this.eCardService.getECardStatistics();
    return ResponseUtil.success(statistics);
  }

  @ApiOperation({ summary: "导出电子卡券" })
  @Post("export")
  async export(@Body() exportData: any) {
    const result = await this.eCardService.exportECard(exportData);
    return ResponseUtil.success(result);
  }

  @ApiOperation({ summary: "导入电子卡券" })
  @Post("import")
  async import(@Body() importData: any) {
    const result = await this.eCardService.importECard(importData);
    return ResponseUtil.success(result);
  }
}
