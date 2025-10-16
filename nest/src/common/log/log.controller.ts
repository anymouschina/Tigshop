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
@Controller("api/common")
export class LogController {
  constructor(private readonly prisma: PrismaService) {
    this.logger = new Logger(LogController.name);
  }

  private async updateStatisticsBase(
    dateStr: string,
    incClicks = 0,
    incVisits = 1,
  ) {
    try {
      const day = new Date(dateStr);
      const existed = await this.prisma.statistics_base.findFirst({
        where: { date: day, shop_id: 0 },
      });
      if (existed) {
        await this.prisma.statistics_base.update({
          where: { id: existed.id },
          data: {
            click_count: { increment: incClicks },
            visitor_count: { increment: incVisits },
          },
        });
      } else {
        await this.prisma.statistics_base.create({
          data: {
            date: day,
            shop_id: 0,
            click_count: incClicks,
            visitor_count: incVisits,
          },
        });
      }
    } catch (error) {
      this.logger.error("Failed to update statistics base:", error);
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
      this.logger.error("Failed to log statistics detail:", error);
      throw error;
    }
  }

  @Get("log")
  @ApiOperation({ summary: "记录用户行为日志" })
  @ApiQuery({ name: "click", required: false, description: "点击事件" })
  @ApiQuery({ name: "page", required: false, description: "页面访问" })
  @ApiQuery({ name: "action", required: false, description: "用户行为" })
  @ApiQuery({ name: "type", required: false, description: "日志类型" })
  @ApiQuery({ name: "productId", required: false, description: "浏览的商品ID" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async log(
    @Query()
    query: {
      click?: string;
      page?: string;
      action?: string;
      type?: string;
      productId?: string | number;
    },
    @Request() req: any,
  ) {
    try {
      // 获取用户信息或IP地址
      const extractedUserId = this.extractUserId(req);
      const user = extractedUserId ?? (req.ip || "unknown");

      // 获取当前日期
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      // 统计：访问+1；若为点击事件，点击+1
      const isClick = query.click !== undefined && query.click !== null;
      await this.updateStatisticsBase(todayStr, isClick ? 1 : 0, 1);

      // 记录详细日志（如果有产品ID或相关数据）
      await this.logStatisticsDetail({
        user: String(user),
        page: query.page || null,
        action: query.action || query.click || null,
        type: query.type || "user_behavior",
        access_time: Math.floor(Date.now() / 1000), // 转换为Unix时间戳
      });

      // 如果包含 productId 且解析出 userId（无需强制鉴权 Guard）则写入浏览足迹
      const pidRaw = query.productId;
      const pidNum = Number(pidRaw);
      if (
        pidRaw !== undefined &&
        Number.isFinite(pidNum) &&
        pidNum > 0 &&
        extractedUserId
      ) {
        await this.appendHistoryProduct(extractedUserId, pidNum);
      }

      this.logger.debug("Log data recorded successfully for user:", user);
      return { ok: true };
    } catch (error) {
      this.logger.error("记录日志失败:", error);
      throw new HttpException("记录日志失败", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("log")
  @ApiOperation({ summary: "记录用户行为日志 (POST方式)" })
  @ApiResponse({ status: 200, description: "记录成功" })
  async logPost(
    @Body()
    body: {
      click?: string;
      page?: string;
      action?: string;
      type?: string;
      productId?: string | number;
    },
    @Request() req: any,
  ) {
    try {
      // 获取用户信息或IP地址
      const extractedUserId = this.extractUserId(req);
      const user = extractedUserId ?? (req.ip || "unknown");

      // 获取当前日期
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      // 统计：访问+1；若为点击事件，点击+1
      const isClick = body.click !== undefined && body.click !== null;
      await this.updateStatisticsBase(todayStr, isClick ? 1 : 0, 1);

      // 记录详细日志（如果有产品ID或相关数据）
      await this.logStatisticsDetail({
        user: String(user),
        page: body.page || null,
        action: body.action || body.click || null,
        type: body.type || "user_behavior",
        access_time: Math.floor(Date.now() / 1000), // 转换为Unix时间戳
      });

      // 同步 productId 足迹（POST 也支持）
      const pidRaw = body.productId;
      const pidNum = Number(pidRaw);
      if (
        pidRaw !== undefined &&
        Number.isFinite(pidNum) &&
        pidNum > 0 &&
        extractedUserId
      ) {
        await this.appendHistoryProduct(extractedUserId, pidNum);
      }

      this.logger.debug("POST Log data recorded successfully for user:", user);
      return { ok: true };
    } catch (error) {
      this.logger.error("POST记录日志失败:", error);
      throw new HttpException(
        "POST记录日志失败",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 解析请求中的用户ID（优先 req.user，其次 Bearer Token 解码；失败返回 null）
   */
  private extractUserId(req: any): number | null {
    const direct = req?.user?.userId || req?.user?.user_id || req?.user?.sub;
    if (direct) return Number(direct);
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) {
      const token = auth.slice(7).trim();
      try {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const payloadSeg = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const padded =
            payloadSeg + "=".repeat((4 - (payloadSeg.length % 4)) % 4);
          const json = Buffer.from(padded, "base64").toString("utf8");
          const decoded: any = JSON.parse(json);
          const candidate = decoded?.userId || decoded?.user_id || decoded?.sub;
          if (candidate) return Number(candidate);
        }
      } catch (_) {}
    }
    return null;
  }

  /** 将商品ID追加到用户的浏览历史（去重前插，最多100） */
  private async appendHistoryProduct(userId: number, productId: number) {
    try {
      const u = await this.prisma.user.findFirst({
        where: { user_id: userId },
        select: { history_product_ids: true },
      });
      let arr: number[] = [];
      if (u?.history_product_ids) {
        try {
          const parsed = JSON.parse(u.history_product_ids);
          if (Array.isArray(parsed))
            arr = parsed
              .filter((n: any) => Number.isFinite(Number(n)))
              .map((n: any) => Number(n));
        } catch {}
      }
      const existIdx = arr.indexOf(productId);
      if (existIdx !== -1) arr.splice(existIdx, 1);
      arr.unshift(productId);
      if (arr.length > 100) arr = arr.slice(0, 100);
      await this.prisma.user.update({
        where: { user_id: userId },
        data: { history_product_ids: JSON.stringify(arr) },
      });
    } catch (e) {
      this.logger.warn(
        `记录浏览足迹失败 productId=${productId}: ${e?.message || e}`,
      );
    }
  }
}
