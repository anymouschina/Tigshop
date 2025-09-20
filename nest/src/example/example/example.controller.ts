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
import { ExampleService } from "./example.service";
import {
  CreateExampleDto,
  UpdateExampleDto,
  QueryExampleDto,
} from "./dto/example.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("示例管理")
@Controller("admin/example/example")
@UseGuards(AdminAuthGuard)
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @ApiOperation({ summary: "示例列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryExampleDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.exampleService.getFilterList(filter);
    const total = await this.exampleService.getFilterCount(filter);

    return ResponseUtil.success({
      filter_result: filterResult,
      filter: filter,
      total: total,
    });
  }

  @ApiOperation({ summary: "配置信息" })
  @Get("config")
  async config() {
    return ResponseUtil.success({
      status_list: {
        1: "待审核",
        2: "已审核",
      },
      type_list: {
        1: "帮助文章",
        2: "资讯文章",
      },
    });
  }

  @ApiOperation({ summary: "示例详情" })
  @ApiParam({ name: "id", description: "示例ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const detail = await this.exampleService.getDetail(id);
    return ResponseUtil.success({
      item: detail,
    });
  }

  @ApiOperation({ summary: "创建示例" })
  @Post("create")
  async create(@Body() createData: CreateExampleDto) {
    const result = await this.exampleService.createExample(createData);
    if (result) {
      return ResponseUtil.success("示例模板添加成功");
    } else {
      return ResponseUtil.error("示例模板添加失败");
    }
  }

  @ApiOperation({ summary: "更新示例" })
  @Put("update/:id")
  async update(@Param("id") id: number, @Body() updateData: UpdateExampleDto) {
    const result = await this.exampleService.updateExample(id, updateData);
    if (result) {
      return ResponseUtil.success("示例模板更新成功");
    } else {
      return ResponseUtil.error("示例模板更新失败");
    }
  }

  @ApiOperation({ summary: "删除示例" })
  @ApiParam({ name: "id", description: "示例ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.exampleService.deleteExample(id);
    return ResponseUtil.success("指定项目已删除");
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
      await this.exampleService.batchDeleteExample(batchData.ids);
      return ResponseUtil.success("批量操作执行成功！");
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "示例统计" })
  @Get("statistics")
  async statistics() {
    const statistics = await this.exampleService.getExampleStatistics();
    return ResponseUtil.success(statistics);
  }
}
