import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImConversationService {
  constructor(private prisma: PrismaService) {}

  async listMessages(params: {
    conversationId?: number;
    firstId?: number;
    sortOrder?: 'asc' | 'desc';
    size?: number;
    shopId?: number;
    userFrom?: string;
  }) {
    const { conversationId, firstId = -1, sortOrder = 'desc', size = 20, shopId = 0, userFrom } = params;

    // 基于 conversationId 或 shopId + userFrom 推断最近会话
    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.im_conversation.findFirst({
        where: {
          shop_id: shopId,
          user_from: userFrom,
          is_delete: 0,
        },
        orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
      });
      convId = conv?.id;
      if (!convId) return { records: [], total: 0, conversationId: null };
    }

    const where: any = { conversation_id: convId };
    if (firstId && firstId > 0) {
      if (sortOrder === 'desc') {
        where.id = { lt: firstId }; // 下拉加载更多
      } else {
        where.id = { gt: firstId }; // 正序时加载更新
      }
    }

    const records = await this.prisma.im_message.findMany({
      where,
      orderBy: [{ id: sortOrder }],
      take: size,
    });

    // total 取该会话总消息数量（可优化：前端仅需是否还有更多）
    const total = await this.prisma.im_message.count({ where: { conversation_id: convId } });

    return { records, total, conversationId: convId };
  }

  // 会话列表（简单实现，可按需扩展过滤条件）
  async listConversations(params: {
    shopId?: number; // 店铺侧查看
    userFrom?: string; // 用户侧查看
    page?: number;
    size?: number;
    role?: 'user' | 'servant';
    status?: number; // 会话状态过滤 (0=进行中,1=已关闭)
  }) {
    const { shopId = 0, userFrom, page = 1, size = 20, role = 'user', status } = params;
    const skip = (page - 1) * size;
    const where: any = { is_delete: 0 };
    if (userFrom) where.user_from = userFrom;
    if (shopId) where.shop_id = shopId;
    if (status !== undefined && status !== null && status !== -1) where.status = status;

    const [convs, total] = await this.prisma.$transaction([
      this.prisma.im_conversation.findMany({
        where,
        orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
        skip,
        take: size,
      }),
      this.prisma.im_conversation.count({ where }),
    ]);

    if (!convs.length) return { records: [], total, page, size };
    const convIds = convs.map(c => c.id);
    const messages = await this.prisma.im_message.findMany({
      where: { conversation_id: { in: convIds } },
      orderBy: [{ id: 'desc' }],
      take: convIds.length * 5, // 粗略抓取; 再聚合取每会话最新
    });
    const lastMap: Record<number, any> = {};
    for (const m of messages) {
      if (!lastMap[m.conversation_id!]) lastMap[m.conversation_id!] = m; // 第一条即最新（因 desc）
    }
    // 未读统计：按角色区分
    const unreadMap: Record<number, number> = {};
    for (const cid of convIds) unreadMap[cid] = 0;
    const unreadMessages = await this.prisma.im_message.findMany({
      where: {
        conversation_id: { in: convIds },
        is_read: false,
        ...(role === 'servant' ? { type: 0 } : { type: 1 }), // 对方发送的消息
      },
      select: { id: true, conversation_id: true },
    });
    for (const u of unreadMessages) {
      if (u.conversation_id) unreadMap[u.conversation_id] = (unreadMap[u.conversation_id] || 0) + 1;
    }

    const records = convs.map(c => ({
      ...c,
      lastMessage: lastMap[c.id] || null,
      unread: unreadMap[c.id] || 0,
    }));
    return { records, total, page, size };
  }

  // 打开 / 创建会话
  async openConversation(params: { shopId?: number; userFrom: string; servantId?: number }) {
    const { shopId = 0, userFrom, servantId } = params;
    if (!userFrom) throw new Error('缺少 userFrom');
    const now = Math.floor(Date.now() / 1000);
    let conv = await this.prisma.im_conversation.findFirst({
      where: { shop_id: shopId, user_from: userFrom, is_delete: 0 },
      orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
    });
    if (!conv) {
      conv = await this.prisma.im_conversation.create({
        data: {
          shop_id: shopId,
          user_from: userFrom,
          add_time: now,
          last_update_time: now,
          last_servant_id: servantId ?? 0,
          status: 0,
        },
      });
    } else if (servantId && conv.last_servant_id !== servantId) {
      conv = await this.prisma.im_conversation.update({ where: { id: conv.id }, data: { last_servant_id: servantId } });
    }
    return conv;
  }

  async markRead(params: { conversationId: number; role?: 'user' | 'servant'; shopId?: number; userFrom?: string; messageIds?: number[] }) {
    const { conversationId, role = 'user', messageIds } = params;
    if (!conversationId) throw new Error('缺少 conversationId');
    const where: any = { conversation_id: conversationId, is_read: false };
    // 只标记对方的未读
    where.type = role === 'user' ? 1 : 0;
    if (messageIds && messageIds.length) where.id = { in: messageIds };
    const updated = await this.prisma.im_message.updateMany({ where, data: { is_read: true } });
    return { updated: updated.count };
  }

  async markAllRead(params: { conversationId: number; role?: 'user' | 'servant' }) {
    return this.markRead(params);
  }

  async unreadCount(params: { shopId?: number; userFrom?: string; role?: 'user' | 'servant' }) {
    const { shopId = 0, userFrom, role = 'user' } = params;
    const whereConv: any = { is_delete: 0 };
    if (shopId) whereConv.shop_id = shopId;
    if (userFrom) whereConv.user_from = userFrom;
    const convs = await this.prisma.im_conversation.findMany({ where: whereConv, select: { id: true } });
    if (!convs.length) return { total: 0 };
    const convIds = convs.map(c => c.id);
    const total = await this.prisma.im_message.count({
      where: { conversation_id: { in: convIds }, is_read: false, type: role === 'user' ? 1 : 0 },
    });
    return { total };
  }

  async closeConversation(params: { conversationId: number }) {
    const { conversationId } = params;
    if (!conversationId) throw new Error('缺少 conversationId');
    await this.prisma.im_conversation.update({ where: { id: conversationId }, data: { status: 1 } });
    return { conversationId, status: 1 };
  }

  async deleteConversation(params: { conversationId: number }) {
    const { conversationId } = params;
    if (!conversationId) throw new Error('缺少 conversationId');
    await this.prisma.im_conversation.update({ where: { id: conversationId }, data: { is_delete: 1 } });
    return { conversationId, deleted: true };
  }
}
