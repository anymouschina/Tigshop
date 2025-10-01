// @ts-nocheck
import { Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SignInService } from "./sign-in.service";
import { UserPointsLogService } from "../user/user-points-log/user-points-log.service";

@ApiTags("用户签到（API兼容）")
@Controller("api/user/sign")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserSignApiCompatController {
  constructor(
    private readonly signSvc: SignInService,
    private readonly pointsSvc: UserPointsLogService,
  ) {}

  // GET /api/user/sign/index
  @Get("index")
  @ApiOperation({ summary: "签到主页数据（兼容）" })
  async index(@Request() req) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const data = await this.signSvc.getUserSignData(Number(userId));
    return { code: 0, message: "success", data };
  }

  // GET /api/user/sign/sign
  @Get("sign")
  @ApiOperation({ summary: "执行签到（兼容）" })
  async sign(@Request() req) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const res = await this.signSvc.userSignIn(Number(userId));
    // 记积分日志（与PHP一致：签到送积分）
    if (res?.points && Number(res.points) > 0) {
      try {
        await this.pointsSvc.createUserPointsLog({
          user_id: Number(userId),
          points: Number(res.points),
          type: 1, // 1 增加
          remark: "每日签到赠送积分",
        } as any);
      } catch (_) {}
    }
    return { code: 0, message: "success", data: res };
  }
}
