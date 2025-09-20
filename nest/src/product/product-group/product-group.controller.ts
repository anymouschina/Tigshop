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
import { ProductGroupService } from "./product-group.service";
import {
  CreateProductGroupDto,
  UpdateProductGroupDto,
  QueryProductGroupDto,
} from "./dto/product-group.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("产品分组管理")
@Controller("admin/product/product-group")
@UseGuards(AdminAuthGuard)
export class ProductGroupController {
  constructor(private readonly productgroupService: ProductGroupService) {}

  @ApiOperation({ summary: "产品分组列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryProductGroupDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.productgroupService.getFilterList(filter);
    const total = await this.productgroupService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "产品分组详情" })
  @ApiParam({ name: "id", description: "ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.productgroupService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建产品分组" })
  @Post("create")
  async create(@Body() createData: CreateProductGroupDto) {
    const result =
      await this.productgroupService.createProductGroup(createData);
    if (result) {
      return ResponseUtil.success("产品分组创建成功");
    } else {
      return ResponseUtil.error("产品分组创建失败");
    }
  }

  @ApiOperation({ summary: "更新产品分组" })
  @Put("update/:id")
  async update(
    @Param("id") id: number,
    @Body() updateData: UpdateProductGroupDto,
  ) {
    const result = await this.productgroupService.updateProductGroup(
      id,
      updateData,
    );
    if (result) {
      return ResponseUtil.success("产品分组更新成功");
    } else {
      return ResponseUtil.error("产品分组更新失败");
    }
  }

  @ApiOperation({ summary: "删除产品分组" })
  @ApiParam({ name: "id", description: "ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.productgroupService.deleteProductGroup(id);
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
      await this.productgroupService.batchDeleteProductGroup(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "产品分组统计" })
  @Get("statistics")
  async statistics() {
    const statistics =
      await this.productgroupService.getProductGroupStatistics();
    return ResponseUtil.success(statistics);
  }
}
