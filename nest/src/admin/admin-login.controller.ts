// @ts-nocheck
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
  Request,
  Get,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { RedisService } from "../redis/redis.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { AdminLoginDto } from "./dto/admin.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Admin API - 登录")
@Controller("adminapi/login")
export class AdminLoginController {
  constructor(
    private readonly adminService: AdminService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Post("signin")
  @ApiOperation({ summary: "管理员登录" })
  async signin(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false, // 允许未在DTO中定义的参数，但不进行验证
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    loginDto: AdminLoginDto,
    @Request() req,
  ) {
    const clientIp = this.getClientIp(req);
    const data = await this.adminService.login(loginDto, clientIp);

    return data;
  }

  @Public()
  @Post("signout")
  @ApiOperation({ summary: "管理员登出" })
  async signout(@Request() req) {
    const userId = req.user?.userId;
    const data = await this.adminService.logout(userId);
    return data;
  }

  /**
   * 管理后台发送手机验证码 (与用户端逻辑独立, 默认 event=adminLogin)
   * 请求体: { mobile: string, event?: string, verifyToken?: string }
   */
  @Public()
  @Post("sendMobileCode")
  @ApiOperation({ summary: "管理员发送手机验证码" })
  async sendMobileCode(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    body: {
      mobile: string;
      event?: string;
      verifyToken?: string;
    },
  ) {
    const { mobile, event, verifyToken } = body || {};
    if (!mobile) {
      throw new HttpException("手机号不能为空", HttpStatus.BAD_REQUEST);
    }
    // 行为验证占位: 目前允许空; 若需要强制, 取消下方注释
    // if (!verifyToken) {
    //   throw new HttpException('验证令牌缺失', HttpStatus.BAD_REQUEST);
    // }
    const normalized =
      mobile.startsWith("86") && mobile.length > 11
        ? mobile.substring(2)
        : mobile;
    const finalEvent = event || "adminLogin";
    // 频率限制
    const rateKey = `admin:mobileCode:rate:${normalized}`;
    const existRate = await this.redisService.get(rateKey);
    if (existRate) {
      throw new HttpException(
        "发送过于频繁，请稍后再试",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    // 生成验证码 (测试环境固定, 生产可改为随机)
    const code = process.env.ADMIN_LOGIN_SMS_CODE || "000000";
    const storeKey = `${finalEvent}:mobileCode:${normalized}`;
    const ttl = parseInt(process.env.ADMIN_LOGIN_SMS_TTL || "120");
    await this.redisService.set(
      storeKey,
      { code, mobile: normalized, event: finalEvent, created_at: Date.now() },
      { ttl },
    );
    // 设置频率 60 秒
    await this.redisService.set(rateKey, 1, { ttl: 60 });
    // TODO: 集成真实短信发送 (SmsService)；当前仅存储 Redis
    return {
      mobile: normalized,
      event: finalEvent,
      key: storeKey,
      expire: ttl,
      // debugCode: code // 如需调试可临时返回
    };
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIp(req: any): string {
    // 按优先级检查不同的IP头
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];
    const cfConnectingIp = req.headers["cf-connecting-ip"]; // Cloudflare

    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    if (forwarded) {
      // x-forwarded-for可能是多个IP，用逗号分隔，取第一个
      return forwarded.split(",")[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    return req.ip || "127.0.0.1";
  }
}
