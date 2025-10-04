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

  // 发送消息（文本/图片/自定义卡片）
  @Post('message/send')
  async sendMessage(@Body() body: any) {
    const data = await this.service.sendMessage({
      conversationId: body.conversationId ? Number(body.conversationId) : undefined,
      shopId: body.shopId ? Number(body.shopId) : 0,
      userFrom: body.userFrom,
      userId: body.userId ? Number(body.userId) : undefined,
      servantId: body.servantId ? Number(body.servantId) : undefined,
      role: body.role === 'servant' ? 'servant' : 'user',
      orderId: body.orderId ? Number(body.orderId) : undefined,
      content: body.content,
    });
    return { code: 0, message: 'success', data };
  }

  // 兼容客户端老路径：message/setRead → 标记已读
  @Post('message/setRead')
  async setRead(@Body() body: any) {
    const data = await this.service.markRead({
      conversationId: Number(body.conversationId),
      role: body.role === 'servant' ? 'servant' : 'user',
      messageIds: Array.isArray(body.messageIds) ? body.messageIds.map((v: any) => Number(v)) : undefined,
    });
    return { code: 0, message: 'success', data };
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

  // 待接入会话列表（客服侧）
  @Get('conversation/waitServantList')
  async waitServantList(
    @Query('shopId') shopId?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const data = await this.service.waitServantList({
      shopId: shopId ? Number(shopId) : 0,
      page: page ? Number(page) : 1,
      size: size ? Number(size) : 15,
    });
    return { code: 0, message: 'success', data };
  }

  // 咨询历史（客服侧）
  @Get('conversation/consultHistory')
  async consultHistory(
    @Query('shopId') shopId?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('timeType') timeType?: string,
  ) {
    const data = await this.service.consultHistory({
      shopId: shopId ? Number(shopId) : 0,
      page: page ? Number(page) : 1,
      size: size ? Number(size) : 15,
      timeType: timeType ? Number(timeType) : undefined,
    });
    return { code: 0, message: 'success', data };
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
