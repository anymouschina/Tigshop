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
import { ECardGroupService } from "./ecard-group.service";
import {
  CreateECardGroupDto,
  UpdateECardGroupDto,
  QueryECardGroupDto,
} from "./dto/ecard-group.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("电子卡券分组管理")
@Controller("admin/product/ecard-group")
@UseGuards(AdminAuthGuard)
export class ECardGroupController {
  constructor(private readonly ecardgroupService: ECardGroupService) {}

  @ApiOperation({ summary: "电子卡券分组列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryECardGroupDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.ecardgroupService.getFilterList(filter);
    const total = await this.ecardgroupService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "电子卡券分组详情" })
  @ApiParam({ name: "id", description: "ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.ecardgroupService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建电子卡券分组" })
  @Post("create")
  async create(@Body() createData: CreateECardGroupDto) {
    const result = await this.ecardgroupService.createECardGroup(createData);
    if (result) {
      return ResponseUtil.success("电子卡券分组创建成功");
    } else {
      return ResponseUtil.error("电子卡券分组创建失败");
    }
  }

  @ApiOperation({ summary: "更新电子卡券分组" })
  @Put("update/:id")
  async update(
    @Param("id") id: number,
    @Body() updateData: UpdateECardGroupDto,
  ) {
    const result = await this.ecardgroupService.updateECardGroup(
      id,
      updateData,
    );
    if (result) {
      return ResponseUtil.success("电子卡券分组更新成功");
    } else {
      return ResponseUtil.error("电子卡券分组更新失败");
    }
  }

  @ApiOperation({ summary: "删除电子卡券分组" })
  @ApiParam({ name: "id", description: "ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.ecardgroupService.deleteECardGroup(id);
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
      await this.ecardgroupService.batchDeleteECardGroup(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "电子卡券分组统计" })
  @Get("statistics")
  async statistics() {
    const statistics = await this.ecardgroupService.getECardGroupStatistics();
    return ResponseUtil.success(statistics);
  }
}
