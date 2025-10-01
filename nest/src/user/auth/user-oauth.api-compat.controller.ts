// @ts-nocheck
import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { WechatOAuthService } from "../../auth/services/wechat-oauth.service";

@ApiTags("User OAuth API Compat")
@Controller("api/user/oauth")
export class UserOAuthApiCompatController {
  constructor(private readonly wechatOAuthService: WechatOAuthService) {}

  // 对齐 PHP：GET /api/user/oauth/render/:source
  @Get("render/:source")
  @ApiOperation({ summary: "第三方登录跳转（兼容）" })
  async render(@Param("source") source: string, @Query("url") url?: string) {
    // 暂仅支持 wechat，其它source可拓展
    if (source === "wechat") {
      const data = await this.wechatOAuthService.getOAuthUrl(url || "");
      return { code: 200, message: "OK", data };
    }
    return { code: 400, message: "unsupported oauth source", data: null };
  }

  // 对齐 PHP：POST /api/user/oauth/callback/:source
  @Post("callback/:source")
  @ApiOperation({ summary: "第三方登录回调（兼容）" })
  async callback(@Param("source") source: string, @Body() body: { code?: string }) {
    if (source === "wechat") {
      const data = await this.wechatOAuthService.auth(body?.code || "");
      return { code: 200, message: "OK", data };
    }
    return { code: 400, message: "unsupported oauth source", data: null };
  }
}
