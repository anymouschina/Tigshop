// @ts-nocheck
import { Injectable, ExecutionContext, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// 同时尝试 admin-jwt 与 jwt，谁成功用谁；都失败则返回统一未登录结构
@Injectable()
export class AnyJwtAuthGuard extends AuthGuard(['admin-jwt', 'jwt']) {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context) as any;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.prisma = this.prisma;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return user ?? null;

    if (err || !user) {
      const body = { code: 401, message: '请先登录', data: null, timestamp: new Date().toISOString(), path: request.url };
      throw new HttpException(body, 401);
    }

    // 规范化 user 对象：区分 admin 与 普通用户；统一字段 userId
    if (user.admin_id && !user.userId) {
      user.userId = user.admin_id; // 保持已有字段引用兼容
      user.role = 'admin';
      user.isAdmin = true;
    } else if (user.user_id && !user.userId) {
      user.userId = user.user_id;
      user.role = user.role || 'user';
    } else if (!user.role) {
      user.role = 'user';
    }
    return user;
  }
}
