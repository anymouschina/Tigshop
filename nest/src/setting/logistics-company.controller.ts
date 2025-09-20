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
  LogisticsCompanyService,
  LOGISTICS_SHOW_STATUS,
} from "./logistics-company.service";
import {
  LogisticsCompanyQueryDto,
  LogisticsCompanyDetailDto,
  CreateLogisticsCompanyDto,
  UpdateLogisticsCompanyDto,
  UpdateLogisticsCompanyFieldDto,
  DeleteLogisticsCompanyDto,
  BatchDeleteLogisticsCompanyDto,
} from "./dto/logistics-company.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("物流公司管理")
@Controller("admin/logistics-company")
@UseGuards(RolesGuard)
@Roles("admin")
export class LogisticsCompanyController {
  constructor(
    private readonly logisticsCompanyService: LogisticsCompanyService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取物流公司列表" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({
    name: "logistics_id",
    required: false,
    description: "物流公司ID",
  })
  @ApiQuery({ name: "paging", required: false, description: "是否分页" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getLogisticsCompanyList(@Query() query: LogisticsCompanyQueryDto) {
    const [records, total] = await Promise.all([
      this.logisticsCompanyService.getFilterResult(query),
      query.paging
        ? this.logisticsCompanyService.getFilterCount(query)
        : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: query.paging
        ? {
            records,
            total,
            show_status_list: LOGISTICS_SHOW_STATUS,
          }
        : records,
    };
  }

  @Get("all")
  @ApiOperation({ summary: "获取所有物流公司" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({
    name: "logistics_id",
    required: false,
    description: "物流公司ID",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAllLogisticsCompanies(
    @Query() query: Partial<LogisticsCompanyQueryDto>,
  ) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.logisticsCompanyService.getFilterResult(filter);

    return {
      code: 200,
      message: "获取成功",
      data: records,
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "获取物流公司详情" })
  @ApiQuery({ name: "id", required: true, description: "物流公司ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getLogisticsCompanyDetail(@Query() query: LogisticsCompanyDetailDto) {
    const item = await this.logisticsCompanyService.getDetail(query.id);

    return {
      code: 200,
      message: "获取成功",
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建物流公司" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createLogisticsCompany(@Body() createDto: CreateLogisticsCompanyDto) {
    const result = await this.logisticsCompanyService.create(createDto);

    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: "更新物流公司" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateLogisticsCompany(@Body() updateDto: UpdateLogisticsCompanyDto) {
    const result = await this.logisticsCompanyService.update(
      updateDto.logistics_id,
      updateDto,
    );

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Put("field")
  @ApiOperation({ summary: "更新物流公司字段" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateLogisticsCompanyField(
    @Body() updateDto: UpdateLogisticsCompanyFieldDto,
  ) {
    const result = await this.logisticsCompanyService.updateField(
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
  @ApiOperation({ summary: "删除物流公司" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteLogisticsCompany(@Body() deleteDto: DeleteLogisticsCompanyDto) {
    const result = await this.logisticsCompanyService.delete(deleteDto.id);

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
  @ApiOperation({ summary: "批量删除物流公司" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeleteLogisticsCompany(
    @Body() batchDto: BatchDeleteLogisticsCompanyDto,
  ) {
    const result = await this.logisticsCompanyService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        message: "批量删除失败",
      };
    }
  }

  @Get("available")
  @ApiOperation({ summary: "获取所有可用的物流公司" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAvailableCompanies() {
    const companies =
      await this.logisticsCompanyService.getAllAvailableCompanies();

    return {
      code: 200,
      message: "获取成功",
      data: companies,
    };
  }
}
