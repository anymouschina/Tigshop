import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import {
  AdminUserQueryDto,
  UpdateUserStatusDto,
  UpdateUserInfoDto,
  ResetPasswordDto,
  BatchUserOperationDto
} from './dto/admin-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('admin/user')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词（用户名/手机号/邮箱）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'user_rank', required: false, description: '用户等级' })
  @ApiQuery({ name: 'status', required: false, description: '用户状态' })
  @ApiQuery({ name: 'register_start', required: false, description: '注册开始时间' })
  @ApiQuery({ name: 'register_end', required: false, description: '注册结束时间' })
  @ApiQuery({ name: 'last_login_start', required: false, description: '最后登录开始时间' })
  @ApiQuery({ name: 'last_login_end', required: false, description: '最后登录结束时间' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserList(@Query() query: AdminUserQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
    };

    const [records, total] = await Promise.all([
      this.userService.getAdminUserList(filter),
      this.userService.getAdminUserCount(filter)
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

  @Get('statistics')
  @ApiOperation({ summary: '获取用户统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserStatistics() {
    const shopId = 1; // TODO: 从token中获取
    const statistics = await this.userService.getUserStatistics(shopId);

    return {
      code: 200,
      message: '获取成功',
      data: statistics,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserDetail(@Param('id') id: number) {
    const user = await this.userService.getAdminUserDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: user,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新用户状态' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserStatus(
    @Param('id') id: number,
    @Body() updateDto: UpdateUserStatusDto,
  ) {
    const result = await this.userService.updateUserStatus(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/info')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserInfo(
    @Param('id') id: number,
    @Body() updateDto: UpdateUserInfoDto,
  ) {
    const result = await this.userService.updateUserInfo(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetUserPassword(
    @Param('id') id: number,
    @Body() resetDto: ResetPasswordDto,
  ) {
    const result = await this.userService.resetUserPassword(id, resetDto);
    return {
      code: 200,
      message: '重置成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteUser(@Param('id') id: number) {
    await this.userService.deleteUser(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量操作用户' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async batchOperation(@Body() batchDto: BatchUserOperationDto) {
    const result = await this.userService.batchOperation(batchDto);
    return {
      code: 200,
      message: '操作成功',
      data: result,
    };
  }

  @Get('ranks')
  @ApiOperation({ summary: '获取用户等级列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserRanks() {
    const ranks = await this.userService.getUserRanks();
    return {
      code: 200,
      message: '获取成功',
      data: ranks,
    };
  }

  @Post('import')
  @ApiOperation({ summary: '导入用户' })
  @ApiResponse({ status: 200, description: '导入成功' })
  async importUsers(@Body() importData: any) {
    const result = await this.userService.importUsers(importData);
    return {
      code: 200,
      message: '导入成功',
      data: result,
    };
  }

  @Post('export')
  @ApiOperation({ summary: '导出用户' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportUsers(@Body() exportData: any) {
    const result = await this.userService.exportUsers(exportData);
    return {
      code: 200,
      message: '导出成功',
      data: result,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取用户配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserConfig() {
    const config = await this.userService.getUserConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }

  @Put('config')
  @ApiOperation({ summary: '更新用户配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserConfig(@Body() config: any) {
    const result = await this.userService.updateUserConfig(config);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }
}