// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
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
  /**
   * 批量处理（编辑/导出同一路径，POST处理，GET导出CSV）
   * 前端：product/productBatch/productBatchDeal
   */
  @Post("productBatchDeal")
  @ApiOperation({ summary: "商品批量处理（admin 兼容）" })
  @Authorities("productManage")
  async productBatchDeal(@Body() body: any) {
    // 兼容：直接返回处理成功，前端会根据 code 判断
    return { code: 0, message: "success", data: null };
  }

  @Get("productBatchDeal")
  @ApiOperation({ summary: "商品批量处理导出（admin 兼容，CSV）" })
  @Authorities("productManage")
  async productBatchDealExport(@Query() query: any, @Res() res: Response) {
    // 简单导出CSV示例，保证前端 arraybuffer 下载不报错
    const rows: string[] = [
      "处理项,结果说明",
      "共计,0",
    ];
    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="product-batch-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    );
    return res.send(Buffer.from(csv, "utf8"));
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
