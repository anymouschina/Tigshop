import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { UserRankService } from './user-rank.service';
import { CreateUserRankDto, UpdateUserRankDto, QueryUserRankDto } from './dto/user-rank.dto';
import { AdminAuthGuard } from '../../../common/guards/admin-auth.guard';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('会员等级')
@Controller('admin/user/rank')
@UseGuards(AdminAuthGuard)
export class UserRankController {
  constructor(private readonly userRankService: UserRankService) {}

  @ApiOperation({ summary: '会员等级列表' })
  @ApiQuery({ name: 'rank_name', description: '等级名称', required: false })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'size', description: '每页数量', required: false })
  @ApiQuery({ name: 'sort_field', description: '排序字段', required: false })
  @ApiQuery({ name: 'sort_order', description: '排序方式', required: false })
  @Get('list')
  async list(@Query() query: QueryUserRankDto) {
    const filter = {
      rank_name: query.rank_name || '',
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || 'rank_id',
      sort_order: query.sort_order || 'asc',
    };

    const filterResult = await this.userRankService.getFilterList(filter, [], ['user_rights', 'user_count']);
    const total = await this.userRankService.getFilterCount(filter);

    const res = [];
    if (filterResult && filterResult.length > 0) {
      for (const item of filterResult) {
        res.push({
          rank_id: item.rank_id,
          user_count: item.user_count,
          rank_name: item.rank_name,
          rank_logo: item.rank_logo,
          rank_level: item.rank_level,
        });
      }
    } else {
      const defaultData = await this.userRankService.defaultRankData();
      res.push(...defaultData.user_rank_list_not_pro);
    }

    return ResponseUtil.success({
      user_rank: {
        records: res,
        total: total,
      },
      rank_config: {},
    });
  }

  @ApiOperation({ summary: '会员等级详情' })
  @ApiParam({ name: 'rank_type', description: '等级类型' })
  @Get('detail/:rank_type')
  async detail(@Param('rank_type') rank_type: number) {
    const item = await this.userRankService.getDetail(rank_type);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: '更新会员等级' })
  @Put('update')
  async update(@Body() updateData: UpdateUserRankDto) {
    const result = await this.userRankService.updateUserRank(updateData);
    if (!result) {
      return ResponseUtil.error('会员等级更新失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '创建会员等级' })
  @Post('create')
  async create(@Body() createData: CreateUserRankDto) {
    const result = await this.userRankService.createUserRank(createData);
    if (!result) {
      return ResponseUtil.error('会员等级创建失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '删除会员等级' })
  @ApiParam({ name: 'id', description: '等级ID' })
  @Delete('del/:id')
  async del(@Param('id') id: number) {
    const result = await this.userRankService.deleteUserRank(id);
    if (!result) {
      return ResponseUtil.error('删除失败');
    }
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: '获取会员等级配置' })
  @Get('config')
  async getConfig() {
    const config = await this.userRankService.getRankConfig();
    return ResponseUtil.success(config);
  }

  @ApiOperation({ summary: '获取默认数据' })
  @Get('default-data')
  async getDefaultData() {
    const defaultData = await this.userRankService.defaultRankData();
    return ResponseUtil.success(defaultData);
  }
}