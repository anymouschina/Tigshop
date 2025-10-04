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

  @Get('list')
  async listConversations(
    @Query('shopId') shopId?: string,
    @Query('userFrom') userFrom?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.service.listConversations({
      shopId: shopId ? Number(shopId) : 0,
      userFrom,
      page: page ? Number(page) : 1,
      size: size ? Number(size) : 20,
      role: (role === 'servant' ? 'servant' : 'user'),
      status: status !== undefined ? Number(status) : undefined,
    });
    return { code: 0, message: 'success', data };
  }

  // 兼容客户端路径多加一层 conversation
  @Get('conversation/list')
  async listConversationsAlias(
    @Query('shopId') shopId?: string,
    @Query('userFrom') userFrom?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.listConversations(shopId, userFrom, page, size, role, status);
  }

  @Post('open')
  async openConversation(@Body() body: any) {
    const data = await this.service.openConversation({
      shopId: body.shopId ? Number(body.shopId) : 0,
      userFrom: body.userFrom,
      servantId: body.servantId ? Number(body.servantId) : undefined,
    });
    return { code: 0, message: 'success', data };
  }

  @Post('markRead')
  async markRead(@Body() body: any) {
    const data = await this.service.markRead({
      conversationId: Number(body.conversationId),
      role: body.role === 'servant' ? 'servant' : 'user',
      messageIds: Array.isArray(body.messageIds) ? body.messageIds.map((v: any) => Number(v)) : undefined,
    });
    return { code: 0, message: 'success', data };
  }

  @Post('markAllRead')
  async markAllRead(@Body() body: any) {
    const data = await this.service.markAllRead({
      conversationId: Number(body.conversationId),
      role: body.role === 'servant' ? 'servant' : 'user',
    });
    return { code: 0, message: 'success', data };
  }

  @Get('unreadCount')
  async unreadCount(
    @Query('shopId') shopId?: string,
    @Query('userFrom') userFrom?: string,
    @Query('role') role?: string,
  ) {
    const data = await this.service.unreadCount({
      shopId: shopId ? Number(shopId) : 0,
      userFrom,
      role: role === 'servant' ? 'servant' : 'user',
    });
    return { code: 0, message: 'success', data };
  }

  @Post('close')
  async closeConversation(@Body() body: any) {
    const data = await this.service.closeConversation({ conversationId: Number(body.conversationId) });
    return { code: 0, message: 'success', data };
  }

  @Post('delete')
  async deleteConversation(@Body() body: any) {
    const data = await this.service.deleteConversation({ conversationId: Number(body.conversationId) });
    return { code: 0, message: 'success', data };
  }
}
