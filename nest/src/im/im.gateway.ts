// @ts-nocheck
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { ImConversationService } from './im_conversation.service';

// 统一事件名称（与前端约定）
const EVENT_AUTH = 'auth';
const EVENT_AUTH_OK = 'auth_ok';
const EVENT_AUTH_ERROR = 'auth_error';
const EVENT_SEND = 'send';
const EVENT_MESSAGE = 'message';
const EVENT_PING = 'ping';
const EVENT_PONG = 'pong';

type ClientRole = 'admin' | 'user' | 'guest';

interface SessionContext {
  userId: number;
  adminId: number;
  shopId: number;
  role: ClientRole;
  platform?: string;
  token?: string;
}

@WebSocketGateway({
  path: '/ws', // 与提供的 wss 示例保持一致 (wss://domain/ws?...)
  cors: { origin: '*', credentials: false },
})
export class ImGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // 静态单例引用，确保 HTTP 层拿到的就是实际承载连接的实例
  static instance: ImGateway | null = null;
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ImGateway.name);
  // 保存客户端上下文
  private contexts = new WeakMap<WebSocket, SessionContext>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly imConversation: ImConversationService,
  ) {}

  afterInit(): void {
    this.logger.log('IM WebSocket Gateway initialized');
    ImGateway.instance = this; // 初始化时设置单例引用
    // 周期性输出客户端数量，便于排查没有连接的情况
    setInterval(() => {
      try {
        const size = (this.server?.clients && (this.server.clients as any).size) || 0;
        this.logger.debug(`WS clients heartbeat size=${size}`);
      } catch {}
    }, 30000).unref?.();
  }

  handleConnection(client: WebSocket, req: any): void {
    try {
      const url = new URL(req.url, `ws://${req.headers.host}`);
      const token = url.searchParams.get('token') || undefined;
      const platform = url.searchParams.get('platform') || undefined;
      this.logger.debug(`WS connection incoming path=${url.pathname} token=${token ? 'yes' : 'no'} platform=${platform || ''}`);
      if (token) {
        this.authenticate(client, token, platform);
      } else {
        this.send(client, EVENT_AUTH_ERROR, { message: 'missing token' });
      }
    } catch (e) {
      this.logger.error('handleConnection error', e as any);
      this.send(client, EVENT_AUTH_ERROR, { message: 'connection error' });
    }
  }

  handleDisconnect(client: WebSocket): void {
    const ctx = this.contexts.get(client);
    if (ctx) {
      this.logger.log(`Client disconnected role=${ctx.role} userId=${ctx.userId} adminId=${ctx.adminId}`);
    }
  }

  private authenticate(client: WebSocket, token: string, platform?: string) {
    try {
      const secret = process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET || 'tigshop';
      const decoded: any = jwt.verify(token, secret);
      // PHP token 中 isAdmin / userId 字段
      const isAdmin = decoded?.isAdmin === true || decoded?.is_admin === 1 || decoded?.role === 'admin';
      const userId = Number(decoded?.userId || decoded?.user_id || 0);
      const adminId = isAdmin ? Number(decoded?.userId || decoded?.admin_id || userId) : 0;
      const role: ClientRole = isAdmin ? 'admin' : userId > 0 ? 'user' : 'guest';
      const ctx: SessionContext = { userId: userId || 0, adminId, role, shopId: 0, token, platform };
      this.contexts.set(client, ctx);
      this.send(client, EVENT_AUTH_OK, { role, userId: ctx.userId, adminId: ctx.adminId });
      this.logger.log(`Client authenticated role=${role} userId=${ctx.userId} adminId=${ctx.adminId} totalClients=${(this.server?.clients && (this.server.clients as any).size) || 0}`);
    } catch (e) {
      this.send(client, EVENT_AUTH_ERROR, { message: 'invalid token' });
      client.close();
    }
  }

  // 统一处理收到的文本帧(JSON)
  @SubscribeMessage(EVENT_SEND)
  async onSend(@MessageBody() payload: any, @ConnectedSocket() client: WebSocket) {
    const ctx = this.contexts.get(client);
    if (!ctx) {
      this.send(client, EVENT_AUTH_ERROR, { message: 'unauthenticated' });
      return;
    }
    try {
      const { conversationId, content, shopId, userFrom, orderId } = payload || {};
      // role 决定 servantId / userId
      const role = ctx.role;
      const sendParams: any = {
        conversationId: Number(conversationId) || undefined,
        content,
        shopId: Number(shopId) || 0,
        userFrom,
        orderId: Number(orderId) || undefined,
        role: role === 'admin' ? 'servant' : 'user',
      };
      if (role === 'admin') {
        sendParams.servantId = ctx.adminId;
      } else if (role === 'user') {
        sendParams.userId = ctx.userId;
      }
      const msg = await this.imConversation.sendMessage(sendParams);
      this.broadcastMessage(msg, ctx);
    } catch (e) {
      this.send(client, 'send_error', { message: (e as any)?.message || 'send failed' });
    }
  }

  // 简单 Ping/Pong
  @SubscribeMessage(EVENT_PING)
  onPing(@ConnectedSocket() client: WebSocket) {
    this.send(client, EVENT_PONG, { ts: Date.now() });
  }

  // 兼容前端发送 {type:'heartBeat'} 的心跳，直接回 echo
  @SubscribeMessage('heartBeat')
  onHeartBeat(@ConnectedSocket() client: WebSocket) {
    try { client.send(JSON.stringify({ type: 'heartBeat', data: { ts: Date.now() } })); } catch {}
  }

  // 对外公开用于 HTTP 调用的推送方法
  public pushMessage(message: any) {
    try {
      // 若当前实例没有 server 但存在单例且单例不同，使用单例转发
      if ((!this.server || !(this.server as any).clients) && ImGateway.instance && ImGateway.instance !== this) {
        return ImGateway.instance.pushMessage(message);
      }
      const srv = this.server;
      if (!srv) {
        this.logger.warn('pushMessage aborted: server not ready');
        return;
      }
  const payload = { type: EVENT_MESSAGE, data: [message] };
  const raw = JSON.stringify(payload);
      // message.type: 按 service 约定 user 发出的=1, servant 发出的=2
      const senderType = Number(message?.type); // 1 用户消息 -> 推给管理员; 2 客服消息 -> 推给对应用户
      const targetUserId = Number(message?.userId ?? 0) || 0; // 会话用户 id
      let delivered = 0;
      (srv.clients || []).forEach?.((ws: WebSocket) => {
        try {
          if (ws.readyState !== ws.OPEN) return;
          const ctx = this.contexts.get(ws);
          if (!ctx) return;
          // 只发给对端：
          // 客服消息 (senderType=2) -> 目标用户 (ctx.role=user && ctx.userId=targetUserId)
          // 用户消息 (senderType=1) -> 管理员 (ctx.role=admin)
          let match = false;
          if (senderType === 2) {
            if (ctx.role === 'user' && targetUserId > 0 && ctx.userId === targetUserId) match = true;
          } else if (senderType === 1) {
            if (ctx.role === 'admin') match = true;
          }
          if (match) {
            ws.send(raw);
            delivered++;
          }
        } catch (e) {
          this.logger.warn(`pushMessage send error: ${(e as any)?.message}`);
        }
      });
      this.logger.log(`pushMessage broadcast event=message id=${message?.id} senderType=${senderType} targetUserId=${targetUserId} delivered=${delivered} clients=${(srv.clients && (srv.clients as any).size) || 0}`);
    } catch (e) {
      this.logger.error('pushMessage fatal error', e as any);
    }
  }

  private broadcastMessage(message: any, sourceCtx: SessionContext) {
    // 与 pushMessage 一致格式
    const payload = { type: EVENT_MESSAGE, data: [message] };
    const raw = JSON.stringify(payload);
    const senderType = Number(message?.type); // 1 用户->管理员, 2 客服->用户
    const targetUserId = Number(message?.userId ?? 0) || 0;
    this.server.clients.forEach((ws) => {
      if (ws.readyState !== ws.OPEN) return;
      const ctx = this.contexts.get(ws);
      if (!ctx) return;
      if (senderType === 1) {
        // 用户消息给管理员
        if (ctx.role === 'admin') { try { ws.send(raw); } catch {} }
      } else if (senderType === 2) {
        // 客服消息给对应用户
        if (ctx.role === 'user' && targetUserId > 0 && ctx.userId === targetUserId) { try { ws.send(raw); } catch {} }
      }
    });
  }

  // 广播已读事件 (type: 'read')
  public pushReadEvent(info: { conversationId?: number | null; shopId?: number; userId?: number; servantId?: number; time?: string }) {
    try {
      if ((!this.server || !(this.server as any).clients) && ImGateway.instance && ImGateway.instance !== this) {
        return ImGateway.instance.pushReadEvent(info);
      }
      const srv = this.server;
      if (!srv) return;
      const payload = { type: 'read', data: [info] };
      const raw = JSON.stringify(payload);
      (srv.clients || []).forEach?.((ws: WebSocket) => {
        if (ws.readyState !== ws.OPEN) return;
        // 已读事件：只通知管理员与对应用户
        const ctx = this.contexts.get(ws);
        if (!ctx) return;
        if (ctx.role === 'admin' || (info.userId && ctx.userId === info.userId)) {
          try { ws.send(raw); } catch {}
        }
      });
    } catch (e) {
      this.logger.warn('pushReadEvent error', e as any);
    }
  }

  private send(client: WebSocket, event: string, data: any) {
    try {
      // 兼容：同时提供 event 与 type，前端只监听其一也能工作
      client.send(JSON.stringify({ event, type: event, data }));
    } catch {}
  }
}
