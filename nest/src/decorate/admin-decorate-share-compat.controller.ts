// @ts-nocheck
import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
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
  async import(@Query("url") url: string, @Req() req: any) {
    if (!url) return { code: 1, message: "请输入要导入的链接!", data: null };

    // 解析 URL 参数 (参考PHP版本analyzeUrl方法)
    function analyzeUrl(importUrl: string) {
      try {
        const parsedUrl = new URL(importUrl);
        const port = parsedUrl.port ? `:${parsedUrl.port}` : '';
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${port}${parsedUrl.pathname}`;
        const params = Object.fromEntries(parsedUrl.searchParams.entries());
        return { baseUrl, queryParams: params };
      } catch {
        throw new Error('无效的链接!');
      }
    }

    try {
      const decoded = decodeURIComponent(url);
      const urlInfo = analyzeUrl(decoded);
      const params = urlInfo.queryParams;

      if (!params.sn || !params.token) {
        return { code: 1, message: `链接中参数缺少${!params.sn ? 'sn' : 'token'}字段!`, data: null };
      }

      // 拉取远程数据 (参考PHP版本Http::get)
      const resp = await axios.get(urlInfo.baseUrl, {
        params: params,
        timeout: 15000
      });

      const body = resp?.data;

      // 检查是否为JSON格式
      if (typeof body !== 'object' || body === null) {
        return { code: 1, message: '返回结果有误！', data: null };
      }

      // 检查是否有data字段 (参考PHP版本第76行)
      if (!body.data) {
        return { code: 1, message: '未获取到有用的模板信息，请重新导入分享模板链接！', data: null };
      }

      const decorate = body.data;

      // 验证必要字段 (参考PHP版本第81-84行)
      if (!decorate.decorateTitle || !decorate.data) {
        return { code: 1, message: '装修数据格式错误，缺少必要字段！', data: null };
      }

      // 获取shop_id (参考PHP版本第52行)
      const shopId = req.user?.shopId ?? 0;

      // 写入本地 decorate (参考PHP版本第81-88行)
      const now = Math.floor(Date.now() / 1000);
      const created = await this.prisma.decorate.create({
        data: {
          decorate_title: decorate.decorateTitle,
          data: JSON.stringify(decorate.data),
          draft_data: JSON.stringify(decorate.draftData || decorate.data),
          decorate_type: decorate.decorateType ?? 1,
          is_home: 0,
          shop_id: shopId,
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
