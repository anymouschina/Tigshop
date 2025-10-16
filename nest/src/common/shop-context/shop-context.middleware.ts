// @ts-nocheck
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { shopContext } from "./shop-context";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ShopContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const headerVal = (req.headers["x-shop-id"] ??
      req.headers["x-shopid"]) as any;
    let headerShopId = Number(headerVal);
    if (!Number.isFinite(headerShopId) || headerShopId <= 0) headerShopId = 0;

    let isSuper = false;
    const adminId = (req as any).user?.userId;
    if (adminId) {
      try {
        const row = await this.prisma.admin_user.findUnique({
          where: { admin_id: adminId },
          select: { admin_type: true, shop_id: true },
        });
        if (row) {
          isSuper = row.admin_type === "admin" || row.admin_type === 1;
          if (!isSuper && headerShopId === 0) {
            headerShopId = row.shop_id || 0; // fallback user bound shop
          }
        }
      } catch {}
    }

    shopContext.run({ shopId: headerShopId, isSuperAdmin: isSuper }, () =>
      next(),
    );
  }
}
