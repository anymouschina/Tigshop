// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("通用-日志统计")
@Controller("common")
export class LogController {
  constructor(private readonly prisma: PrismaService) {
    this.logger = new Logger(LogController.name)
  }

  @Get("log")
  @ApiOperation({ summary: "记录用户行为日志" })
  @ApiQuery({ name: "click", required: false, description: "点击事件" })
  @ApiQuery({ name: "page", required: false, description: "页面访问" })
  @ApiQuery({ name: "action", required: false, description: "用户行为" })
  @ApiQuery({ name: "type", required: false, description: "日志类型" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async log(
    @Query()
    query: { click?: string; page?: string; action?: string; type?: string },
    @Request() req: any,
  ) {
    try {
      // 获取用户信息或IP地址
      const user = req.user?.userId || req.ip || "unknown";

      // 构建日志数据
      const logData = {
        user: user,
        click: query.click || null,
        page: query.page || null,
        action: query.action || null,
        type: query.type || "user_behavior",
        user_agent: req.headers["user-agent"] || "unknown",
        ip_address: req.ip || "unknown",
        created_at: new Date(),
      };

      // 如果数据库中有对应的日志表，可以在这里保存
      // 目前先返回成功响应，后续可以根据需要添加数据库存储
      this.logger.debug("Log data:", logData);

      return {
        code: 0,
        data: null,
        message: "success",
      };
    } catch (error) {
      this.logger.debug("记录日志失败:", error);
      return {
        code: 500,
        data: null,
        message: "记录失败",
      };
    }
  }

  @Post("log")
  @ApiOperation({ summary: "记录用户行为日志 (POST方式)" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async logPost(
    @Body()
    body: { click?: string; page?: string; action?: string; type?: string },
    @Request() req: any,
  ) {
    try {
      // 获取用户信息或IP地址
      const user = req.user?.userId || req.ip || "unknown";

      // 构建日志数据
      const logData = {
        user: user,
        click: body.click || null,
        page: body.page || null,
        action: body.action || null,
        type: body.type || "user_behavior",
        user_agent: req.headers["user-agent"] || "unknown",
        ip_address: req.ip || "unknown",
        created_at: new Date(),
      };

      // 如果数据库中有对应的日志表，可以在这里保存
      this.logger.debug("Log data (POST):", logData);

      return {
        code: 0,
        data: null,
        message: "success",
      };
    } catch (error) {
      this.logger.debug("记录日志失败:", error);
      return {
        code: 500,
        data: null,
        message: "记录失败",
      };
    }
  }
}
