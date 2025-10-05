import { Controller, Get, Post, Body, Query, Req, Logger, UseGuards } from '@nestjs/common';
import { ImConversationService } from './im_conversation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { HybridImAuthGuard } from 'src/auth/guards/hybrid-im-auth.guard';


@Controller('im/conversation')
@ApiBearerAuth()
@UseGuards(HybridImAuthGuard)
export class ImConversationController {
  private readonly logger = new Logger(ImConversationController.name);
  constructor(private service: ImConversationService) {}

  @Get('message/list')
  async getMessageList(
    @Req() req: any,
    @Query('conversationId') conversationId?: string,
    @Query('firstId') firstId?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('size') size?: string,
    @Query('shopId') shopId?: string,
    @Query('orderId') orderId?: string,
    @Query('userFrom') userFrom?: string,
  ) {
    this.logger.debug(`getMessageList: ${JSON.stringify(req.user)}}`)
    const result = await this.service.listMessages({
      conversationId: conversationId ? Number(conversationId) : undefined,
      firstId: firstId ? Number(firstId) : -1,
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      size: size ? Math.min(Number(size), 100) : 20,
      shopId: shopId ? Number(shopId) : 0,
      userId:req.user?.userId ? Number( req.user?.userId) : undefined,
      orderId: orderId ? Number(orderId) : undefined,
      userFrom,
    });
    return { code: 0, message: 'success', data: result };
  }

  // 会话详情（支持旧路径别名）
  @Get('detail')
  async conversationDetail(
    @Query('conversationId') conversationId?: string,
    @Query('shopId') shopId?: string,
    @Query('userFrom') userFrom?: string,
  ) {
    const data = await this.service.getConversationDetail({
      conversationId: conversationId ? Number(conversationId) : undefined,
      shopId: shopId ? Number(shopId) : undefined,
      userFrom,
    });
    return { code: 0, message: 'success', data };
  }

  // 兼容客户端路径多加一层 conversation：/im/conversation/conversation/detail
  @Get('conversation/detail')
  async conversationDetailAlias(
    @Query('conversationId') conversationId?: string,
    @Query('shopId') shopId?: string,
    @Query('userFrom') userFrom?: string,
  ) {
    return this.conversationDetail(conversationId, shopId, userFrom);
  }

  // 发送消息（文本/图片/自定义卡片）
  @Post('message/send')
  async sendMessage(@Body() body: any, @Req() req: any) {
    const tokenUser = req?.user || {};
    // 统一：后台管理员 => 客服；其他 => 用户
    const isAdmin = tokenUser.role === 'admin' || tokenUser.isAdmin;
    const role: 'servant' | 'user' = isAdmin ? 'servant' : 'user';

    // 客服 ID 推断：body.servantId > token adminId > 会话中再由 service 回填
    let servantId = body.servantId ? Number(body.servantId) : undefined;
    if (role === 'servant' && !servantId) {
      const currentAdminId = tokenUser.userId || tokenUser.admin_id || tokenUser.adminId;
      if (currentAdminId) servantId = Number(currentAdminId);
    }

    // 普通用户强制使用 token 中的 userId；客服只在新建会话时可指定 userId（留给 service 处理，不在此覆盖会话已有 user）
    let normalizedUserId: number | undefined = undefined;
    if (role === 'user') {
      if (tokenUser.userId) normalizedUserId = Number(tokenUser.userId);
      else if (body.userId) normalizedUserId = Number(body.userId); // 兜底（匿名兼容）
    } else if (!body.conversationId && body.userId) {
      normalizedUserId = Number(body.userId);
    }

    const data = await this.service.sendMessage({
      conversationId: body.conversationId ? Number(body.conversationId) : undefined,
      shopId: body.shopId ? Number(body.shopId) : 0,
      userFrom: body.userFrom || req.userFrom || body.userFrom,
      userId: normalizedUserId,
      servantId,
      role,
      orderId: body.orderId ? Number(body.orderId) : undefined,
      content: body.content,
    });
    return { code: 0, message: 'success', data };
  }

  // 兼容客户端老路径：message/setRead → 标记已读
  @Post('message/setRead')
  async setRead(@Body() body: any) {
    const conversationId = body.conversationId ? Number(body.conversationId) : undefined;
    const messageIds = Array.isArray(body.messageIds) ? body.messageIds.map((v: any) => Number(v)) : undefined;
    const data = await this.service.markRead({
      conversationId,
      role: body.role === 'servant' ? 'servant' : 'user',
      messageIds,
      shopId: body.shopId ? Number(body.shopId) : 0,
      userFrom: body.userFrom,
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
    @Query('mine') mine?: string, // mine=1 仅查看当前客服自己的会话（进行中）
    @Req() req?: any,
  ) {
    // 自动角色推断：若未显式传 role 且 JWT 中为 admin，则视为客服(servant)
    const inferredRole: 'servant' | 'user' = role === 'servant'
      ? 'servant'
      : (role === 'user'
          ? 'user'
          : ( (req?.user?.role === 'admin' || req?.user?.isAdmin) ? 'servant' : 'user'));
    const resolvedRole = inferredRole;
    const onlyMine = resolvedRole === 'servant' && (mine === '1' || mine === 'true');
    const currentAdminId = onlyMine ? (req?.user?.userId ?? req?.user?.adminId ?? req?.user?.admin_id) : undefined;
    // 兼容要求：status=1 代表“进行中”(内部=0)；status=2 代表“已关闭”(内部=1)。其它保持原语义/不筛选。
    let internalStatus: number | undefined = undefined;
    let statusMappingMode = false;
    internalStatus = Number(status);
    const includeMessages = status === '1'; // 仅“会话中”模式需要附带消息列表
    this.logger.debug(`listCon ${internalStatus} ${status}`)
   const data = await this.service.listConversations({
      shopId: shopId ? Number(shopId) : 0,
      userFrom,
      page: page ? Number(page) : 1,
      size: size ? Number(size) : 20,
      role: resolvedRole,
      status: internalStatus,
      currentServantId: onlyMine && currentAdminId ? Number(currentAdminId) : undefined,
      onlyMine,
      includeMessages,
      statusMappingMode,
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
    @Query('mine') mine?: string,
    @Req() req?: any,
  ) {
    return this.listConversations(shopId, userFrom, page, size, role, status, mine, req);
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
  async openConversation(@Body() body: any, @Req() req: any) {
    const data = await this.service.openConversation({
      shopId: body.shopId ? Number(body.shopId) : 0,
      userFrom: body.userFrom || req.userFrom,
      servantId: body.servantId ? Number(body.servantId) : undefined,
    });
    return { code: 0, message: 'success', data };
  }

  // 兼容创建会话路径：/im/conversation/create
  @Post('create')
  async createConversation(@Body() body: any, @Req() req: any) {
    return this.openConversation(body, req);
  }

  // 兼容老路径：/im/conversation/conversation/create
  @Post('conversation/create')
  async createConversationAlias(@Body() body: any, @Req() req: any) {
    return this.openConversation(body, req);
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

  // 会话转接到指定客服
  @Post('transfer')
  async transfer(@Body() body: any, @Req() req: any) {
    // 兼容 PHP 命名：驼峰 + 下划线，多别名兜底
    const num = (v: any) => (v === undefined || v === null || v === '' ? undefined : Number(v));
    const conversationId = num(
      body.conversationId ?? body.id ?? body.conversation_id,
    );
    const originalProvided = (
      body.toServantId !== undefined || body.servantId !== undefined || body.adminId !== undefined ||
      body.toAdminId !== undefined || body.kefuId !== undefined || body.toKefuId !== undefined ||
      body.targetServantId !== undefined || body.targetId !== undefined || body.to_servant_id !== undefined ||
      body.servant_id !== undefined || body.admin_id !== undefined || body.to_admin_id !== undefined ||
      body.kefu_id !== undefined || body.to_kefu_id !== undefined
    );
    let toServantId = num(
      body.toServantId ?? body.servantId ?? body.adminId ?? body.toAdminId ?? body.kefuId ??
      body.toKefuId ?? body.targetServantId ?? body.targetId ??
      body.to_servant_id ?? body.servant_id ?? body.admin_id ?? body.to_admin_id ?? body.kefu_id ?? body.to_kefu_id,
    );
    // 若未提供目标客服ID，则默认指向当前登录管理员（接入会话行为）。acceptMode 标识供 service 优化返回
    let acceptMode = false;
    if (!toServantId) {
      const currentAdminId = req?.user?.userId ?? req?.user?.adminId ?? req?.user?.admin_id;
      toServantId = num(currentAdminId);
      if (!originalProvided) acceptMode = true;
    }
    const fromServantId = num(
      body.fromServantId ?? body.from_admin_id ?? body.fromServant_id ?? body.fromServant ?? body.from_admin ?? body.from_servant_id,
    );
    const force = body.force ? Boolean(Number(body.force) || body.force === true) : false;

    if (!conversationId) {
      return { code: 400, message: '缺少 conversationId', data: null };
    }
    if (!toServantId && toServantId !== 0) {
      return { code: 400, message: '缺少 toServantId', data: null };
    }
    const data = await this.service.transfer({ conversationId, toServantId, fromServantId, force, acceptMode });
    return { code: 0, message: 'success', data };
  }

  // 兼容老路径多一层 conversation：/im/conversation/conversation/transfer
  @Post('conversation/transfer')
  async transferAlias(@Body() body: any, @Req() req: any) {
    return this.transfer(body, req);
  }

  // 显式“接入”接口：语义清晰，前端可直接调用；内部与未提供 toServantId 的 transfer 行为一致
  @Post('accept')
  async accept(@Body() body: any, @Req() req: any) {
    // 强制不允许客户端指定其他客服 => 忽略传入的 toServantId，仅使用当前登录管理员
    const conversationId = Number(body.conversationId);
    if (!conversationId) {
      return { code: 400, message: '缺少 conversationId', data: null };
    }
    const currentAdminId = req?.user?.userId ?? req?.user?.adminId ?? req?.user?.admin_id;
    if (!currentAdminId) {
      return { code: 401, message: '未登录管理员', data: null };
    }
    const data = await this.service.transfer({ conversationId, toServantId: Number(currentAdminId), acceptMode: true });
    // 为接入场景补充 accepted 语义（如果 service 没有 changed 仍视为成功）
    return { code: 0, message: 'success', data: { ...data, accepted: true } };
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
