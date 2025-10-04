// @ts-nocheck
import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as passport from 'passport';

// 按顺序尝试 admin-jwt (客服/后台) → jwt (前台用户)。admin 失败不会立刻抛错，而是自动降级再试用户策略。
@Injectable()
export class HybridImAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // 包装成 promise 方式调用 passport.authenticate
    const execStrategy = (name: string) => new Promise<any>((resolve) => {
      passport.authenticate(name, { session: false }, (err, user, info) => {
        if (err) return resolve({ ok: false, err, info });
        if (!user) return resolve({ ok: false, err: null, info });
        return resolve({ ok: true, user });
      })(request, response, () => null);
    });

    // 先试 admin-jwt
    const adminRes = await execStrategy('admin-jwt');
    if (adminRes.ok) {
      this.normalizeUser(adminRes.user, true);
      request.user = adminRes.user;
      return true;
    }

    // 再试普通用户 jwt
    const userRes = await execStrategy('jwt');
    if (userRes.ok) {
      this.normalizeUser(userRes.user, false);
      request.user = userRes.user;
      return true;
    }

    // 两者都失败，返回统一风格
    const body = { code: 401, message: '请先登录', data: null, timestamp: new Date().toISOString(), path: request.url };
    throw new HttpException(body, 200);
  }

  private normalizeUser(user: any, isAdmin: boolean) {
    if (!user) return;
    if (isAdmin) {
      user.userId = user.userId || user.admin_id || user.adminId;
      user.role = 'admin';
      user.isAdmin = true;
    } else {
      user.userId = user.userId || user.user_id || user.id;
      if (!user.role || user.role === 'admin') user.role = 'user';
      user.isAdmin = false;
    }
  }
}
