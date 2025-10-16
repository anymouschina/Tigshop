// @ts-nocheck
import { CanActivate, ExecutionContext, Injectable, HttpException, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class AuthorityGuard implements CanActivate {
  private logger = new Logger(AuthorityGuard.name);
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAuthorities = this.reflector.get<string[]>(
      "authorities",
      context.getHandler(),
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || !requiredAuthorities || requiredAuthorities.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    this.logger?.debug(`AuthorityGuard: user=${JSON.stringify(user)}, requiredAuthorities=${requiredAuthorities.join(",")}`);
    if (!user || !user.userId) {
      const body = {
        code: 401,
        message: "请先登录",
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      throw new HttpException(body, 401);
    }

    // 获取 prisma 实例（从 request 中获取，在 app.module.ts 中设置）
    const prisma = request.prisma;
    if (!prisma) {
      // 没有 prisma 则跳过细粒度权限校验
      return true;
    }

    // 获取管理员信息
    const adminUser = await prisma.admin_user.findUnique({
      where: { admin_id: user.userId },
      select: {
        admin_type: true,
        auth_list: true,
        shop_id: true,
        merchant_id: true,
      },
    });

    if (!adminUser) {
      const body = { code: 401, message: "请先登录", data: null };
      throw new HttpException(body, 401);
    }

    // 超级管理员拥有所有权限
    if (adminUser.admin_type === "admin") {
      return true;
    }

    // 解析权限列表
    let authList: string[] = [];
    if (adminUser.auth_list) {
      try {
        authList = JSON.parse(adminUser.auth_list);
      } catch (e) {
        authList = adminUser.auth_list.split(",").filter(Boolean);
      }
    }

    // 检查店铺管理员权限
    if (adminUser.shop_id) {
      const adminUserShop = await prisma.admin_user_shop.findFirst({
        where: {
          admin_id: user.userId,
          shop_id: adminUser.shop_id,
          is_using: 1,
        },
        select: { auth_list: true },
      });

      if (adminUserShop?.auth_list) {
        try {
          const shopAuthList = JSON.parse(adminUserShop.auth_list);
          authList = [...authList, ...shopAuthList];
        } catch (e) {
          const shopAuthList = adminUserShop.auth_list
            .split(",")
            .filter(Boolean);
          authList = [...authList, ...shopAuthList];
        }
      }
    }

    // 检查是否有所需权限
    const pass = requiredAuthorities.some((authority) => authList.includes(authority));
    if (!pass) {
      const body = {
        code: 403,
        message: "无权限访问",
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      throw new HttpException(body, 403);
    }
    return true;
  }
}
