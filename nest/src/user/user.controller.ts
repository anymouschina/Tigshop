import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User Management')
@Controller('api/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户信息
   */
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.userId);
  }

  /**
   * 更新用户信息
   */
  @Put('profile')
  @ApiOperation({ summary: '更新用户信息' })
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.userService.update(req.user.userId, updateData);
  }

  /**
   * 修改密码
   */
  @Put('password')
  @ApiOperation({ summary: '修改密码' })
  async changePassword(
    @Request() req,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ) {
    return this.userService.updatePassword(
      req.user.userId,
      passwordData.oldPassword,
      passwordData.newPassword,
    );
  }
}