// @ts-nocheck
import { Controller, Post, Body } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";

@Controller("api/appVersion")
export class AppVersionController {
  /**
   * 应用更新检查 - 对齐PHP版本 appVersion/getAppUpdate
   */
  @Post("getAppUpdate")
  @Public()
  async getAppUpdate(@Body() body: { platform?: string; version?: string }) {
    const platform = body.platform || "h5";
    const latest = {
      version: "1.0.0",
      build: 1,
      url: "https://example.com/app/download",
      changelog: "初始版本",
      force: 0,
    };

    return {
      platform,
      hasUpdate: false,
      latest,
    };
  }
}
