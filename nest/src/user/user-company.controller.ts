import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UserCompanyService } from './user-company.service';
import {
  UserCompanyQueryDto,
  CreateUserCompanyDto,
  UpdateUserCompanyDto,
  ApproveUserCompanyDto,
  RejectUserCompanyDto
} from './dto/user-company.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('用户企业管理')
@Controller('admin/user-company')
@UseGuards(RolesGuard)
@Roles('admin')
export class UserCompanyController {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  @Get()
  @ApiOperation({ summary: '获取用户企业列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词（企业名称/联系人）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'status', required: false, description: '审核状态' })
  @ApiQuery({ name: 'user_id', required: false, description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserCompanyList(@Query() query: UserCompanyQueryDto) {
    const [records, total] = await Promise.all([
      this.userCompanyService.getUserCompanyList(query),
      this.userCompanyService.getUserCompanyCount(query)
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
  @ApiOperation({ summary: '获取用户企业详情' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserCompanyDetail(@Param('id') id: number) {
    const company = await this.userCompanyService.getUserCompanyDetail(id);
    return {
      code: 200,
      message: '获取成功',
      data: company,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建用户企业' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createUserCompany(@Body() createDto: CreateUserCompanyDto) {
    const result = await this.userCompanyService.createUserCompany(createDto);
    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户企业信息' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserCompany(
    @Param('id') id: number,
    @Body() updateDto: UpdateUserCompanyDto,
  ) {
    const result = await this.userCompanyService.updateUserCompany(id, updateDto);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '审核通过用户企业' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '审核成功' })
  async approveUserCompany(
    @Param('id') id: number,
    @Body() approveDto: ApproveUserCompanyDto,
  ) {
    const result = await this.userCompanyService.approveUserCompany(id, approveDto);
    return {
      code: 200,
      message: '审核成功',
      data: result,
    };
  }

  @Put(':id/reject')
  @ApiOperation({ summary: '拒绝用户企业申请' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async rejectUserCompany(
    @Param('id') id: number,
    @Body() rejectDto: RejectUserCompanyDto,
  ) {
    const result = await this.userCompanyService.rejectUserCompany(id, rejectDto);
    return {
      code: 200,
      message: '操作成功',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户企业' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteUserCompany(@Param('id') id: number) {
    await this.userCompanyService.deleteUserCompany(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取企业统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCompanyStatistics() {
    const statistics = await this.userCompanyService.getCompanyStatistics();
    return {
      code: 200,
      message: '获取成功',
      data: statistics,
    };
  }

  @Get('pending-count')
  @ApiOperation({ summary: '获取待审核企业数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingCount() {
    const count = await this.userCompanyService.getPendingCount();
    return {
      code: 200,
      message: '获取成功',
      data: { count },
    };
  }

  @Post('batch-approve')
  @ApiOperation({ summary: '批量审核企业' })
  @ApiResponse({ status: 200, description: '审核成功' })
  async batchApprove(@Body() batchData: { ids: number[]; status: number; remark?: string }) {
    const result = await this.userCompanyService.batchApprove(batchData);
    return {
      code: 200,
      message: '审核成功',
      data: result,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取企业配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCompanyConfig() {
    const config = await this.userCompanyService.getCompanyConfig();
    return {
      code: 200,
      message: '获取成功',
      data: config,
    };
  }

  @Put('config')
  @ApiOperation({ summary: '更新企业配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateCompanyConfig(@Body() config: any) {
    const result = await this.userCompanyService.updateCompanyConfig(config);
    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Get('types')
  @ApiOperation({ summary: '获取企业类型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCompanyTypes() {
    const types = await this.userCompanyService.getCompanyTypes();
    return {
      code: 200,
      message: '获取成功',
      data: types,
    };
  }

  @Get('industries')
  @ApiOperation({ summary: '获取行业分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getIndustries() {
    const industries = await this.userCompanyService.getIndustries();
    return {
      code: 200,
      message: '获取成功',
      data: industries,
    };
  }
}