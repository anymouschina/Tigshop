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
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? "rank_id").toString();
    const sortOrder = ((q.sort_order ?? "asc").toString().toLowerCase() === "desc" ? "desc" : "asc") as any;
    const rankName = (q.rank_name || "").trim();

    const where: any = {};
    if (rankName) where.rank_name = { contains: rankName };

    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_rank.findMany({ where, skip, take: size, orderBy: { [sortField]: sortOrder } }),
      (this.prisma as any).user_rank.count({ where }),
    ]);

    const records = rows.map((r: any) => ({
      rank_id: r.rank_id,
      rank_name: r.rank_name,
      rank_logo: r.rank_logo,
      rank_level: r.rank_type, // PHP里展示的等级序可能来自 rank_type
      user_count: 0,
    }));

    // 保持旧结构（user_rank/rank_config）以兼容，同时也提供新结构键（userRank/rankConfig）
    const data = {
      user_rank: { records, total },
      rank_config: {},
      userRank: { records, total },
      rankConfig: {},
    };
    return { code: 0, message: "success", data };
  }

  // 兼容前端可能调用的 /listByPro 路由（别名，返回同 list）
  @Get("listByPro")
  @ApiOperation({ summary: "会员等级列表（Pro 版别名，兼容）" })
  @Authorities("levelManageManage")
  async listByPro(@Query() q: any) {
    const page = Number(q.page || 1);
    const size = Number(q.size || 15);
    const sortField = (q.sort_field ?? "rank_id").toString();
    const sortOrder = ((q.sort_order ?? "asc").toString().toLowerCase() === "desc" ? "desc" : "asc") as any;
    const rankName = (q.rank_name || "").trim();

    const where: any = {};
    if (rankName) where.rank_name = { contains: rankName };

    const skip = (page - 1) * size;
    const [rows, total] = await Promise.all([
      (this.prisma as any).user_rank.findMany({ where, skip, take: size, orderBy: { [sortField]: sortOrder } }),
      (this.prisma as any).user_rank.count({ where }),
    ]);

    const records = rows.map((r: any) => ({
      rank_id: r.rank_id,
      rank_name: r.rank_name,
      rank_logo: r.rank_logo,
      rank_level: r.rank_type,
      user_count: 0,
    }));

    // 读取/初始化 rank_config 配置
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    let cfg = await (this.prisma as any).config.findFirst({ where: { biz_code: "rank_config" } });
    let cfgData: any = { type: 2, rankAfterMonth: 12, useMonth: 12 };
    if (!cfg) {
      cfg = await (this.prisma as any).config.create({
        data: { biz_code: "rank_config", biz_val: JSON.stringify(cfgData), create_time: nowSec, update_time: nowSec },
      });
    } else {
      try {
        cfgData = cfg.biz_val ? JSON.parse(cfg.biz_val) : cfgData;
      } catch (e) {
        // 若存储异常则回落为默认
        cfgData = { type: 2, rankAfterMonth: 12, useMonth: 12 };
      }
    }
    const rankConfig = {
      id: cfg.id,
      code: "rank_config",
      rankType: Number(cfgData?.type ?? 2),
      data: {
        type: Number(cfgData?.type ?? 2),
        rankAfterMonth: Number(cfgData?.rankAfterMonth ?? 12),
        useMonth: Number(cfgData?.useMonth ?? 12),
      },
    };

    return {
      code: 0,
      message: "success",
      data: {
        userRank: { records, total },
        rankConfig,
      },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "会员等级详情（兼容）" })
  async detail(@Query("rank_type") rankType?: string) {
    const rt = Number(rankType || 1);
    const item = await (this.prisma as any).user_rank.findFirst({ where: { rank_type: rt } });
    return { code: 0, message: "success", data: item };
  }

  @Post("update")
  @ApiOperation({ summary: "更新会员等级（兼容）" })
  async update(@Body() body: any) {
    const rankType = Number(body.rank_type || 1);
    const data = body.data || {};
    const target = await (this.prisma as any).user_rank.findFirst({ where: { rank_type: rankType } });
    if (!target) return { code: 404, message: "not found", data: null };
    await (this.prisma as any).user_rank.update({ where: { rank_id: target.rank_id }, data: {
      rank_name: data.rank_name ?? target.rank_name,
      rank_logo: data.rank_logo ?? target.rank_logo,
      rank_type: data.rank_level ?? target.rank_type,
    } });
    return { code: 0, message: "success", data: true };
  }
}
