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
  }

  handleConnection(client: WebSocket, req: any): void {
    try {
      const url = new URL(req.url, `ws://${req.headers.host}`);
      const token = url.searchParams.get('token') || undefined;
      const platform = url.searchParams.get('platform') || undefined;
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

  private broadcastMessage(message: any, sourceCtx: SessionContext) {
    const payload = { event: EVENT_MESSAGE, data: message };
    const raw = JSON.stringify(payload);
    this.server.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        const ctx = this.contexts.get(ws);
        if (!ctx) return;
        // 简单广播策略：同平台客服与同用户 或 所有管理员
        if (ctx.role === 'admin' || ctx.userId === message.userId) {
          ws.send(raw);
        }
      }
    });
  }

  private send(client: WebSocket, event: string, data: any) {
    try {
      client.send(JSON.stringify({ event, data }));
    } catch {}
  }
}
