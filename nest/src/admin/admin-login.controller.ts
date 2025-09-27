// @ts-nocheck
import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe, Request } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { AdminLoginDto } from "./dto/admin.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Admin API - 登录")
@Controller("adminapi/login")
export class AdminLoginController {
  constructor(private readonly adminService: AdminService) {}

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

    return data
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIp(req: any): string {
    // 按优先级检查不同的IP头
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare

    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    if (forwarded) {
      // x-forwarded-for可能是多个IP，用逗号分隔，取第一个
      return forwarded.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    return req.ip || '127.0.0.1';
  }
}
