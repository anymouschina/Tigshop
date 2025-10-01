// @ts-nocheck
import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Home - 分享导入(用户侧)")
@Controller("api/home/share")
export class HomeSharePublicController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 装修分享导入 - 对齐 PHP: /api/home/share/import
   * 入参：sn, token
   * 返回：通过 sn+token 定位 decorate_share，再返回相关 decorate 信息（简化版）
   */
  @Get("import")
  @Public()
  @ApiOperation({ summary: "装修分享导入" })
  @ApiQuery({ name: "sn", required: true })
  @ApiQuery({ name: "token", required: true })
  async import(@Query("sn") sn: string, @Query("token") token: string) {
    if (!sn || !token) return { code: 1, message: "参数错误", data: null };

    const share = await this.prisma.decorate_share.findFirst({
      where: { share_sn: String(sn), share_token: String(token) },
    });
    if (!share) return { code: 1, message: "分享不存在或已失效", data: null };

    const decorate = await this.prisma.decorate.findFirst({
      where: { decorate_id: share.decorate_id },
      select: {
        decorate_id: true,
        decorate_title: true,
        data: true,
        draft_data: true,
        decorate_type: true,
        is_home: true,
        shop_id: true,
        status: true,
        update_time: true,
      },
    });

    return { code: 0, message: "success", data: { share, decorate } };
  }
}
