import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
// Disabled duplicate controller content to prevent build issues; functional version lives under user-rank/.
export {};
import {
  UserRankQueryDto,
  CreateUserRankDto,
  UpdateUserRankDto,
  UpdateUserRankFieldDto,
  BatchUserRankOperationDto
} from './dto/user-rank.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('用户等级管理')
@Controller('admin/user-rank')
@UseGuards(RolesGuard)
@Roles('admin')
export class UserRankController {
  constructor(private readonly userRankService: UserRankService) {}

  @Get()
  @ApiOperation({ summary: '获取用户等级列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserRankList(@Query() query: UserRankQueryDto) {
    const [records, total] = await Promise.all([
      this.userRankService.getUserRankList(query),
      this.userRankService.getUserRankCount(query)
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户等级详情' })
  @ApiParam({ name: 'id', description: '等级ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserRankDetail(@Param('id') id: number) {
    const rank = await this.userRankService.getUserRankDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: rank,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建用户等级' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createUserRank(@Body() createDto: CreateUserRankDto) {
    const result = await this.userRankService.createUserRank(createDto);
    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户等级' })
  @ApiParam({ name: 'id', description: '等级ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserRank(
    @Param('id') id: number,
    @Body() updateDto: UpdateUserRankDto,
  ) {
    const result = await this.userRankService.updateUserRank(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/field')
  @ApiOperation({ summary: '更新用户等级单个字段' })
  @ApiParam({ name: 'id', description: '等级ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserRankField(
    @Param('id') id: number,
    @Body() updateFieldDto: UpdateUserRankFieldDto,
  ) {
    const result = await this.userRankService.updateUserRankField(
      id,
      updateFieldDto.field,
      updateFieldDto.value
    );
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户等级' })
  @ApiParam({ name: 'id', description: '等级ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteUserRank(@Param('id') id: number) {
    await this.userRankService.deleteUserRank(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量操作用户等级' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async batchOperation(@Body() batchDto: BatchUserRankOperationDto) {
    if (batchDto.type === 'del') {
      await this.userRankService.batchDelete(batchDto.ids);
      return {
        code: 200,
        message: '批量删除成功',
      };
    }
    return {
      code: 400,
      message: '不支持的操作类型',
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取等级统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRankStatistics() {
    const statistics = await this.userRankService.getRankStatistics();
    return {
      code: 200,
      message: '获取成功',
      data: statistics,
    };
  }

  @Put('sort')
  @ApiOperation({ summary: '调整等级排序' })
  @ApiResponse({ status: 200, description: '调整成功' })
  async updateRankSort(@Body() sortData: { id: number; sort_order: number }[]) {
    const result = await this.userRankService.updateRankSort(sortData);
    return {
      code: 200,
      message: '调整成功',
      data: result,
    };
  }

  @Get('privileges')
  @ApiOperation({ summary: '获取等级特权配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRankPrivileges() {
    const privileges = await this.userRankService.getRankPrivileges();
    return {
      code: 200,
      message: '获取成功',
      data: privileges,
    };
  }

  @Put('privileges')
  @ApiOperation({ summary: '更新等级特权配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateRankPrivileges(@Body() privileges: any) {
    const result = await this.userRankService.updateRankPrivileges(privileges);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Post('upgrade-check')
  @ApiOperation({ summary: '检查用户等级升级' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async checkUserUpgrade(@Body() checkData: { user_id: number }) {
    const result = await this.userRankService.checkUserUpgrade(checkData.user_id);
    return {
      code: 200,
      message: '检查成功',
      data: result,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取等级配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRankConfig() {
    const config = await this.userRankService.getRankConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }
}
