import { Controller, Get, Post, Put, Body, Query, Request, UseGuards, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto, UpdatePasswordDto, UpdateMobileDto, UpdateEmailDto, UploadAvatarDto, UserQueryDto } from './dto/user.dto';

@ApiTags('用户端用户信息')
@Controller('api/user/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('detail')
  @ApiOperation({ summary: '获取用户详细信息' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '获取成功' })
  async detail(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userService.getUserDetail(userId);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Put('updateInformation')
  @ApiOperation({ summary: '修改个人信息' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '修改成功' })
  async updateInformation(@Request() req, @Body() updateDto: UpdateUserDto) {
    const userId = req.user.userId;
    const result = await this.userService.updateInformation(userId, updateDto);
    return {
      code: 200,
      message: '修改成功',
      data: result,
    };
  }

  @Post('updatePassword')
  @ApiOperation({ summary: '修改密码' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '修改成功' })
  async updatePassword(@Request() req, @Body() updateDto: UpdatePasswordDto) {
    const userId = req.user.userId;
    const result = await this.userService.updatePassword(userId, updateDto);
    return {
      code: 200,
      message: '密码修改成功',
      data: result,
    };
  }

  @Post('updateMobile')
  @ApiOperation({ summary: '修改手机号' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '修改成功' })
  async updateMobile(@Request() req, @Body() updateDto: UpdateMobileDto) {
    const userId = req.user.userId;
    const result = await this.userService.updateMobile(userId, updateDto);
    return {
      code: 200,
      message: '手机号修改成功',
      data: result,
    };
  }

  @Post('updateEmail')
  @ApiOperation({ summary: '修改邮箱' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '修改成功' })
  async updateEmail(@Request() req, @Body() updateDto: UpdateEmailDto) {
    const userId = req.user.userId;
    const result = await this.userService.updateEmail(userId, updateDto);
    return {
      code: 200,
      message: '邮箱修改成功',
      data: result,
    };
  }

  @Post('uploadAvatar')
  @ApiOperation({ summary: '上传头像' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '上传成功' })
  async uploadAvatar(@Request() req, @Body() uploadDto: UploadAvatarDto) {
    const userId = req.user.userId;
    const result = await this.userService.uploadAvatar(userId, uploadDto);
    return {
      code: 200,
      message: '头像上传成功',
      data: result,
    };
  }

  @Get('memberCenter')
  @ApiOperation({ summary: '会员中心首页数据' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '获取成功' })
  async memberCenter(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userService.getMemberCenter(userId);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'sort_field', required: false })
  @ApiQuery({ name: 'sort_order', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserList(@Query() queryDto: UserQueryDto) {
    const data = await this.userService.getUserList(queryDto);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取用户统计信息' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserStatistics(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userService.getUserStatistics(userId);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Get('info/:userId')
  @ApiOperation({ summary: '获取指定用户信息' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserInfo(@Param('userId') userId: number) {
    const data = await this.userService.getUserDetail(userId);
    return {
      code: 200,
      message: '获取成功',
      data,
    };
  }

  @Delete('delete/:userId')
  @ApiOperation({ summary: '删除用户' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteUser(@Param('userId') userId: number) {
    // 这里需要有权限检查，确保只有管理员可以删除用户
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { is_using: 0 }, // 软删除
    });
    return {
      code: 200,
      message: '删除成功',
      data: null,
    };
  }
}