// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../../auth/decorators/public.decorator";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    // Public 路由直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 已登录且是管理员
    if (
      request.user &&
      (request.user.role === "admin" || request.user.admin === true)
    ) {
      return true;
    }

    // 未登录（无 token 或解析失败） -> 按 PHP 风格返回 HTTP 200，业务码 401
    const isLoggedIn = !!request.user;
    const body = {
      code: isLoggedIn ? 403 : 401,
      message: isLoggedIn ? "无权限访问" : "请先登录",
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    try {
      response.status(200).json(body);
    } catch (_) {
      // fallback，尽量结束响应
      try {
        response.status(200).send(body);
      } catch {}
    }
    return false;
  }
}
