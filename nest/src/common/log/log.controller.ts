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
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("通用-日志统计")
@Controller("common")
export class LogController {
  constructor(private readonly prisma: PrismaService) {
    this.logger = new Logger(LogController.name)
  }

  private async upsertStatisticsBase(dateStr: string) {
    try {
      await this.prisma.statistics_base.upsert({
        where: { id: 1 },
        update: {},
        create: {
          date: new Date(dateStr),
          click_count: 0,
          shop_id: 0,
          visitor_count: 0,
        },
      });
    } catch (error) {
      this.logger.error('Failed to upsert statistics base:', error);
      throw error;
    }
  }

  private async logStatisticsDetail(data: {
    user: string;
    page?: string | null;
    action?: string | null;
    type: string;
    access_time: number;
  }) {
    try {
      await this.prisma.statistics_log.create({
        data: {
          user: data.user,
          access_time: data.access_time,
          shop_id: 0,
          product_id: 0,
          shop_category_id: 0,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log statistics detail:', error);
      throw error;
    }
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
      const user = req.user?.userId || req.user?.user_id || req.user?.sub || req.ip || "unknown";

      // 获取当前日期
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      // 更新或创建统计基础数据
      await this.upsertStatisticsBase(todayStr);

      // 记录详细日志（如果有产品ID或相关数据）
      await this.logStatisticsDetail({
        user: String(user),
        page: query.page || null,
        action: query.action || query.click || null,
        type: query.type || "user_behavior",
        access_time: Math.floor(Date.now() / 1000), // 转换为Unix时间戳
      });

      this.logger.debug("Log data recorded successfully for user:", user);
      return;
    } catch (error) {
      this.logger.error("记录日志失败:", error);
      throw new HttpException('记录日志失败', HttpStatus.INTERNAL_SERVER_ERROR);
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
      const user = req.user?.userId || req.user?.user_id || req.user?.sub || req.ip || "unknown";

      // 获取当前日期
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      // 更新或创建统计基础数据
      await this.upsertStatisticsBase(todayStr);

      // 记录详细日志（如果有产品ID或相关数据）
      await this.logStatisticsDetail({
        user: String(user),
        page: body.page || null,
        action: body.action || body.click || null,
        type: body.type || "user_behavior",
        access_time: Math.floor(Date.now() / 1000), // 转换为Unix时间戳
      });

      this.logger.debug("POST Log data recorded successfully for user:", user);
      return;
    } catch (error) {
      this.logger.error("POST记录日志失败:", error);
      throw new HttpException('POST记录日志失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
