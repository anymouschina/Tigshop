import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto/article.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('文章管理')
@Controller('admin/content/article')
@UseGuards(AdminAuthGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @ApiOperation({ summary: '文章列表' })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiQuery({ name: 'category_id', description: '分类ID', required: false })
  @ApiQuery({ name: 'status', description: '状态', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryArticleDto) {
    const filter = {
      keyword: query.keyword || '',
      category_id: query.category_id || 0,
      status: query.status || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'id',
      sort_order: query.sort_order || 'desc',
    };

    const filterResult = await this.articleService.getFilterList(filter);
    const total = await this.articleService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: '文章详情' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @Get('detail/:id')
  async detail(@Param('id') id: number) {
    const item = await this.articleService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '创建文章' })
  @Post('create')
  async create(@Body() createData: CreateArticleDto) {
    const result = await this.articleService.createArticle(createData);
    if (!result) {
      return ResponseUtil.error('文章创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '更新文章' })
  @Put('update/:id')
  async update(@Param('id') id: number, @Body() updateData: UpdateArticleDto) {
    const result = await this.articleService.updateArticle(id, updateData);
    if (!result) {
      return ResponseUtil.error('文章更新失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    await this.articleService.deleteArticle(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '批量操作' })
  @Post('batch')
  async batch(@Body() batchData: any) {
    if (!batchData.ids || !Array.isArray(batchData.ids) || batchData.ids.length === 0) {
      return ResponseUtil.error('未选择项目');
    }

    if (batchData.type === 'del') {
      await this.articleService.batchDeleteArticle(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('#type 错误');
    }
  }

  @ApiOperation({ summary: '文章统计' })
  @Get('statistics')
  async statistics() {
    const statistics = await this.articleService.getArticleStatistics();
    return ResponseUtil.success(statistics);
  }
}