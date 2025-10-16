// @ts-nocheck
import {
  Injectable,
  ExecutionContext,
  HttpException,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../../prisma/prisma.service";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

// 同时尝试 jwt 与 admin-jwt，优先普通用户；避免普通用户 token 先被 admin 策略误判导致 401。
@Injectable()
export class AnyJwtAuthGuard extends AuthGuard(["jwt", "admin-jwt"]) {
  private readonly logger = new Logger(AnyJwtAuthGuard.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {
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
    // —— 调试日志 ——
    const authHeader = request.headers?.authorization;
    this.logger.debug(
      `AuthGuard handleRequest path=${request.url} authHeaderPresent=${!!authHeader} strategies=[jwt,admin-jwt] err=${err ? err.message || err.name : "none"} info=${info ? info.message || info.name || JSON.stringify(info) : "none"} userPresent=${!!user}`,
    );

    if (err || !user) {
      // 针对 admin 策略失败但仍可能普通用户可用的场景：如果 info 指向 admin 角色缺失，尝试从解析过的 request.user (有的 passport 会附加) 回退
      if (!user && request.user) {
        this.logger.warn(
          `Fallback using request.user after strategy error: keys=${Object.keys(request.user).join(",")}`,
        );
        user = request.user; // 尝试兜底
      }
    }

    if (!user) {
      const body = {
        code: 401,
        message: "请先登录",
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      this.logger.warn(
        `Unauthorized: issuing 401 for path=${request.url} reason=${err?.message || info?.message || "NO_USER"}`,
      );
      throw new HttpException(body, 401);
    }

    // 规范化 user 对象：区分 admin 与 普通用户；统一字段 userId
    if (user.admin_id && !user.userId) {
      user.userId = user.admin_id; // 保持已有字段引用兼容
      user.role = "admin";
      user.isAdmin = true;
    } else if (user.user_id && !user.userId) {
      user.userId = user.user_id;
      user.role = user.role || "user";
    } else if (!user.role) {
      user.role = "user";
    }
    this.logger.debug(
      `AuthGuard normalized user userId=${user.userId} role=${user.role}`,
    );
    return user;
  }
}
