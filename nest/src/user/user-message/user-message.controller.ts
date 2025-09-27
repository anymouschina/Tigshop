import { Controller, Get, Post, Delete, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UserMessageService } from './user-message.service';
import { GetUserMessageListDto, UpdateMessageReadDto } from './dto/user-message.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ResponseUtil } from '../../common/utils/response.util';

@ApiTags('用户站内信')
@Controller('user/message')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserMessageController {
  constructor(private readonly userMessageService: UserMessageService) {}

  @ApiOperation({ summary: '获取用户站内信列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false, example: 1 })
  @ApiQuery({ name: 'size', description: '每页数量', required: false, example: 15 })
  @ApiQuery({ name: 'unread', description: '是否只显示未读消息：0-全部，1-未读', required: false, example: 0 })
  @Get('list')
  async getMessageList(
    @Request() req,
    @Query() query: GetUserMessageListDto,
  ) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const result = await this.userMessageService.getUserMessageList(userId, query);
    return ResponseUtil.success(result);
  }

  @ApiOperation({ summary: '标记消息为已读' })
  @Post('updateMessageRead')
  async updateMessageRead(
    @Request() req,
    @Body() body: UpdateMessageReadDto,
  ) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const result = await this.userMessageService.markMessageAsRead(body.id, userId);

    if (result) {
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('标记失败或消息不存在');
    }
  }

  @ApiOperation({ summary: '标记所有消息为已读' })
  @Post('updateAllRead')
  async updateAllRead(@Request() req) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const result = await this.userMessageService.markAllMessagesAsRead(userId);

    if (result) {
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('操作失败');
    }
  }

  @ApiOperation({ summary: '删除消息' })
  @Post('del')
  async deleteMessage(
    @Request() req,
    @Body() body: UpdateMessageReadDto,
  ) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const result = await this.userMessageService.deleteMessage(body.id, userId);

    if (result) {
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error('删除失败或消息不存在');
    }
  }

  @ApiOperation({ summary: '获取未读消息数量' })
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const count = await this.userMessageService.getUnreadCount(userId);

    return ResponseUtil.success({
      unread_count: count,
    });
  }
}