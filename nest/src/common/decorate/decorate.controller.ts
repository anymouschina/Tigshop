// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { DecorateService } from "./decorate.service";
import {
  DecorateQueryDto,
  DecorateDetailDto,
  CreateDecorateDto,
  UpdateDecorateDto,
  DeleteDecorateDto,
  BatchDeleteDecorateDto,
  DECORATE_TYPE,
  DECORATE_STATUS,
  DECORATE_PLATFORM,
} from "./decorate.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("通用-页面装修")
@Controller("admin/decorate")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class DecorateController {
  constructor(private readonly decorateService: DecorateService) {}

  @Get()
  @ApiOperation({ summary: "获取页面装修列表" })
  @ApiQuery({ name: "keyword", description: "关键词搜索", required: false })
  @ApiQuery({ name: "type", description: "装修类型", required: false })
  @ApiQuery({ name: "platform", description: "平台", required: false })
  @ApiQuery({ name: "status", description: "状态", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  async findAll(@Query() query: DecorateQueryDto) {
    return await this.decorateService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取页面装修详情" })
  @ApiParam({ name: "id", description: "装修ID" })
  async findOne(@Param("id") id: number) {
    return await this.decorateService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "创建页面装修" })
  async create(@Body() createDecorateDto: CreateDecorateDto) {
    return await this.decorateService.create(createDecorateDto);
  }

  @Put()
  @ApiOperation({ summary: "更新页面装修" })
  async update(@Body() updateDecorateDto: UpdateDecorateDto) {
    return await this.decorateService.update(updateDecorateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除页面装修" })
  @ApiParam({ name: "id", description: "装修ID" })
  async remove(@Param("id") id: number) {
    return await this.decorateService.remove(id);
  }

  @Post("batch-delete")
  @ApiOperation({ summary: "批量删除页面装修" })
  async batchRemove(@Body() batchDeleteDecorateDto: BatchDeleteDecorateDto) {
    return await this.decorateService.batchRemove(batchDeleteDecorateDto.ids);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "更新装修状态" })
  @ApiParam({ name: "id", description: "装修ID" })
  @ApiQuery({ name: "status", description: "状态", required: true })
  async updateStatus(@Param("id") id: number, @Query("status") status: number) {
    return await this.decorateService.updateStatus(id, status);
  }

  @Get("type/list")
  @ApiOperation({ summary: "获取装修类型列表" })
  async getTypeList() {
    return DECORATE_TYPE;
  }

  @Get("platform/list")
  @ApiOperation({ summary: "获取平台列表" })
  async getPlatformList() {
    return DECORATE_PLATFORM;
  }

  @Get("status/list")
  @ApiOperation({ summary: "获取装修状态列表" })
  async getStatusList() {
    return DECORATE_STATUS;
  }

  @Get("stats/info")
  @ApiOperation({ summary: "获取装修统计信息" })
  async getDecorateStats() {
    return await this.decorateService.getDecorateStats();
  }

  @Get("preview/:id")
  @ApiOperation({ summary: "预览装修页面" })
  @ApiParam({ name: "id", description: "装修ID" })
  async previewDecorate(@Param("id") id: number) {
    return await this.decorateService.previewDecorate(id);
  }

  @Post("copy/:id")
  @ApiOperation({ summary: "复制装修页面" })
  @ApiParam({ name: "id", description: "装修ID" })
  async copyDecorate(
    @Param("id") id: number,
    @Body() copyData: { name?: string; description?: string },
  ) {
    return await this.decorateService.copyDecorate(id, copyData);
  }
}
