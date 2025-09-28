// @ts-nocheck
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AuthorityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAuthorities = this.reflector.get<string[]>(
      "authorities",
      context.getHandler(),
    );

    if (!requiredAuthorities || requiredAuthorities.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      return false;
    }

    // 获取 prisma 实例（从 request 中获取，在 app.module.ts 中设置）
    const prisma = request.prisma;
    if (!prisma) {
      return false;
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
      return false;
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
    return requiredAuthorities.some((authority) =>
      authList.includes(authority),
    );
  }
}
