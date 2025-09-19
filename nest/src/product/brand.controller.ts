import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BrandService, BRAND_SHOW_STATUS, BRAND_HOT_STATUS, BRAND_AUDIT_STATUS } from './brand.service';
import {
  BrandQueryDto,
  BrandDetailDto,
  CreateBrandDto,
  UpdateBrandDto,
  UpdateBrandFieldDto,
  DeleteBrandDto,
  BatchDeleteBrandDto,
  SearchBrandDto,
  AuditBrandDto,
  AuditBrandQueryDto,
} from './dto/brand.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('品牌管理')
@Controller('admin/product/brand')
@UseGuards(RolesGuard)
@Roles('admin')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: '获取品牌列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'first_word', required: false, description: '首字母' })
  @ApiQuery({ name: 'is_show', required: false, description: '显示状态' })
  @ApiQuery({ name: 'brand_is_hot', required: false, description: '热门状态' })
  @ApiQuery({ name: 'status', required: false, description: '审核状态' })
  @ApiQuery({ name: 'shop_id', required: false, description: '店铺ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'sort_field', required: false, description: '排序字段' })
  @ApiQuery({ name: 'sort_order', required: false, description: '排序方式' })
  @ApiQuery({ name: 'paging', required: false, description: '是否分页' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBrandList(@Query() query: BrandQueryDto) {
    const [records, total] = await Promise.all([
      this.brandService.getFilterResult(query),
      query.paging ? this.brandService.getFilterCount(query) : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: query.paging ? {
        records,
        total,
        show_status_list: BRAND_SHOW_STATUS,
        hot_status_list: BRAND_HOT_STATUS,
        audit_status_list: BRAND_AUDIT_STATUS,
      } : records,
    };
  }

  @Get('all')
  @ApiOperation({ summary: '获取所有品牌' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'is_show', required: false, description: '显示状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllBrands(@Query() query: Partial<BrandQueryDto>) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.brandService.getFilterResult(filter);

    return {
      code: 200,
      message: '获取成功',
      data: records,
    };
  }

  @Get('search')
  @ApiOperation({ summary: '搜索品牌' })
  @ApiQuery({ name: 'word', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchBrands(@Query() query: SearchBrandDto) {
    const result = await this.brandService.searchBrands(query.word);

    return {
      code: 200,
      message: '搜索成功',
      data: result,
    };
  }

  @Get('first-words')
  @ApiOperation({ summary: '获取所有首字母' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllFirstWords() {
    const result = await this.brandService.getAllFirstWords();

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('audit-list')
  @ApiOperation({ summary: '获取待审核品牌列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'shop_id', required: false, description: '店铺ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAuditList(@Query() query: AuditBrandQueryDto) {
    const result = await this.brandService.getAuditList(query);

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('audit-wait-count')
  @ApiOperation({ summary: '获取待审核品牌数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAuditWaitCount() {
    const count = await this.brandService.getAuditWaitCount();

    return {
      code: 200,
      message: '获取成功',
      data: count,
    };
  }

  @Get('hot')
  @ApiOperation({ summary: '获取热门品牌' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getHotBrands() {
    const brands = await this.brandService.getHotBrands();

    return {
      code: 200,
      message: '获取成功',
      data: brands,
    };
  }

  @Get('show')
  @ApiOperation({ summary: '获取所有显示的品牌' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getShowBrands() {
    const brands = await this.brandService.getAllShowBrands();

    return {
      code: 200,
      message: '获取成功',
      data: brands,
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取品牌详情' })
  @ApiQuery({ name: 'id', required: true, description: '品牌ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBrandDetail(@Query() query: BrandDetailDto) {
    const item = await this.brandService.getDetail(query.id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建品牌' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createBrand(@Body() createDto: CreateBrandDto) {
    const result = await this.brandService.create(createDto);

    let message = '品牌添加成功';
    if (createDto.shop_id && createDto.shop_id > 0) {
      message = '品牌添加成功，等待管理员审核！';
    }

    return {
      code: 200,
      message,
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新品牌' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBrand(@Body() updateDto: UpdateBrandDto) {
    const result = await this.brandService.update(updateDto.brand_id, updateDto);

    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put('field')
  @ApiOperation({ summary: '更新品牌字段' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBrandField(@Body() updateDto: UpdateBrandFieldDto) {
    const result = await this.brandService.updateField(updateDto.id, updateDto.field, updateDto.value);

    if (result) {
      return {
        code: 200,
        message: '更新成功',
      };
    } else {
      return {
        code: 400,
        message: '更新失败',
      };
    }
  }

  @Post('update-first-word')
  @ApiOperation({ summary: '批量更新首字母' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAllFirstWords() {
    const result = await this.brandService.updateAllFirstWords();

    if (result) {
      return {
        code: 200,
        message: '批量更新首字母成功',
      };
    } else {
      return {
        code: 400,
        message: '更新失败',
      };
    }
  }

  @Post('audit')
  @ApiOperation({ summary: '品牌审核' })
  @ApiResponse({ status: 200, description: '审核成功' })
  async auditBrand(@Body() auditDto: AuditBrandDto) {
    const result = await this.brandService.auditBrand(auditDto.brand_id, auditDto.status, auditDto.reject_remark);

    return {
      code: 200,
      message: '审核成功',
      data: result,
    };
  }

  @Delete()
  @ApiOperation({ summary: '删除品牌' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteBrand(@Body() deleteDto: DeleteBrandDto) {
    const result = await this.brandService.delete(deleteDto.id);

    if (result) {
      return {
        code: 200,
        message: '删除成功',
      };
    } else {
      return {
        code: 400,
        message: '删除失败',
      };
    }
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除品牌' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteBrand(@Body() batchDto: BatchDeleteBrandDto) {
    const result = await this.brandService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: '批量删除成功',
      };
    } else {
      return {
        code: 400,
        message: '批量删除失败',
      };
    }
  }
}