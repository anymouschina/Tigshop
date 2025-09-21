import {
    Injectable,
    OnModuleInit,
    INestApplication,
    Logger,
  } from "@nestjs/common";
  import { PrismaClient } from "@prisma/client";
  
  @Injectable()
  export class PrismaService extends PrismaClient implements OnModuleInit {
    [key: string]: any;
    private readonly logger = new Logger(PrismaService.name);
  
    constructor() {
      super();
  
      // 🚨 每次实例化都会打印
      this.logger.warn("🚨 PrismaService 被实例化！");
  
      // 打印调用栈（只保留你项目相关路径，过滤掉 node_modules）
      const stack = (new Error().stack || "")
        .split("\n")
        .filter((line) => line.includes("src/")) // 只显示项目代码调用栈
        .join("\n");
      this.logger.debug("调用栈:\n" + stack);
  
      // ✅ aliasMap 保留你的逻辑
      const aliasMap: Record<string, string> = {
        userInvoice: "user_invoice",
        orderInvoice: "order_invoice",
        userCompany: "user_company",
        userAuthorize: "user_authorize",
        userMessageLog: "user_message_log",
        userPointsLog: "user_points_log",
        userRank: "user_rank",
        systemConfig: "config",
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
      try {
        this.logger.warn("⚡ PrismaService.onModuleInit 被调用");
        await this.$connect();
        this.logger.log("✅ Prisma connected");
      } catch (err) {
        this.logger.error(`❌ Prisma connection failed: ${err?.message || err}`);
        throw err;
      }
    }
  
    async enableShutdownHooks(app: INestApplication) {
      process.on("beforeExit", async () => {
        await app.close();
      });
    }
  }
  