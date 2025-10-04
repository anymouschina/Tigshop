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

    const recordsRaw = await this.prisma.im_message.findMany({
      where,
      orderBy: [{ id: sortOrder }],
      take: size,
    });

    // total 取该会话总消息数量（可优化：前端仅需是否还有更多）
    const total = await this.prisma.im_message.count({ where: { conversation_id: convId } });

    // 聚合用户与客服ID，批量查询资料
    const userIds = Array.from(
      new Set((recordsRaw.map((r) => r.user_id).filter((v) => !!v) as number[])),
    );
    const servantIds = Array.from(
      new Set((recordsRaw.map((r) => r.servant_id).filter((v) => !!v) as number[])),
    );

    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { user_id: { in: userIds } } })
      : ([] as any[]);
    const servants = servantIds.length
      ? await this.prisma.admin_user.findMany({ where: { admin_id: { in: servantIds } } })
      : ([] as any[]);
    const userMap: Record<number, any> = {};
    for (const u of users as any[]) userMap[u.user_id] = u;
    const servantMap: Record<number, any> = {};
    for (const s of servants as any[]) servantMap[s.admin_id] = s;

    const fmt = (sec?: number | null) =>
      sec ? new Date((sec as number) * 1000).toISOString().replace('T', ' ').substring(0, 19) : null;
    const typeText = (t?: string | null) => {
      const map: Record<string, string> = { text: '文本', image: '图片', custom: '自定义', file: '文件', video: '视频' };
      return t && map[t] ? map[t] : '文本';
    };

    const formatContent = (m: any) => {
      const t = (m.message_type || 'text') as string;
      // 统一返回对象结构
      if (t === 'text') {
        return {
          messageType: 'text',
          content: m.content ?? '',
          pic: '',
          contentCategory: null,
          order: null,
          product: null,
        };
      }
      if (t === 'image') {
        // 图片放在 pic 字段，保留 content 为空串
        const ext = (() => {
          try {
            return m.extend ? JSON.parse(m.extend) : null;
          } catch {
            return null;
          }
        })();
        const pic = (ext && (ext.pic || ext.url)) || m.content || '';
        return {
          messageType: 'image',
          content: '',
          pic: String(pic),
          contentCategory: null,
          order: null,
          product: null,
        };
      }
      // 其他自定义类型：尽量透传到 extend，同时保持通用字段
      return {
        messageType: t,
        content: '',
        pic: '',
        contentCategory: null,
        order: null,
        product: null,
      };
    };

    const records = (recordsRaw || []).map((m) => {
      const u = m.user_id ? userMap[m.user_id] : null;
      const s = m.servant_id ? servantMap[m.servant_id] : null;
      return {
        messageTypeText: typeText(m.message_type),
        id: m.id,
        conversationId: m.conversation_id,
        content: formatContent(m),
        messageType: m.message_type,
        type: m.type,
        userId: m.user_id ?? null,
        servantId: m.servant_id ?? null,
        sendTime: fmt(m.send_time),
        status: m.status ?? 1,
        extend: m.extend ?? null,
        pushStatus: m.push_status ?? 0,
        isRead: (m.is_read ? 1 : 0) as any,
        shopId: m.shop_id ?? 0,
        userFrom: (m.user_from ?? null) as any,
        user: u
          ? {
              userId: u.user_id,
              username: u.username,
              nickname: u.nickname,
              avatar: u.avatar,
            }
          : null,
        servant: s
          ? {
              adminId: s.admin_id,
              username: s.username,
              avatar: s.avatar,
            }
          : null,
      };
    });

    const pages = Math.ceil(total / size);
    const current = 1; // firstId 滚动场景默认视为第一页
    return { records, total, size, current, pages, conversationId: convId } as any;
  }

  // 发送消息（文本/图片/自定义卡片）
  async sendMessage(params: {
    conversationId?: number;
    shopId?: number;
    userFrom?: string;
    userId?: number;
    servantId?: number;
    role?: 'user' | 'servant';
    orderId?: number;
    content: any; // { messageType: 'text'|'image'|'custom'|..., content?: string, pic?: string, ... }
  }) {
    const {
      conversationId,
      shopId = 0,
      userFrom,
      userId,
      servantId,
      role = 'user',
      orderId,
      content,
    } = params;

    const now = Math.floor(Date.now() / 1000);

    // 1) 决定会话ID：优先 conversationId，其次 userFrom，再其次 userId/orderId 推断
    let convId = conversationId;
    let conv: any = null;
    if (!convId) {
      // 通过 userFrom 定位
      if (userFrom) {
        conv = await this.prisma.im_conversation.findFirst({
          where: { shop_id: shopId, user_from: userFrom, is_delete: 0 },
          orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
        });
      }

      // 通过 userId/orderId 定位
      let resolvedUserId = userId;
      if (!resolvedUserId && orderId) {
        const ord = await this.prisma.order.findUnique({ where: { order_id: Number(orderId) } });
        if (ord) resolvedUserId = ord.user_id;
      }
      if (!conv && resolvedUserId) {
        conv = await this.prisma.im_conversation.findFirst({
          where: { shop_id: shopId, user_id: resolvedUserId, is_delete: 0 },
          orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
        });
      }

      // 若仍不存在，创建一个新的会话
      if (!conv) {
        conv = await this.prisma.im_conversation.create({
          data: {
            shop_id: shopId,
            user_from: userFrom,
            user_id: resolvedUserId ?? 0,
            add_time: now,
            last_update_time: now,
            last_servant_id: servantId ?? 0,
            status: 0,
          },
        });
      }
      convId = conv.id;
    } else {
      conv = await this.prisma.im_conversation.findUnique({ where: { id: convId } });
    }

    if (!convId) throw new Error('缺少会话信息');

    // 2) 整理消息内容
    const messageType = content?.messageType || content?.type || 'text';
    let contentStr = '';
    let extendStr: string | null = null;

    switch (messageType) {
      case 'text':
        contentStr = String(content?.content ?? '');
        break;
      case 'image':
        contentStr = String(content?.pic ?? content?.url ?? '');
        extendStr = JSON.stringify(content);
        break;
      default:
        // 自定义（如订单卡片/商品卡片等）直接存入 JSON
        contentStr = JSON.stringify(content ?? {});
        extendStr = contentStr;
        break;
    }

    // 发送方类型：user=0，servant=1（未读统计中对方消息才计数）
    const senderType = role === 'servant' ? 1 : 0;

    // 3) 入库消息
    const msg = await this.prisma.im_message.create({
      data: {
        conversation_id: convId,
        content: contentStr,
        message_type: messageType,
        type: senderType,
        user_id: conv?.user_id ?? 0,
        servant_id: role === 'servant' ? (servantId ?? 0) : 0,
        send_time: now,
        status: 1,
        extend: extendStr ?? undefined,
        push_status: 0,
        is_read: false,
        shop_id: shopId,
        user_from: userFrom,
      },
    });

    // 4) 更新会话最近信息
    await this.prisma.im_conversation.update({
      where: { id: convId },
      data: {
        last_update_time: now,
        ...(role === 'servant' && servantId ? { last_servant_id: servantId } : {}),
      },
    });

    return msg;
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

  // 会话转接到指定客服
  async transfer(params: { conversationId: number; toServantId: number; fromServantId?: number; force?: boolean }) {
    const { conversationId, toServantId, fromServantId, force = false } = params;
    if (!conversationId) throw new Error('缺少 conversationId');
    if (!toServantId) throw new Error('缺少 toServantId');
    // 可选：校验客服是否存在
    const target = await this.prisma.admin_user.findFirst({ where: { admin_id: Number(toServantId) } });
    if (!target) throw new Error('目标客服不存在');

    const conv = await this.prisma.im_conversation.findUnique({ where: { id: Number(conversationId) } });
    if (!conv || conv.is_delete) throw new Error('会话不存在或已删除');

    // 来源客服校验（若指定且不强制）
    if (fromServantId && !force && Number(conv.last_servant_id ?? 0) !== Number(fromServantId)) {
      return { conversationId: conv.id, lastServantId: conv.last_servant_id ?? null, changed: false } as any;
    }

    // 已是目标客服则直接返回
    if (Number(conv.last_servant_id ?? 0) === Number(toServantId)) {
      return { conversationId: conv.id, lastServantId: conv.last_servant_id ?? null, changed: false } as any;
    }

    const now = Math.floor(Date.now() / 1000);
    const updated = await this.prisma.im_conversation.update({
      where: { id: Number(conversationId) },
      data: { last_servant_id: Number(toServantId), last_update_time: now },
    });
    return { conversationId: updated.id, lastServantId: updated.last_servant_id, changed: true } as any;
  }

  // 会话详情：根据 conversationId 或 (shopId + userFrom) 获取
  async getConversationDetail(params: { conversationId?: number; shopId?: number; userFrom?: string }) {
    const { conversationId, shopId, userFrom } = params;
    let conv: any | null = null;

    if (conversationId) {
      conv = await this.prisma.im_conversation.findFirst({ where: { id: conversationId, is_delete: 0 } });
    } else if (shopId && userFrom) {
      conv = await this.prisma.im_conversation.findFirst({
        where: { shop_id: shopId, user_from: userFrom, is_delete: 0 },
        orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
      });
    }

    if (!conv) return null;

    // 附带最近一条消息
    const lastMessage = await this.prisma.im_message.findFirst({
      where: { conversation_id: conv.id },
      orderBy: [{ id: 'desc' }],
    });

    return { ...conv, lastMessage };
  }

  // 待接入会话列表（客服侧）
  async waitServantList(params: { shopId?: number; page?: number; size?: number }) {
    const { shopId = 0, page = 1, size = 15 } = params;
    const skip = (page - 1) * size;
    const where: any = { is_delete: 0, status: 0 };
    if (shopId) where.shop_id = shopId;

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
    const convIds = convs.map((c) => c.id);

    // 未读数（客服侧，统计用户发来的未读）
    const unreadAgg = await this.prisma.im_message.groupBy({
      by: ['conversation_id'],
      where: { conversation_id: { in: convIds }, is_read: false, type: 0 }, // 用户发的
      _count: { id: true },
    });
    const unreadMap: Record<number, number> = {};
    for (const it of unreadAgg) unreadMap[it.conversation_id as number] = (it as any)._count.id;

    // 最近消息
    const lastMsgs = await this.prisma.im_message.findMany({
      where: { conversation_id: { in: convIds } },
      orderBy: [{ id: 'desc' }],
      take: convIds.length * 5,
    });
    const lastMap: Record<number, any> = {};
    for (const m of lastMsgs) if (!lastMap[m.conversation_id!]) lastMap[m.conversation_id!] = m;

    // 用户信息、客服信息
    const userIds = Array.from(new Set(convs.map((c) => c.user_id).filter((v) => !!v))) as number[];
    const servantIds = Array.from(new Set(convs.map((c) => c.last_servant_id).filter((v) => !!v))) as number[];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { user_id: { in: userIds } } })
      : ([] as any[]);
    const servants = servantIds.length
      ? await this.prisma.admin_user.findMany({ where: { admin_id: { in: servantIds } } })
      : ([] as any[]);
    const userMap: Record<number, any> = {};
    for (const u of users) userMap[u.user_id] = u;
    const servantMap: Record<number, any> = {};
    for (const s of servants) servantMap[s.admin_id] = s;

    // 每个会话首条用户消息
    const firstUserMsgMap: Record<number, any> = {};
    for (const cid of convIds) {
      const firstUser = await this.prisma.im_message.findFirst({
        where: { conversation_id: cid, type: 0 },
        orderBy: [{ send_time: 'asc' }, { id: 'asc' }],
        select: { conversation_id: true, user_id: true, send_time: true, message_type: true },
      });
      if (firstUser) firstUserMsgMap[cid] = firstUser;
    }

    const typeText = (t?: string | null) => {
      const map: Record<string, string> = { text: '文本', image: '图片', custom: '自定义', file: '文件', video: '视频' };
      return t && map[t] ? map[t] : '文本';
    };

    const records = await Promise.all(convs.map(async (c) => {
      const u = c.user_id ? userMap[c.user_id] : null;
      const s = c.last_servant_id ? servantMap[c.last_servant_id] : null;
      const firstUser = firstUserMsgMap[c.id];
      const firstUserMessage = firstUser
        ? [
            {
              messageTypeText: typeText(firstUser.message_type as any),
              conversationId: c.id,
              userId: firstUser.user_id,
              sendTime: firstUser.send_time,
              messageType: firstUser.message_type,
            },
          ]
        : [];

      // 用户最近两条消息（用于右侧预览）
      const lastTwo = await this.prisma.im_message.findMany({
        where: { conversation_id: c.id, type: 0 },
        orderBy: [{ id: 'desc' }],
        take: 2,
        select: { conversation_id: true, user_id: true, send_time: true, message_type: true, content: true },
      });
      const userLastTwoMessage = lastTwo.map((m) => ({
        messageTypeText: typeText(m.message_type as any),
        conversationId: m.conversation_id,
        userId: m.user_id,
        sendTime: m.send_time,
        messageType: m.message_type,
        content: m.content,
      }));

      return {
        id: c.id,
        userId: c.user_id ?? null,
        lastServantId: c.last_servant_id ?? 0,
        addTime: c.add_time ?? 0,
        shopId: c.shop_id ?? 0,
        userFrom: c.user_from ?? null,
        status: c.status ?? 0,
        lastUpdateTime: c.last_update_time ?? 0,
        isDelete: c.is_delete ?? 0,
        remark: c.remark ?? '',
        summary: c.summary ?? '',
        user: u
          ? { userId: u.user_id, username: u.username, nickname: u.nickname, avatar: u.avatar }
          : null,
        servant: s
          ? { adminId: s.admin_id, username: s.username, mobile: s.mobile, avatar: s.avatar }
          : null,
        // 便于前端直接读取头像
        avatar: u ? u.avatar : null,
        lastMessage: lastMap[c.id] || null,
        unread: unreadMap[c.id] || 0,
        firstUserMessage,
        userLastTwoMessage,
      };
    }));
    return { records, total, page, size };
  }

  // 咨询历史列表（可按时间范围）
  async consultHistory(params: { shopId?: number; page?: number; size?: number; timeType?: number }) {
    const { shopId = 0, page = 1, size = 15, timeType } = params;
    const skip = (page - 1) * size;
    const where: any = { is_delete: 0 };
    if (shopId) where.shop_id = shopId;

    // timeType: 1=近7天, 2=近30天, 3=近90天（默认：全部）
    const nowSec = Math.floor(Date.now() / 1000);
    let fromSec: number | undefined;
    if (timeType === 1) fromSec = nowSec - 7 * 24 * 3600;
    else if (timeType === 2) fromSec = nowSec - 30 * 24 * 3600;
    else if (timeType === 3) fromSec = nowSec - 90 * 24 * 3600;
    if (fromSec) where.last_update_time = { gte: fromSec };

    const [convs, total] = await this.prisma.$transaction([
      this.prisma.im_conversation.findMany({
        where,
        orderBy: [{ last_update_time: 'desc' }, { id: 'desc' }],
        skip,
        take: size,
      }),
      this.prisma.im_conversation.count({ where }),
    ]);

    if (!convs.length) return { records: [], total, page, size, current: page, pages: 0 } as any;
    const convIds = convs.map((c) => c.id);

    // 关联合并：用户信息、客服信息
    const userIds = convs.map((c) => c.user_id).filter((v) => !!v) as number[];
    const servantIds = convs.map((c) => c.last_servant_id).filter((v) => !!v) as number[];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { user_id: { in: userIds } } })
      : ([] as any[]);
    const servants = servantIds.length
      ? await this.prisma.admin_user.findMany({ where: { admin_id: { in: servantIds } } })
      : ([] as any[]);
    const userMap: Record<number, any> = {};
    for (const u of users) userMap[u.user_id] = u;
    const servantMap: Record<number, any> = {};
    for (const s of servants) servantMap[s.admin_id] = s;

    // 每个会话：首条用户消息、客服消息聚合
    const firstUserMsgMap: Record<number, any> = {};
    // 为避免 N+1 过多，按会话逐个查找（页尺寸较小）；
    for (const cid of convIds) {
      const firstUser = await this.prisma.im_message.findFirst({
        where: { conversation_id: cid, type: 0 },
        orderBy: [{ send_time: 'asc' }, { id: 'asc' }],
        select: { conversation_id: true, user_id: true, send_time: true, message_type: true },
      });
      if (firstUser) firstUserMsgMap[cid] = firstUser;
    }

    // 客服消息聚合（type=1）：按会话+消息类型统计数量与首/末时间
    const servantAgg = await this.prisma.im_message.groupBy({
      by: ['conversation_id', 'message_type'],
      where: { conversation_id: { in: convIds }, type: 1 },
      _count: { id: true },
      _min: { send_time: true },
      _max: { send_time: true },
    });
    const servantAggMap: Record<number, any[]> = {};
    for (const row of servantAgg as any[]) {
      const list = servantAggMap[row.conversation_id] || (servantAggMap[row.conversation_id] = []);
      list.push(row);
    }

    // 会话整体首末消息时间
    const convSpan = await this.prisma.im_message.groupBy({
      by: ['conversation_id'],
      where: { conversation_id: { in: convIds } },
      _min: { send_time: true },
      _max: { send_time: true },
    });
    const spanMap: Record<number, { first?: number | null; last?: number | null }> = {};
    for (const it of convSpan as any[]) spanMap[it.conversation_id] = { first: it._min?.send_time ?? null, last: it._max?.send_time ?? null };

    // 首次响应时间（首条客服消息 - 首条用户消息）
    const firstServantMsgMap: Record<number, any> = {};
    for (const cid of convIds) {
      const firstSrv = await this.prisma.im_message.findFirst({
        where: { conversation_id: cid, type: 1 },
        orderBy: [{ send_time: 'asc' }, { id: 'asc' }],
        select: { send_time: true },
      });
      if (firstSrv) firstServantMsgMap[cid] = firstSrv;
    }

    const fmt = (sec?: number | null) =>
      sec ? new Date((sec as number) * 1000).toISOString().replace('T', ' ').substring(0, 19) : null;
    const typeText = (t?: string | null) => {
      const map: Record<string, string> = { text: '文本', image: '图片', custom: '自定义', file: '文件', video: '视频' };
      return t && map[t] ? map[t] : '文本';
    };

    const records = convs.map((c) => {
      const u = c.user_id ? userMap[c.user_id] : null;
      const s = c.last_servant_id ? servantMap[c.last_servant_id] : null;
      const firstUser = firstUserMsgMap[c.id];
      const srvAgg = servantAggMap[c.id] || [];
      const span = spanMap[c.id] || {};
      const firstSrv = firstServantMsgMap[c.id];

      const firstUserMessage = firstUser
        ? [
            {
              messageTypeText: typeText(firstUser.message_type as any),
              conversationId: c.id,
              userId: firstUser.user_id,
              sendTime: fmt(firstUser.send_time),
              messageType: firstUser.message_type,
            },
          ]
        : [];

      const servantMessage = srvAgg.map((a: any) => ({
        messageTypeText: typeText(a.message_type),
        conversationId: c.id,
        servantId: c.last_servant_id ?? null,
        lastSendTime: a._max?.send_time ?? null,
        firstSendTime: a._min?.send_time ?? null,
        messageCount: a._count?.id ?? 0,
        messageType: a.message_type,
      }));

      const firstResponseTime = firstUser?.send_time && firstSrv?.send_time ? (firstSrv.send_time as number) - (firstUser.send_time as number) : null;
      const conversationDuration = span.first && span.last ? (span.last as number) - (span.first as number) : null;

      return {
        id: c.id,
        userId: c.user_id ?? null,
        lastServantId: c.last_servant_id ?? null,
        addTime: fmt(c.add_time) as any,
        shopId: c.shop_id ?? 0,
        userFrom: c.user_from ?? null,
        status: c.status ?? 0,
        lastUpdateTime: fmt(c.last_update_time) as any,
        isDelete: c.is_delete ?? 0,
        remark: c.remark ?? '',
        summary: c.summary ?? '',
        firstResponseTime,
        conversationDuration,
        user: u
          ? {
              userId: u.user_id,
              username: u.username,
              nickname: u.nickname,
              avatar: u.avatar,
            }
          : null,
        averageResponseTime: null, // 可后续计算更精细的平均响应
        servant: s
          ? {
              adminId: s.admin_id,
              username: s.username,
              mobile: s.mobile,
              avatar: s.avatar,
            }
          : null,
        firstUserMessage,
        servantMessage,
      };
    });

    const pages = Math.ceil(total / size);
    return { records, total, size, current: page, pages } as any;
  }
}
