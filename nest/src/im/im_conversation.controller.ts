import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ImConversationService } from './im_conversation.service';

@Controller('im/conversation')
export class ImConversationController {
  constructor(private service: ImConversationService) {}

  @Get('message/list')
  async getMessageList(
    @Query('conversationId') conversationId?: string,
    @Query('firstId') firstId?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('size') size?: string,
    @Query('shopId') shopId?: string,
    @Query('userFrom') userFrom?: string,
  ) {
    const result = await this.service.listMessages({
      conversationId: conversationId ? Number(conversationId) : undefined,
      firstId: firstId ? Number(firstId) : -1,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      size: size ? Math.min(Number(size), 100) : 20,
      shopId: shopId ? Number(shopId) : 0,
      userFrom,
    });
    return { code: 0, message: 'success', data: result };
  }

  @Post('message/send')
  async sendMessage(@Body() body: any) {
    const result = await this.service.sendMessage({
      conversationId: body.conversationId ? Number(body.conversationId) : undefined,
      shopId: body.shopId ? Number(body.shopId) : 0,
      userFrom: body.userFrom,
      content: body.content,
      messageType: body.messageType,
      type: body.type !== undefined ? Number(body.type) : 0,
      userId: body.userId ? Number(body.userId) : undefined,
      servantId: body.servantId ? Number(body.servantId) : undefined,
    });
    return { code: 0, message: 'success', data: result };
  }
}
