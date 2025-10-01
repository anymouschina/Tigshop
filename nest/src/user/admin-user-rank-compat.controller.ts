// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin API - 会员等级(兼容)")
@Controller("adminapi/user/userRank")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminUserRankCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("list")
  @ApiOperation({ summary: "会员等级列表（兼容）" })
  @Authorities("levelManageManage")
  async list(@Query() q: any) {
    // 入参兼容：rankName/rank_name, sortField/sort_field, sortOrder/sort_order
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sortField ?? q.sort_field ?? "rank_id").toString();
    const sortOrder = ((q.sortOrder ?? q.sort_order ?? "asc").toString().toLowerCase() === "desc" ? "desc" : "asc") as any;
    const rankName = ((q.rankName ?? q.rank_name) || "").toString().trim();

    const where: any = {};
    if (rankName) where.rank_name = { contains: rankName };

    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_rank.findMany({ where, skip, take: size, orderBy: { [sortField]: sortOrder } }),
      (this.prisma as any).user_rank.count({ where }),
    ]);

    // 字段映射与类型对齐 PHP
    const mapDiscount = (v: any) => {
      if (v === undefined || v === null) return "0.0";
      try {
        if (typeof v === "object" && typeof v.toString === "function") return v.toString();
        return String(v);
      } catch {
        return "0.0";
      }
    };
    const parseRights = (v: any) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try {
          const arr = JSON.parse(v);
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const records = rows.map((r: any) => ({
      rankId: Number(r.rank_id),
      rankName: r.rank_name ?? "",
      // 保持单位为“分”（整数），避免前端重复换算导致回显放大
      minGrowthPoints: Number(r.min_growth_points ?? 0),
      maxGrowthPoints: Number(r.max_growth_points ?? 0),
      discount: mapDiscount(r.discount),
      showPrice: Number(r.show_price ?? 1),
      rankType: 0,
      rankLogo: r.rank_logo ?? "",
      rankIco: r.rank_ico ?? "",
      rankBg: r.rank_bg ?? "",
      rankPoint: r.rank_point ?? "0",
      freeShipping: Number(r.free_shipping ?? 0),
      rankCardType: Number(r.rank_card_type ?? 1),
      rights: parseRights(r.rights),
      rankLevel: String(r.rank_level ?? ""),
    }));

    // 读取 rank_config
    let cfg = await (this.prisma as any).config.findFirst({ where: { biz_code: "rank_config" } });
    let cfgData: any = { type: 2, rankAfterMonth: 12, useMonth: 12 };
    if (cfg?.biz_val) {
      try {
        const parsed = JSON.parse(cfg.biz_val);
        if (parsed && typeof parsed === "object") cfgData = { ...cfgData, ...parsed };
      } catch {}
    }
    if (!cfg) {
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      cfg = await (this.prisma as any).config.create({
        data: { biz_code: "rank_config", biz_val: JSON.stringify(cfgData), create_time: nowSec, update_time: nowSec },
      });
    }
    const rankConfig = {
      id: typeof cfg.id === "bigint" ? Number(cfg.id) : Number(cfg.id ?? 0),
      code: "rank_config",
      rankType: Number(cfgData?.type ?? 2),
      data: {
        type: Number(cfgData?.type ?? 2),
        rankAfterMonth: Number(cfgData?.rankAfterMonth ?? 12),
        useMonth: Number(cfgData?.useMonth ?? 12),
      },
    };

    return { code: 0, message: "success", data: { userRank: { records, total }, rankConfig } };
  }

  // 兼容前端可能调用的 /listByPro 路由（别名，返回同 list）
  @Get("listByPro")
  @ApiOperation({ summary: "会员等级列表（Pro 版别名，兼容）" })
  @Authorities("levelManageManage")
  async listByPro(@Query() q: any) {
    // 与 list 完全一致的契约（别名路由）
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sortField ?? q.sort_field ?? "rank_id").toString();
    const sortOrder = ((q.sortOrder ?? q.sort_order ?? "asc").toString().toLowerCase() === "desc" ? "desc" : "asc") as any;
    const rankName = ((q.rankName ?? q.rank_name) || "").toString().trim();

    const where: any = {};
    if (rankName) where.rank_name = { contains: rankName };

    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_rank.findMany({ where, skip, take: size, orderBy: { [sortField]: sortOrder } }),
      (this.prisma as any).user_rank.count({ where }),
    ]);

    const mapDiscount = (v: any) => {
      if (v === undefined || v === null) return "0.0";
      try {
        if (typeof v === "object" && typeof v.toString === "function") return v.toString();
        return String(v);
      } catch {
        return "0.0";
      }
    };
    const parseRights = (v: any) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try {
          const arr = JSON.parse(v);
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const records = rows.map((r: any) => ({
      rankId: Number(r.rank_id),
      rankName: r.rank_name ?? "",
      // 保持单位为“分”（整数），避免前端重复换算导致回显放大
      minGrowthPoints: Number(r.min_growth_points ?? 0),
      maxGrowthPoints: Number(r.max_growth_points ?? 0),
      discount: mapDiscount(r.discount),
      showPrice: Number(r.show_price ?? 1),
      rankType: 0,
      rankLogo: r.rank_logo ?? "",
      rankIco: r.rank_ico ?? "",
      rankBg: r.rank_bg ?? "",
      rankPoint: r.rank_point ?? "0",
      freeShipping: Number(r.free_shipping ?? 0),
      rankCardType: Number(r.rank_card_type ?? 1),
      rights: parseRights(r.rights),
      rankLevel: String(r.rank_level ?? ""),
    }));

    let cfg = await (this.prisma as any).config.findFirst({ where: { biz_code: "rank_config" } });
    let cfgData: any = { type: 2, rankAfterMonth: 12, useMonth: 12 };
    if (cfg?.biz_val) {
      try {
        const parsed = JSON.parse(cfg.biz_val);
        if (parsed && typeof parsed === "object") cfgData = { ...cfgData, ...parsed };
      } catch {}
    }
    if (!cfg) {
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      cfg = await (this.prisma as any).config.create({
        data: { biz_code: "rank_config", biz_val: JSON.stringify(cfgData), create_time: nowSec, update_time: nowSec },
      });
    }
    const rankConfig = {
      id: typeof cfg.id === "bigint" ? Number(cfg.id) : Number(cfg.id ?? 0),
      code: "rank_config",
      rankType: Number(cfgData?.type ?? 2),
      data: {
        type: Number(cfgData?.type ?? 2),
        rankAfterMonth: Number(cfgData?.rankAfterMonth ?? 12),
        useMonth: Number(cfgData?.useMonth ?? 12),
      },
    };

    return { code: 0, message: "success", data: { userRank: { records, total }, rankConfig } };
  }

  @Get("detail")
  @ApiOperation({ summary: "会员等级详情（兼容）" })
  @Authorities("levelManageManage")
  async detail(@Query() q: any) {
    // 兼容 rank_type / rankType
    const rankTypeParam = Number(q.rankType ?? q.rank_type ?? 0);

    // 1) 获取所有会员等级列表（按成长值排序）
    const userRanks = await (this.prisma as any).user_rank.findMany({
      orderBy: { min_growth_points: "asc" },
    });

    // 转换为 PHP 期望的字段命名与类型
    const mapDiscount = (v: any) => {
      if (v === undefined || v === null) return "0.0";
      try {
        // Prisma Decimal 兼容：调用 toString()
        if (typeof v === "object" && typeof v.toString === "function") {
          return v.toString();
        }
        return String(v);
      } catch {
        return "0.0";
      }
    };
    const parseRights = (v: any) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try {
          const arr = JSON.parse(v);
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const userRankList = (userRanks && userRanks.length > 0)
      ? userRanks.map((r: any) => ({
          rankId: Number(r.rank_id),
          rankName: r.rank_name ?? "",
          // 保持单位为“分”（整数），避免前端重复换算导致回显放大
          minGrowthPoints: Number(r.min_growth_points ?? 0),
          maxGrowthPoints: Number(r.max_growth_points ?? 0),
          discount: mapDiscount(r.discount), // 字符串
          showPrice: Number(r.show_price ?? 1),
          rankType: 0, // 与 PHP 示例保持一致
          rankLogo: r.rank_logo ?? "",
          rankIco: r.rank_ico ?? "",
          rankBg: r.rank_bg ?? "",
          rankPoint: r.rank_point ?? "0",
          freeShipping: Number(r.free_shipping ?? 0),
          rankCardType: Number(r.rank_card_type ?? 1),
          rights: parseRights(r.rights), // 数组
          rankLevel: String(r.rank_level ?? ""),
        }))
      : [
          {
            rankId: 1,
            rankName: "普通会员",
            minGrowthPoints: 0,
            maxGrowthPoints: 0,
            discount: "0.0",
            showPrice: 1,
            rankType: 0,
            rankLogo: "",
            rankIco: "",
            rankBg: "",
            rankPoint: "0",
            freeShipping: 0,
            rankCardType: 1,
            rights: [],
            rankLevel: "1",
          },
        ];

    // 2) 读取/初始化 rank_config（从 config 表 biz_code=rank_config）
    let rc = await (this.prisma as any).config.findFirst({ where: { biz_code: "rank_config" } });
    let rcData: any = { type: 2, rankAfterMonth: 12, useMonth: 12 };
    if (rc?.biz_val) {
      try {
        const parsed = JSON.parse(rc.biz_val);
        if (parsed && typeof parsed === "object") rcData = { ...rcData, ...parsed };
      } catch {}
    }
    if (!rc) {
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      rc = await (this.prisma as any).config.create({
        data: {
          biz_code: "rank_config",
          biz_val: JSON.stringify(rcData),
          create_time: nowSec,
          update_time: nowSec,
        },
      });
    }
  // 顶层 rankType：以传入值优先，其次默认 1（与 PHP 示例一致），不强制跟随配置 type
  const resolvedRankType = Number(rankTypeParam || 1);
    const userRankConfig = {
      id: typeof rc.id === "bigint" ? Number(rc.id) : Number(rc.id ?? 0),
      code: "rank_config",
      rankType: Number(rcData?.type ?? 2),
      data: {
        type: Number(rcData?.type ?? 2),
        rankAfterMonth: Number(rcData?.rankAfterMonth ?? 12),
        useMonth: Number(rcData?.useMonth ?? 12),
      },
    };

    // 3) 读取成长配置 grow_config（如不存在则给空对象/默认规则）
    const gc = await (this.prisma as any).config.findFirst({ where: { biz_code: "grow_config" } });
    let growUpSetting: any = {};
    if (gc?.biz_val) {
      try {
        const parsed = JSON.parse(gc.biz_val);
        if (parsed && typeof parsed === "object") growUpSetting = parsed;
      } catch {
        growUpSetting = {};
      }
    }
    // 若无配置，给出合理默认值（与 PHP 保持一致）
    if (!growUpSetting || Object.keys(growUpSetting).length === 0) {
      growUpSetting = {
        buyOrder: 1,
        buyOrderNumber: 1,
        buyOrderGrowth: 5,
        evpi: 1,
        evpiGrowth: 1,
        bindPhone: 1,
        bindPhoneGrowth: 1,
      };
    }

    return {
      code: 0,
      message: "success",
      data: {
        rankType: resolvedRankType,
        userRankList,
        userRankConfig,
        growUpSetting,
      },
    };
  }

  @Post("update")
  @ApiOperation({ summary: "更新会员等级（兼容）" })
  @Authorities("levelManageManage")
  async update(@Body() body: any) {
    // 兼容参数名
    const rankType = Number(body.rankType ?? body.rank_type ?? 0);
    const userRankConfig = body.userRankConfig ?? body.user_rank_config ?? {};
    const growUpSetting = body.growUpSetting ?? body.grow_up_setting ?? {};
    const items: any[] = Array.isArray(body.data) ? body.data : [];

    // 1) 更新 rank_config
    {
      const cfgPayload = {
        type: Number(userRankConfig?.type ?? userRankConfig?.rankType ?? 2),
        rankAfterMonth: Number(userRankConfig?.rankAfterMonth ?? 12),
        useMonth: Number(userRankConfig?.useMonth ?? 12),
      };
      const existed = await (this.prisma as any).config.findFirst({ where: { biz_code: "rank_config" } });
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      const biz_val = JSON.stringify(cfgPayload);
      if (existed) {
        await (this.prisma as any).config.update({
          where: { id: existed.id },
          data: { biz_val, update_time: nowSec },
        });
      } else {
        await (this.prisma as any).config.create({
          data: { biz_code: "rank_config", biz_val, create_time: nowSec, update_time: nowSec },
        });
      }
    }

    // 2) 更新 grow_config（若提供）
    if (growUpSetting && typeof growUpSetting === "object") {
      const existed = await (this.prisma as any).config.findFirst({ where: { biz_code: "grow_config" } });
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      const biz_val = JSON.stringify(growUpSetting);
      if (existed) {
        await (this.prisma as any).config.update({ where: { id: existed.id }, data: { biz_val, update_time: nowSec } });
      } else {
        await (this.prisma as any).config.create({ data: { biz_code: "grow_config", biz_val, create_time: nowSec, update_time: nowSec } });
      }
    }

    // 3) Upsert user_rank 列表数据
    const toNumber = (v: any, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const toStringOrEmpty = (v: any) => (v === undefined || v === null ? "" : String(v));
    const toDiscountString = (v: any) => {
      if (v === undefined || v === null || v === "") return "0.0";
      try {
        if (typeof v === "object" && typeof v.toString === "function") return v.toString();
        return String(v);
      } catch {
        return "0.0";
      }
    };
    const toRightsJSONString = (v: any) => {
      try {
        if (!v) return JSON.stringify([]);
        if (typeof v === "string") {
          // 尝试验证是否为 JSON；若非 JSON，则包一层文本
          try { JSON.parse(v); return v; } catch { return JSON.stringify([]); }
        }
        return JSON.stringify(v);
      } catch { return JSON.stringify([]); }
    };

    for (const it of items) {
      const rankId = toNumber(it.rankId ?? it.rank_id ?? 0, 0);
      const payload: any = {
        rank_name: toStringOrEmpty(it.rankName ?? it.rank_name),
        min_growth_points: toNumber(it.minGrowthPoints ?? it.min_growth_points, 0),
        max_growth_points: toNumber(it.maxGrowthPoints ?? it.max_growth_points, 0),
        discount: toDiscountString(it.discount),
        show_price: toNumber(it.showPrice ?? it.show_price, 1),
        rank_type: toNumber(it.rankType ?? it.rank_type ?? rankType ?? 0, 0),
        rank_logo: toStringOrEmpty(it.rankLogo ?? it.rank_logo),
        rank_ico: toStringOrEmpty(it.rankIco ?? it.rank_ico),
        rank_bg: toStringOrEmpty(it.rankBg ?? it.rank_bg),
        rank_point: toStringOrEmpty(it.rankPoint ?? it.rank_point ?? "0"),
        free_shipping: toNumber(it.freeShipping ?? it.free_shipping, 0),
        rank_card_type: toNumber(it.rankCardType ?? it.rank_card_type, 1),
        rights: toRightsJSONString(it.rights ?? it.rights_json),
        rank_level: toStringOrEmpty(it.rankLevel ?? it.rank_level ?? ""),
      };

      if (rankId > 0) {
        // 更新
        await (this.prisma as any).user_rank.update({ where: { rank_id: rankId }, data: payload });
      } else {
        // 新建
        await (this.prisma as any).user_rank.create({ data: payload });
      }
    }

    return { code: 0, message: "success", data: true };
  }
}
