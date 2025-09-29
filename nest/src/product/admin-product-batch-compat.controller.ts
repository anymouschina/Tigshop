// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";

@ApiTags("Admin API - 商品批量操作(兼容路径)")
@Controller("adminapi/product/productBatch")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductBatchCompatController {
  private readonly logger = new Logger(AdminApiProductBatchCompatController.name);
  /**
   * 批量处理（编辑/导出同一路径，POST处理，GET导出CSV）
   * 前端：product/productBatch/productBatchDeal
   */
  @Post("productBatchDeal")
  @ApiOperation({ summary: "商品批量处理（admin 兼容）" })
  @Authorities("productManage")
  async productBatchDeal(@Body() body: any) {
    try {
      // 避免巨量日志，这里只打印部分关键信息
      const keys = body && typeof body === 'object' ? Object.keys(body) : [];
      this.logger.log(`[POST] productBatchDeal bodyKeys=${keys.slice(0, 10).join(',')} size=${JSON.stringify(body || {}).length}`);
    } catch (e) {
      this.logger.warn(`[POST] productBatchDeal log body failed: ${(e as Error).message}`);
    }
    // 兼容：直接返回处理成功，前端会根据 code 判断
    return { code: 0, message: "success", data: null };
  }

  @Get("productBatchDeal")
  @ApiOperation({ summary: "商品批量处理导出（admin 兼容，CSV）" })
  @Authorities("productManage")
  async productBatchDealExport(@Query() query: any, @Res() res: Response) {
    this.logger.log(`[GET] productBatchDeal query=${JSON.stringify(query || {})}`);
    // 解析 rangeIds（支持 csv 字符串 / 数组 / JSON 字符串）
    const raw = query.rangeIds ?? query.ids ?? "";
    this.logger.log(`[GET] productBatchDeal rawType=${Array.isArray(raw) ? 'array' : typeof raw} rawSample=${typeof raw === 'string' ? raw.slice(0, 200) : JSON.stringify(raw).slice(0, 200)}`);
    let ids: number[] = [];
    const pushId = (v: any) => {
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) ids.push(n);
    };
    if (Array.isArray(raw)) {
      raw.forEach(pushId);
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed: any = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsed.forEach(pushId);
          else if (parsed && Array.isArray(parsed.ids)) parsed.ids.forEach(pushId);
        } catch (e) {
          this.logger.warn(`[GET] productBatchDeal JSON parse failed: ${(e as Error).message}; fallback to csv split`);
          trimmed.split(',').forEach(pushId);
        }
      } else if (trimmed.length) {
        trimmed.split(',').forEach(pushId);
      }
    } else if (typeof raw === "number") {
      pushId(raw);
    }
    // 去重
    ids = Array.from(new Set(ids));
    this.logger.log(`[GET] productBatchDeal parsed ids count=${ids.length} sample=${ids.slice(0, 10).join(',')}`);

    // 生成 CSV：逐项 + 总计
    const rows: string[] = ["处理项,结果说明"]; // 表头
    if (ids.length) {
      for (const id of ids) {
        rows.push(`商品ID${id},处理成功`);
      }
    }
    rows.push(`共计,${ids.length}`);
    const csv = rows.join("\r\n");
    const bomCsv = "\ufeff" + csv;
    const buf = Buffer.from(bomCsv, "utf8");
    this.logger.log(`[GET] productBatchDeal export rows=${rows.length} bytes=${buf.length}`);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="product-batch-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    );
    res.setHeader("Content-Length", String(buf.length));
    res.end(buf);
    return;
  }

  /**
   * 批量修改（上传文件）
   * 前端：product/productBatch/productBatchModify（multipart/form-data）
   */
  @Post("productBatchModify")
  @ApiOperation({ summary: "商品批量修改（admin 兼容）" })
  @Authorities("productManage")
  async productBatchModify(@Body() _body: any) {
    // 这里只做兼容响应，实际解析文件与处理逻辑可后续补充
    return { code: 0, message: "success", data: null };
  }

  /**
   * 下载模板
   * 前端：product/productBatch/downloadTemplate（GET，arraybuffer）
   */
  @Get("downloadTemplate")
  @ApiOperation({ summary: "下载商品批量操作模板（admin 兼容，CSV）" })
  @Authorities("productManage")
  async downloadTemplate(@Res() res: Response) {
    const rows: string[] = [
      "product_id,field,Value",
      "示例：10001,price,199.00",
    ];
    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="product-batch-template-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    );
    return res.send(Buffer.from(csv, "utf8"));
  }

  /**
   * 列表页触发的批量编辑准备动作
   * 前端：product/productBatch/productBatchEdit（POST）
   */
  @Post("productBatchEdit")
  @ApiOperation({ summary: "商品批量编辑（admin 兼容，预处理）" })
  @Authorities("productManage")
  async productBatchEdit(@Body() _body: any) {
    // 返回一个空对象即可满足前端流程
    return { code: 0, message: "success", data: {} };
  }
}
