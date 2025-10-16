import {
  Injectable,
  OnModuleInit,
  INestApplication,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { getCurrentShopContext } from "../common/shop-context/shop-context";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  [key: string]: any;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();

    // 🚨 每次实例化都会打印
    this.logger.debug("🚨 PrismaService 被实例化！");

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

    // === 全局店铺隔离中间件（动态检测字段） ===
    const MODELS_WITH_SHOP_ID = new Set<string>([
      "product",
      "order",
      "order_item",
      "order_log",
      "product_attributes",
      "product_gallery",
      "product_services",
      "coupon",
      "promotion",
      "cart",
      "cart_item",
      "article",
      "article_category",
      "logistics_company",
      "aftersales",
      "aftersales_log",
      "ecard",
      "ecard_group",
      "salesman",
      "salesman_group",
      "salesman_material",
      "salesman_material_category",
      "shop_withdraw",
      "vendor_withdraw",
      "withdraw",
      "shop_account",
      "shop_settle",
      "product_comment",
      "decorate",
      "decorate_request",
      "decorate_share",
    ]); // 去除 product_sku（无 shop_id 字段）

    this.$use(async (params, next) => {
      const ctx = getCurrentShopContext();
      if (!ctx) return next(params);
      const { shopId, isSuperAdmin } = ctx;
      if (!shopId || shopId <= 0 || isSuperAdmin) return next(params);

      const skip =
        params?.args?.__skipShopIsolation === true ||
        params?.args?.where?.__skipShopIsolation === true;
      if (skip) {
        if (params?.args?.__skipShopIsolation)
          delete params.args.__skipShopIsolation;
        if (params?.args?.where?.__skipShopIsolation)
          delete params.args.where.__skipShopIsolation;
        return next(params);
      }

      if (params.model) {
        let hasShopIdField = false;
        try {
          const dmmfModel = (this as any)?._baseDmmf?.modelMap?.[params.model];
          if (dmmfModel?.fields)
            hasShopIdField = dmmfModel.fields.some(
              (f: any) => f.name === "shop_id",
            );
        } catch {}

        if (hasShopIdField && MODELS_WITH_SHOP_ID.has(params.model)) {
          const action = params.action;
          if (
            [
              "findMany",
              "findFirst",
              "count",
              "aggregate",
              "updateMany",
              "deleteMany",
            ].includes(action)
          ) {
            params.args = params.args || {};
            params.args.where = params.args.where || {};
            if (params.args.where.shop_id === undefined)
              params.args.where.shop_id = shopId;
          } else if (["update", "delete", "findUnique"].includes(action)) {
            if (params.args?.where && params.args.where.shop_id === undefined) {
              params.args.where = {
                AND: [params.args.where, { shop_id: shopId }],
              };
            }
          } else if (["create", "createMany"].includes(action)) {
            if (params.args?.data && params.args.data.shop_id === undefined)
              params.args.data.shop_id = shopId;
          }
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    try {
      this.logger.debug("⚡ PrismaService.onModuleInit 被调用");
      await this.$connect();
      this.logger.debug("✅ Prisma connected");
    } catch (err) {
      this.logger.debug(`❌ Prisma connection failed: ${err?.message || err}`);
      throw err;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
