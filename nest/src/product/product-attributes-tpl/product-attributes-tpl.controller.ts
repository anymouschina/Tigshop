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
import { ProductAttributesTplService } from "./product-attributes-tpl.service";
import {
  CreateProductAttributesTplDto,
  UpdateProductAttributesTplDto,
  QueryProductAttributesTplDto,
} from "./dto/product-attributes-tpl.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("产品属性模板管理")
@Controller("admin/product/product-attributes-tpl")
@UseGuards(AdminAuthGuard)
export class ProductAttributesTplController {
  constructor(
    private readonly productattributestplService: ProductAttributesTplService,
  ) {}

  @ApiOperation({ summary: "产品属性模板列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryProductAttributesTplDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult =
      await this.productattributestplService.getFilterList(filter);
    const total = await this.productattributestplService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "产品属性模板详情" })
  @ApiParam({ name: "id", description: "ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.productattributestplService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建产品属性模板" })
  @Post("create")
  async create(@Body() createData: CreateProductAttributesTplDto) {
    const result =
      await this.productattributestplService.createProductAttributesTpl(
        createData,
      );
    if (result) {
      return ResponseUtil.success("产品属性模板创建成功");
    } else {
      return ResponseUtil.error("产品属性模板创建失败");
    }
  }

  @ApiOperation({ summary: "更新产品属性模板" })
  @Put("update/:id")
  async update(
    @Param("id") id: number,
    @Body() updateData: UpdateProductAttributesTplDto,
  ) {
    const result =
      await this.productattributestplService.updateProductAttributesTpl(
        id,
        updateData,
      );
    if (result) {
      return ResponseUtil.success("产品属性模板更新成功");
    } else {
      return ResponseUtil.error("产品属性模板更新失败");
    }
  }

  @ApiOperation({ summary: "删除产品属性模板" })
  @ApiParam({ name: "id", description: "ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.productattributestplService.deleteProductAttributesTpl(id);
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
      await this.productattributestplService.batchDeleteProductAttributesTpl(
        batchData.ids,
      );
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "产品属性模板统计" })
  @Get("statistics")
  async statistics() {
    const statistics =
      await this.productattributestplService.getProductAttributesTplStatistics();
    return ResponseUtil.success(statistics);
  }
}
