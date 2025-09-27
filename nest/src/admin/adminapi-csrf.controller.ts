// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CsrfService as AuthCsrfService } from "src/auth/services/csrf.service";
import { ResponseUtil } from "../../../common/utils/response.util";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@ApiTags("Admin API - 公共CSRF")
@Controller("adminapi/common/csrf")
export class AdminApiCsrfController {
  constructor(private readonly authCsrfService: AuthCsrfService) {}

  /**
   * 创建CSRF令牌 - 对齐PHP版本 /adminapi/common/csrf/create
   */
  @Get("create")
  @ApiOperation({ summary: "创建CSRF令牌" })
  async create() {
    const token = this.authCsrfService.generateToken();

    return {
      code: 0,
      data: {
        csrf_token: token,
        expires_in: 3600, // 1 hour
      },
      message: "success",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 验证CSRF令牌
   */
  @Post("validate")
  @ApiOperation({ summary: "验证CSRF令牌" })
  async validate(@Body() body: { csrf_token: string }) {
    const isValid = this.authCsrfService.validateToken(body.csrf_token);

    if (isValid) {
      return {
        code: 0,
        data: "CSRF令牌有效",
        message: "success",
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        code: 1,
        data: null,
        message: "CSRF令牌无效或已过期",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 删除CSRF令牌
   */
  @Post("delete")
  @ApiOperation({ summary: "删除CSRF令牌" })
  async delete(@Body() body: { csrf_token: string }) {
    const success = this.authCsrfService.deleteToken(body.csrf_token);

    if (success) {
      return {
        code: 0,
        data: "CSRF令牌已删除",
        message: "success",
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        code: 1,
        data: null,
        message: "CSRF令牌不存在",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取用户专属CSRF令牌
   */
  @Get("create-user-token")
  @ApiOperation({ summary: "获取用户专属CSRF令牌" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createUserToken(@Request() req) {
    const token = this.authCsrfService.generateToken(req.user.userId);

    return {
      code: 0,
      data: {
        csrf_token: token,
        user_id: req.user.userId,
        expires_in: 3600, // 1 hour
      },
      message: "success",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 刷新CSRF令牌
   */
  @Post("refresh")
  @ApiOperation({ summary: "刷新CSRF令牌" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req, @Body() body: { old_token: string }) {
    const newToken = this.authCsrfService.refreshToken(body.old_token, req.user.userId);

    if (newToken) {
      return {
        code: 0,
        data: {
          csrf_token: newToken,
          user_id: req.user.userId,
          expires_in: 3600, // 1 hour
        },
        message: "success",
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        code: 1,
        data: null,
        message: "刷新失败，原令牌无效",
        timestamp: new Date().toISOString(),
      };
    }
  }
}