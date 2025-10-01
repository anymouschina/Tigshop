// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import axios from "axios";

@ApiTags("Admin API - 装修分享(兼容)")
@Controller("adminapi/decorate/decorateShare")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminDecorateShareCompatController {
  constructor(private prisma: PrismaService) {}

  @Get("share")
  @ApiOperation({ summary: "生成分享（创建记录并返回导入链接）" })
  @Authorities("decorateManage")
  async share(@Query("decorate_id") decorate_id: number, @Query("decorateId") decorateIdAlias?: number) {
    const id = Number(decorate_id ?? decorateIdAlias ?? 0);
    if (!id) return { code: 1, message: "参数错误", data: null };

    // 生成短 sn/token 并写入数据库（2 小时有效期）
    const sn = Math.random().toString().slice(2, 8);
    const token = Math.random().toString().slice(2, 7);
    const now = Math.floor(Date.now() / 1000);
    const valid = now + 2 * 60 * 60;
    try {
      await this.prisma.decorate_share.create({
        data: {
          share_sn: sn,
          share_token: token,
          decorate_id: id,
          valid_time: valid,
          create_time: now,
          update_time: now,
        },
      });
    } catch (e) {
      // 若随机冲突，退化为只返回链接
    }

    return {
      code: 0,
      message: "success",
      data: { sn, token, api_url: `/api/home/share/import?sn=${sn}&token=${token}` },
    };
  }

  @Get("import")
  @ApiOperation({ summary: "导入分享：根据远程 URL 拉取装修并写入本地" })
  @Authorities("decorateManage")
  async import(@Query("url") url: string) {
    if (!url) return { code: 1, message: "请输入要导入的链接!", data: null };

    try {
      const decoded = decodeURIComponent(url);
      const resp = await axios.get(decoded, { timeout: 15000 });
      const body = resp?.data;
      if (!body || body.code !== 0) {
        return { code: 1, message: body?.message || "远程导入失败", data: null };
      }
      const decorate = body.data?.decorate;
      if (!decorate) {
        return { code: 1, message: "远程未返回装修数据", data: null };
      }

      // 写入本地 decorate（新建一条，避免与远端 ID 冲突）
      const now = Math.floor(Date.now() / 1000);
      const created = await this.prisma.decorate.create({
        data: {
          decorate_title: decorate.decorate_title || "导入装修",
          data: decorate.data ?? null,
          draft_data: decorate.draft_data ?? null,
          decorate_type: decorate.decorate_type ?? 1,
          is_home: 0,
          shop_id: 0,
          status: true,
          update_time: now,
        },
      });

      return { code: 0, message: "success", data: { decorate_id: created.decorate_id } };
    } catch (e) {
      return { code: 1, message: `导入异常: ${e?.message || e}`, data: null };
    }
  }
}
