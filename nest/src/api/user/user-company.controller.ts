import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UserCompanyService } from './user-company.service';
import { CompanyApplyDto, CompanyQueryDto } from './dto/user-company.dto';

@ApiTags('用户端-企业认证')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/user/company')
export class UserCompanyController {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  @Post('apply')
  @ApiOperation({ summary: '企业认证申请' })
  @ApiResponse({ status: 200, description: '申请成功' })
  async applyCompany(@Request() req, @Body() applyDto: CompanyApplyDto) {
    const userId = req.user.userId;
    return await this.userCompanyService.applyCompany(userId, applyDto);
  }

  @Get('detail/:id')
  @ApiOperation({ summary: '企业认证详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCompanyDetail(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    const companyId = parseInt(id);
    return await this.userCompanyService.getCompanyDetail(companyId, userId);
  }

  @Get('my-apply')
  @ApiOperation({ summary: '当前用户的申请' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserApplication(@Request() req) {
    const userId = req.user.userId;
    return await this.userCompanyService.getUserApplication(userId);
  }

  @Get('list')
  @ApiOperation({ summary: '企业认证列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCompanyList(@Query() queryDto: CompanyQueryDto) {
    return await this.userCompanyService.getCompanyList(queryDto);
  }
}