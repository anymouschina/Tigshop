import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  [key: string]: any;

  constructor() {
    super();
    // Alias common camelCase model names to snake_case Prisma delegates
    const aliasMap: Record<string, string> = {
      userAddress: "user_address",
      userCompany: "user_company",
      userCoupon: "user_coupon",
      userAuthorize: "user_authorize",
      userMessageLog: "user_message_log",
      userPointsLog: "user_points_log",
      userRank: "user_rank",
      orderInvoice: "order_invoice",
      userInvoice: "user_invoice",
    };
    Object.entries(aliasMap).forEach(([alias, actual]) => {
      Object.defineProperty(this, alias, {
        get: () => (this as any)[actual],
        enumerable: false,
        configurable: true,
      });
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
