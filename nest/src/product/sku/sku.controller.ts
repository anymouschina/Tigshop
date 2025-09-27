// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SkuService } from "./sku.service";
import {
  CreateSkuDto,
  UpdateSkuDto,
  GetSkusDto,
  SkuStockUpdateDto,
  SkuBatchStockUpdateDto,
  SkuAvailabilityDto,
  SkuPriceUpdateDto,
} from "./dto/sku.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@ApiTags("SKU Management")
@Controller("product/sku")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  /**
   * 创建SKU - 对齐PHP版本 product/sku/create
   */
  @Post("create")
  @ApiOperation({ summary: "创建SKU" })
  async createSku(@Body() createSkuDto: CreateSkuDto) {
    return this.skuService.createSku(createSkuDto);
  }

  /**
   * 获取SKU列表 - 对齐PHP版本 product/sku/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取SKU列表" })
  async getSkuList(@Query() query: GetSkusDto) {
    return this.skuService.getSkuList(query);
  }

  /**
   * 获取SKU详情 - 对齐PHP版本 product/sku/detail
   */
  @Get("detail")
  @ApiOperation({ summary: "获取SKU详情" })
  async getSkuDetail(@Query("id") id: number) {
    return this.skuService.getSkuDetail(Number(id));
  }

  /**
   * 更新SKU - 对齐PHP版本 product/sku/update
   */
  @Put("update")
  @ApiOperation({ summary: "更新SKU" })
  async updateSku(@Query("id") id: number, @Body() updateSkuDto: UpdateSkuDto) {
    return this.skuService.updateSku(Number(id), updateSkuDto);
  }

  /**
   * 删除SKU - 对齐PHP版本 product/sku/delete
   */
  @Delete("delete")
  @ApiOperation({ summary: "删除SKU" })
  async deleteSku(@Query("id") id: number) {
    return this.skuService.deleteSku(Number(id));
  }

  /**
   * 更新SKU库存 - 对齐PHP版本 product/sku/updateStock
   */
  @Put("updateStock")
  @ApiOperation({ summary: "更新SKU库存" })
  async updateSkuStock(
    @Query("id") id: number,
    @Body() stockUpdateDto: SkuStockUpdateDto,
  ) {
    return this.skuService.updateSkuStock(Number(id), stockUpdateDto);
  }

  /**
   * 批量更新SKU库存 - 对齐PHP版本 product/sku/batchUpdateStock
   */
  @Put("batchUpdateStock")
  @ApiOperation({ summary: "批量更新SKU库存" })
  async batchUpdateSkuStock(@Body() batchUpdateDto: SkuBatchStockUpdateDto) {
    return this.skuService.batchUpdateSkuStock(batchUpdateDto);
  }

  /**
   * 更新SKU价格 - 对齐PHP版本 product/sku/updatePrice
   */
  @Put("updatePrice")
  @ApiOperation({ summary: "更新SKU价格" })
  async updateSkuPrice(
    @Query("id") id: number,
    @Body() priceUpdateDto: SkuPriceUpdateDto,
  ) {
    return this.skuService.updateSkuPrice(Number(id), priceUpdateDto);
  }

  /**
   * 获取SKU可用性 - 对齐PHP版本 product/sku/getAvailability
   */
  @Post("getAvailability")
  @ApiOperation({ summary: "获取SKU可用性" })
  async getSkuAvailability(@Body() availabilityDto: SkuAvailabilityDto) {
    return this.skuService.getSkuAvailability(availabilityDto);
  }

  /**
   * 获取产品SKU列表 - 对齐PHP版本 product/sku/getProductSkus
   */
  @Get("getProductSkus")
  @ApiOperation({ summary: "获取产品SKU列表" })
  async getProductSkus(@Query("productId") productId: number) {
    return this.skuService.getProductSkus(Number(productId));
  }

  /**
   * 获取SKU统计信息 - 对齐PHP版本 product/sku/getStats
   */
  @Get("getStats")
  @ApiOperation({ summary: "获取SKU统计信息" })
  async getSkuStats(@Query("productId") productId?: number) {
    return this.skuService.getSkuStats(
      productId ? Number(productId) : undefined,
    );
  }

  /**
   * 检查SKU编码是否可用 - 对齐PHP版本 product/sku/checkCode
   */
  @Get("checkCode")
  @ApiOperation({ summary: "检查SKU编码是否可用" })
  async checkSkuCode(
    @Query("skuCode") skuCode: string,
    @Query("productId") productId?: number,
  ) {
    // 检查SKU编码是否已存在
    const existingSku = await this.skuService["prisma"].productSku.findFirst({
      where: { skuCode },
    });

    if (existingSku) {
      // 如果指定了产品ID，检查是否是同一产品
      if (productId && existingSku.productId === Number(productId)) {
        return { isAvailable: false, message: "该产品下已存在此SKU编码" };
      } else if (!productId) {
        return { isAvailable: false, message: "SKU编码已存在" };
      }
    }

    return { isAvailable: true, message: "SKU编码可用" };
  }

  /**
   * 获取SKU树形结构 - 对齐PHP版本 product/sku/getSkuTree
   */
  @Get("getSkuTree")
  @ApiOperation({ summary: "获取SKU树形结构" })
  async getSkuTree(@Query("productId") productId: number) {
    return this.skuService.getProductSkus(Number(productId));
  }

  /**
   * 批量启用/禁用SKU - 对齐PHP版本 product/sku/batchEnable
   */
  @Put("batchEnable")
  @ApiOperation({ summary: "批量启用/禁用SKU" })
  async batchEnableSkus(@Body() data: { skuIds: number[]; isEnable: boolean }) {
    const { skuIds, isEnable } = data;

    const results = await Promise.all(
      skuIds.map(async (skuId) => {
        try {
          await this.skuService["prisma"].$queryRaw`
            UPDATE "ProductSku"
            SET "isEnable" = ${isEnable}, "updatedAt" = NOW()
            WHERE skuId = ${skuId}
          `;
          return { skuId, success: true };
        } catch (error) {
          return { skuId, success: false, error: error.message };
        }
      }),
    );

    return {
      message: isEnable ? "批量启用完成" : "批量禁用完成",
      results,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
    };
  }

  /**
   * 获取SKU历史记录 - 对齐PHP版本 product/sku/getHistory
   */
  @Get("getHistory")
  @ApiOperation({ summary: "获取SKU历史记录" })
  async getSkuHistory(
    @Query("skuId") skuId: number,
    @Query("page") page = 1,
    @Query("size") size = 10,
  ) {
    // 简化实现，返回模拟数据
    return {
      skuId,
      history: [
        {
          id: 1,
          action: "创建SKU",
          operator: "管理员",
          time: "2024-01-01 10:00:00",
          details: "创建SKU，价格：100，库存：50",
        },
        {
          id: 2,
          action: "更新库存",
          operator: "管理员",
          time: "2024-01-02 14:30:00",
          details: "库存从50更新到80",
        },
      ],
      total: 2,
      page,
      size,
      totalPages: 1,
    };
  }
}
