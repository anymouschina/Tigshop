// @ts-nocheck
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UserAuthService } from "./auth.service";
import { Public } from "../../auth/decorators/public.decorator";
import { JsSdkConfigDto } from "./dto/auth.dto";

@ApiTags("User Authentication")
@Controller("user")
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  /**
   * 获取JSSDK配置
   */
  @Get("login/getJsSdkConfig")
  @Public()
  @ApiOperation({ summary: "获取JSSDK配置" })
  async getJsSdkConfig(@Query() jsSdkConfigDto: JsSdkConfigDto) {
    return this.userAuthService.getJsSdkConfig(jsSdkConfigDto);
  }
}
