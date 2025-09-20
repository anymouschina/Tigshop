// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CategoryService, CATEGORY_SHOW_STATUS, CATEGORY_HOT_STATUS } from './category.service';
import {
  CategoryQueryDto,
  CategoryDetailDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateCategoryFieldDto,
  DeleteCategoryDto,
  BatchDeleteCategoryDto,
  MoveCategoryDto,
  GetParentNameDto,
} from './dto/category.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('商品分类管理')
@Controller('admin/product/category')
@UseGuards(RolesGuard)
@Roles('admin')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '获取商品分类列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'parent_id', required: false, description: '父分类ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'sort_field', required: false, description: '排序字段' })
  @ApiQuery({ name: 'sort_order', required: false, description: '排序方式' })
  @ApiQuery({ name: 'paging', required: false, description: '是否分页' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategoryList(@Query() query: CategoryQueryDto) {
    const [records, total] = await Promise.all([
      this.categoryService.getFilterResult(query),
      query.paging ? this.categoryService.getFilterCount(query) : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: query.paging ? {
        records,
        total,
        show_status_list: CATEGORY_SHOW_STATUS,
        hot_status_list: CATEGORY_HOT_STATUS,
      } : records,
    };
  }

  @Get('all')
  @ApiOperation({ summary: '获取所有商品分类' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'parent_id', required: false, description: '父分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllCategories(@Query() query: Partial<CategoryQueryDto>) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.categoryService.getFilterResult(filter);

    return {
      code: 200,
      message: '获取成功',
      data: records,
    };
  }

  @Get('tree')
  @ApiOperation({ summary: '获取分类树结构' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategoryTree() {
    const records = await this.categoryService.getAllCategoryTree();

    return {
      code: 200,
      message: '获取成功',
      data: records,
    };
  }

  @Get('parent-tree')
  @ApiOperation({ summary: '获取父级分类树' })
  @ApiQuery({ name: 'parent_id', required: false, description: '父分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getParentCategoryTree(@Query('parent_id') parentId: number = 0) {
    const records = await this.categoryService.getCategoryTreeByParent(parentId);

    return {
      code: 200,
      message: '获取成功',
      data: records,
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取商品分类详情' })
  @ApiQuery({ name: 'id', required: true, description: '分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategoryDetail(@Query() query: CategoryDetailDto) {
    const item = await this.categoryService.getDetail(query.id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Get('parent-name')
  @ApiOperation({ summary: '获取父分类名称' })
  @ApiQuery({ name: 'parent_id', required: true, description: '父分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getParentName(@Query() query: GetParentNameDto) {
    const parentName = await this.categoryService.getParentName(query.parent_id);

    return {
      code: 200,
      message: '获取成功',
      data: {
        parent_name: parentName,
      },
    };
  }

  @Get('parent-path/:categoryId')
  @ApiOperation({ summary: '获取父分类路径' })
  @ApiParam({ name: 'categoryId', description: '分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getParentPath(@Param('categoryId', new ParseIntPipe()) categoryId: number) {
    const path = await this.categoryService.getParentPath(categoryId);

    return {
      code: 200,
      message: '获取成功',
      data: path,
    };
  }

  @Get('hot')
  @ApiOperation({ summary: '获取热门分类' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getHotCategories() {
    const categories = await this.categoryService.getHotCategories();

    return {
      code: 200,
      message: '获取成功',
      data: categories,
    };
  }

  @Get('show')
  @ApiOperation({ summary: '获取所有显示的分类' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getShowCategories() {
    const categories = await this.categoryService.getAllShowCategories();

    return {
      code: 200,
      message: '获取成功',
      data: categories,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建商品分类' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createCategory(@Body() createDto: CreateCategoryDto) {
    const result = await this.categoryService.create(createDto);

    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新商品分类' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateCategory(@Body() updateDto: UpdateCategoryDto) {
    const result = await this.categoryService.update(updateDto.category_id, updateDto);

    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put('field')
  @ApiOperation({ summary: '更新商品分类字段' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateCategoryField(@Body() updateDto: UpdateCategoryFieldDto) {
    const result = await this.categoryService.updateField(updateDto.id, updateDto.field, updateDto.value);

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

  @Post('move')
  @ApiOperation({ summary: '转移商品分类' })
  @ApiResponse({ status: 200, description: '转移成功' })
  async moveCategoryProducts(@Body() moveDto: MoveCategoryDto) {
    const result = await this.categoryService.moveCategoryProducts(moveDto.id, moveDto.target_category_id);

    if (result) {
      return {
        code: 200,
        message: '转移成功',
      };
    } else {
      return {
        code: 400,
        message: '转移失败',
      };
    }
  }

  @Delete()
  @ApiOperation({ summary: '删除商品分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteCategory(@Body() deleteDto: DeleteCategoryDto) {
    const result = await this.categoryService.delete(deleteDto.id);

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
  @ApiOperation({ summary: '批量删除商品分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteCategory(@Body() batchDto: BatchDeleteCategoryDto) {
    const result = await this.categoryService.batchDelete(batchDto.ids);

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

  @Get('children/:categoryId')
  @ApiOperation({ summary: '获取子分类ID列表' })
  @ApiParam({ name: 'categoryId', description: '分类ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getChildrenIds(@Param('categoryId', new ParseIntPipe()) categoryId: number) {
    const childrenIds = await this.categoryService.getChildrenIds(categoryId);

    return {
      code: 200,
      message: '获取成功',
      data: childrenIds,
    };
  }
}
