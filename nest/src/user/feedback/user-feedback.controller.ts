import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserFeedbackService } from './user-feedback.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('User Feedback')
@Controller('api')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserFeedbackController {
  constructor(private readonly userFeedbackService: UserFeedbackService) {}

  /**
   * 获取反馈列表 - 对齐PHP版本 user/Feedback/index
   */
  @Get('user/feedback/index')
  @ApiOperation({ summary: '获取反馈列表' })
  async index(@Request() req, @Query() query: { page?: number; size?: number; type?: number; status?: number }) {
    const userId = req.user.userId;
    return this.userFeedbackService.getUserFeedbackList(userId, query);
  }

  /**
   * 获取反馈详情 - 对齐PHP版本 user/Feedback/detail
   */
  @Get('user/feedback/detail')
  @ApiOperation({ summary: '获取反馈详情' })
  async detail(@Request() req, @Query() query: { id: number }) {
    const userId = req.user.userId;
    return this.userFeedbackService.getFeedbackDetail(userId, query.id);
  }

  /**
   * 提交反馈 - 对齐PHP版本 user/Feedback/add
   */
  @Post('user/feedback/add')
  @ApiOperation({ summary: '提交反馈' })
  async add(@Request() req, @Body() body: {
    type: number;
    title: string;
    content: string;
    images?: string[];
    contact?: string;
  }) {
    const userId = req.user.userId;
    return this.userFeedbackService.createFeedback(userId, body);
  }

  /**
   * 更新反馈 - 对齐PHP版本 user/Feedback/edit
   */
  @Put('user/feedback/edit')
  @ApiOperation({ summary: '更新反馈' })
  async edit(@Request() req, @Body() body: {
    id: number;
    title?: string;
    content?: string;
    contact?: string;
  }) {
    const userId = req.user.userId;
    return this.userFeedbackService.updateFeedback(userId, body);
  }

  /**
   * 删除反馈 - 对齐PHP版本 user/Feedback/del
   */
  @Post('user/feedback/del')
  @ApiOperation({ summary: '删除反馈' })
  async del(@Request() req, @Body() body: { id: number }) {
    const userId = req.user.userId;
    return this.userFeedbackService.deleteFeedback(userId, body.id);
  }

  /**
   * 获取反馈类型 - 对齐PHP版本 user/Feedback/getType
   */
  @Get('user/feedback/getType')
  @ApiOperation({ summary: '获取反馈类型' })
  async getType() {
    return this.userFeedbackService.getFeedbackTypes();
  }

  /**
   * 获取反馈状态 - 对齐PHP版本 user/Feedback/getStatus
   */
  @Get('user/feedback/getStatus')
  @ApiOperation({ summary: '获取反馈状态' })
  async getStatus() {
    return this.userFeedbackService.getFeedbackStatus();
  }

  /**
   * 回复反馈 - 对齐PHP版本 user/Feedback/reply
   */
  @Post('user/feedback/reply')
  @ApiOperation({ summary: '回复反馈' })
  async reply(@Request() req, @Body() body: { id: number; content: string }) {
    const userId = req.user.userId;
    return this.userFeedbackService.replyFeedback(userId, body.id, body.content);
  }

  /**
   * 上传反馈图片 - 对齐PHP版本 user/Feedback/uploadImage
   */
  @Post('user/feedback/uploadImage')
  @ApiOperation({ summary: '上传反馈图片' })
  async uploadImage(@Request() req, @Body() body: { image: string }) {
    return this.userFeedbackService.uploadFeedbackImage(req.user.userId, body.image);
  }
}