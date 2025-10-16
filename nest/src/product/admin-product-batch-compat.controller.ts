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
import { AdminProductBatchCompatService } from "./admin-product-batch-compat.service";
import { PanelService } from "src/panel/panel.service";
import { createReadStream } from "fs";
import { join } from "path";
import { Request } from "express";
import { Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Admin API - 商品批量操作(兼容路径)")
@Controller("adminapi/product/productBatch")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductBatchCompatController {
  private readonly logger = new Logger(
    AdminApiProductBatchCompatController.name,
  );
  constructor(
    private svc: AdminProductBatchCompatService,
    private panel: PanelService,
  ) {}
  /**
   * 批量处理（编辑/导出同一路径，POST处理，GET导出CSV）
   * 前端：product/productBatch/productBatchDeal
   */
  @Post("productBatchDeal")
  @ApiOperation({ summary: "商品批量处理（admin 兼容）" })
  @Authorities("productManage")
  async productBatchDeal(@Body() body: any, @Req() req: Request) {
    // 该接口在 PHP 中是导出动作（GET），这里 POST 视为“准备/预览”，直接返回成功
    // 真正导出走 GET 版本；也保留一个简洁回执，避免前端报错
    try {
      const keys = body && typeof body === "object" ? Object.keys(body) : [];
      this.logger.log(
        `[POST] productBatchDeal bodyKeys=${keys.slice(0, 10).join(",")} size=${JSON.stringify(body || {}).length}`,
      );
    } catch {}
    return { code: 0, message: "success", data: null };
  }

  @Get("productBatchDeal")
  @ApiOperation({ summary: "商品批量处理导出（admin 兼容，CSV）" })
  @Authorities("productManage")
  async productBatchDealExport(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: any,
  ) {
    this.logger.log(
      `[GET] productBatchDeal query=${JSON.stringify(query || {})}`,
    );
    const adminUserId = req.user?.userId || 0;
    const { header, rows } = await this.svc.buildExportRows(query, adminUserId);
    const csvLines = [
      header.join(","),
      ...rows.map((r) =>
        r
          .map((v) =>
            typeof v === "string" && v.includes(",")
              ? `"${v.replace(/"/g, '""')}"`
              : String(v),
          )
          .join(","),
      ),
    ];
    const csv = csvLines.join("\r\n");
    const buf = Buffer.from("\ufeff" + csv, "utf8");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="product-export-${new Date().toISOString().slice(0, 10)}.csv"`,
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
  @ApiOperation({ summary: "商品批量上传（CSV 导入并创建）" })
  @Authorities("productManage")
  @UseInterceptors(FileInterceptor("file"))
  async productBatchModify(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    const adminUserId = req.user?.userId || 0;
    if (!file) throw new Error("请上传文件");
    const result = await this.svc.batchUploadFromCsv(
      file.buffer,
      body,
      adminUserId,
    );
    return { code: 0, message: "success", data: result };
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
  @ApiOperation({ summary: "商品批量编辑（按行更新现有商品）" })
  @Authorities("productManage")
  async productBatchEdit(@Body() body: any) {
    // body 期望为数组：每项包含 product_id 以及允许更新字段
    const rows = Array.isArray(body?.rows)
      ? body.rows
      : Array.isArray(body)
        ? body
        : [];
    const result = await this.svc.batchEdit(rows);
    return { code: 0, message: "success", data: result };
  }
}
