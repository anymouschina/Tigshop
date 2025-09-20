import {
  Injectable,
  OnModuleInit,
  INestApplication,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

// Central Prisma service used across modules. Some modules import this via
// different relative paths, so we also add small re-export shims elsewhere.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Allow unknown dynamic properties to reduce compile-time friction
  [key: string]: any;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    // Provide runtime aliases for common camelCase vs snake_case usages
    const aliasMap: Record<string, string> = {
      // tables commonly referenced in camelCase across the codebase
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
      await this.$connect();
      this.logger.log("Prisma connected");
    } catch (err) {
      this.logger.error(`Prisma connection failed: ${err?.message || err}`);
      throw err;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    // In Prisma >=5, $on('beforeExit') is not typed; use Node's process event instead.
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
