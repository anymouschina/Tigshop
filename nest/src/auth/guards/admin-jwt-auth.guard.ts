// @ts-nocheck
import { HttpException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../../prisma/prisma.service";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/auth/decorators/public.decorator";

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard("admin-jwt") {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  canActivate(context) {
    // Public 路由直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 仍注入 prisma，供后续 Guard 需要时可用
      const request = context.switchToHttp().getRequest();
      request.prisma = this.prismaService;
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();

    // 将 PrismaService 添加到 request 中，供 AuthorityGuard 使用
    request.prisma = this.prismaService;

    // Public 路由不要求 user
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return user ?? null;
    }

    // 鉴权失败时，按 PHP 风格返回 HTTP 200，业务码 401
    if (err || !user) {
      const body = {
        code: 401,
        message: "请先登录",
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      throw new HttpException(body, 200);
    }

    return user;
  }
}
