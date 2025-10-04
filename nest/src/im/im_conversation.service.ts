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

  async sendMessage(params: {
    conversationId?: number;
    shopId?: number;
    userFrom?: string;
    content: string;
    messageType?: string; // 例如: text / image / system
    type?: number;        // 发送方类型: 0=用户 1=客服 (待确认, 先占位)
    userId?: number;      // 用户ID
    servantId?: number;   // 客服ID
  }) {
    const now = Math.floor(Date.now() / 1000);
    let { conversationId, shopId = 0, userFrom = '', content, messageType = 'text', type = 0, userId, servantId } = params as any;

    // 统一内容为字符串；允许 number / boolean；对象则 JSON 序列化（前端可后续改成发送纯字符串）
    if (content === null || content === undefined) {
      throw new Error('内容缺失');
    }
    if (typeof content !== 'string') {
      if (typeof content === 'object') {
        try { content = JSON.stringify(content); } catch { content = String(content); }
      } else {
        content = String(content);
      }
    }
    content = content.trim();
    if (!content) throw new Error('内容不能为空');

    messageType = messageType || 'text';
    if (messageType.length > 32) messageType = messageType.slice(0, 32);
    // 简单长度限制，避免异常超长消息冲击 DB（可以改为配置化）
    if (content.length > 4000) content = content.slice(0, 4000);

    // 会话处理：优先使用传入 conversationId；否则按 shopId + userFrom 查找 / 创建
    if (!conversationId) {
      if (!userFrom) throw new Error('缺少 userFrom');
      const exist = await this.prisma.im_conversation.findFirst({
        where: { shop_id: shopId, user_from: userFrom, is_delete: 0 },
        orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
      });
      if (exist) {
        conversationId = exist.id;
      } else {
        const created = await this.prisma.im_conversation.create({
          data: {
            shop_id: shopId,
            user_from: userFrom,
            add_time: now,
            last_update_time: now,
            status: 0,
            last_servant_id: servantId ?? 0,
          },
        });
        conversationId = created.id;
      }
    }

    // 插入消息
    const message = await this.prisma.im_message.create({
      data: {
        conversation_id: conversationId,
        content,
        message_type: messageType,
        type,
        user_id: userId,
        servant_id: servantId,
        send_time: now,
        shop_id: shopId,
        user_from: userFrom,
      },
    });

    // 更新会话更新时间 & 最近客服
    await this.prisma.im_conversation.update({
      where: { id: conversationId },
      data: { last_update_time: now, last_servant_id: servantId ?? undefined },
    });

    return { conversationId, message };
  }
}
