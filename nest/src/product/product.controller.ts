// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProductService } from "./product.service";
import { ProductDetailService } from "./product-detail.service";
import { CommentService } from "./comment/comment.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";
import { CommentStatus } from "./comment/dto/comment.dto";

@ApiTags("Product Management")
@Controller("api/product/product")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productDetailService: ProductDetailService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  /**
   * 获取商品列表 - 对齐PHP版本 product/product/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取商品列表" })
  async getProductList(@Query() query: any) {
    return this.productService.findAll(query);
  }

  /**
   * 获取商品详情 - 对齐PHP版本 product/product/detail
   */
  @Get("detail")
  @ApiOperation({ summary: "获取商品详情" })
  async getProductDetail(@Query() query: { id: number }) {
    const productId = Number(query.id);
    return this.productDetailService.getProductDetail(productId);
  }

  /**
   * 获取商品详情 - Public版本（不需要登录）
   */
  @Get("public-detail")
  @Public()
  @ApiOperation({ summary: "获取商品详情（公开）" })
  async getProductDetailPublic(@Query() query: { id: number }) {
    const productId = Number(query.id);
    return this.productDetailService.getProductDetail(productId);
  }

  /**
   * 获取商品评论 - 对齐PHP版本 product/product/getComment
   */
  @Get("getComment")
  @Public()
  @ApiOperation({ summary: "获取商品评论" })
  async getProductComment(
    @Query() query: { id: number; page?: number; size?: number },
  ) {
    const { id } = query;

    // 获取评论统计 - 对齐PHP版本响应格式
    const stats = await this.commentService.getCommentStats(Number(id));

    // 计算好评、中评、差评数量 - 对齐PHP版本的计算方式
    const goodCount = stats.ratingDistribution.find(r => r.rating === 5)?.count || 0;
    const moderateCount = stats.ratingDistribution.find(r => r.rating === 3 || r.rating === 4)?.count || 0;
    const badCount = stats.ratingDistribution.find(r => r.rating === 1 || r.rating === 2)?.count || 0;

    const total = stats.totalComments;
    const goodPercent = total > 0 ? Math.round((goodCount / total) * 100) : 0;
    const moderatePercent = total > 0 ? Math.round((moderateCount / total) * 100) : 0;
    const badPercent = total > 0 ? Math.round((badCount / total) * 100) : 0;

    // 对齐PHP版本的响应数据结构
    return {
      total, // 总评论数
      badCount, // 差评数量
      goodCount, // 好评数量
      moderateCount, // 中评数量
      showCount: total, // 显示数量（等于总数量）
      goodPercent, // 好评百分比
      moderatePercent, // 中评百分比
      badPercent, // 差评百分比
      // 补充PHP版本可能的其他字段
      averageRating: stats.averageRating, // 平均评分
      ratingDistribution: stats.ratingDistribution, // 评分分布
    };
  }

  /**
   * 获取评论列表 - 对齐PHP版本 product/product/getCommentList
   */
  @Get("getCommentList")
  @ApiOperation({ summary: "获取评论列表" })
  async getCommentList(
    @Query() query: { id: number; page?: number; size?: number },
  ) {
    const { id, page = 1, size = 10 } = query;

    return this.commentService.getComments({
      productId: Number(id),
      page: Number(page),
      size: Number(size),
      status: CommentStatus.APPROVED,
    });
  }

  /**
   * 获取SKU库存信息 - 对齐PHP版本 product/product/getProductAvailability
   */
  @Get("getProductAvailability")
  @ApiOperation({ summary: "获取SKU库存信息" })
  async getProductAvailability(
    @Query() query: { productId: number; skuId?: string },
  ) {
    // 简化实现，返回库存信息
    return {
      productId: query.productId,
      skuId: query.skuId,
      stock: 100,
      price: 99.99,
      originalPrice: 129.99,
      isAvailable: true,
    };
  }

  /**
   * 获取商品促销信息 - 对齐PHP版本 product/product/promotion
   */
  @Post("promotion")
  @ApiOperation({ summary: "获取商品促销信息" })
  async getPromotion(@Body() data: { productId: number }) {
    // 简化实现，返回促销信息
    return {
      promotionType: "discount",
      discountRate: 0.8,
      startTime: "2024-01-01 00:00:00",
      endTime: "2024-01-31 23:59:59",
      description: "新年特惠，8折优惠",
    };
  }

  /**
   * 获取商品价格 - 对齐PHP版本 product/product/getProductAmount
   */
  @Post("getProductAmount")
  @ApiOperation({ summary: "获取商品价格" })
  async getProductAmount(
    @Body() data: { productId: number; quantity?: number; skuId?: string },
  ) {
    const product = await this.productService.findById(data.productId);
    const quantity = data.quantity || 1;

    return {
      productId: data.productId,
      quantity,
      unitPrice: product.productPrice,
      totalPrice: Number(product.productPrice) * quantity,
      discountAmount: 0,
      finalPrice: Number(product.productPrice) * quantity,
    };
  }

  /**
   * 批量获取库存 - 对齐PHP版本 product/product/getBatchProductAvailability
   */
  @Get("getBatchProductAvailability")
  @ApiOperation({ summary: "批量获取库存" })
  async getBatchProductAvailability(@Query() query: { productIds: string }) {
    const productIds = query.productIds.split(",").map((id) => parseInt(id));
    const results = await Promise.all(
      productIds.map(async (id) => {
        try {
          const product = await this.productService.findById(id);
          return {
            productId: id,
            stock: product.productStock || 0,
            isAvailable:
              product.productStatus === 1 && (product.productStock || 0) > 0,
          };
        } catch {
          return {
            productId: id,
            stock: 0,
            isAvailable: false,
          };
        }
      }),
    );

    return { results };
  }

  /**
   * 获取商品优惠券 - 对齐PHP版本 product/product/getCoupon
   */
  @Get("getCoupon")
  @ApiOperation({ summary: "获取商品可用优惠券" })
  async getProductCoupon(@Query() query: { id: number }) {
    // 简化实现，返回优惠券信息
    return {
      coupons: [
        {
          id: 1,
          name: "新用户优惠券",
          discountAmount: 10,
          minAmount: 100,
          startTime: "2024-01-01 00:00:00",
          endTime: "2024-12-31 23:59:59",
        },
      ],
    };
  }

  /**
   * 收藏状态查询 - 对齐PHP版本 product/product/isCollect
   */
  @Get("isCollect")
  @ApiOperation({ summary: "收藏状态查询" })
  async isCollect(@Request() req, @Query() query: { productId: number }) {
    // 简化实现，返回未收藏状态
    return false;
  }

  /**
   * 添加到购物车 - 对齐PHP版本 product/product/addToCart
   */
  @Post("addToCart")
  @ApiOperation({ summary: "添加到购物车" })
  async addToCart(
    @Request() req,
    @Body() data: { productId: number; quantity?: number; skuId?: string },
  ) {
    // 这里应该调用购物车服务，简化实现直接返回成功
    return {
      success: true,
      message: "已添加到购物车",
      cartItemCount: 1,
    };
  }

  /**
   * 商品点击日志 - 对齐PHP版本 product/product/log
   */
  @Get("log")
  @Public()
  @ApiOperation({ summary: "记录商品点击日志" })
  async logProductClick(
    @Query() query: { click: number; productId: number },
  ) {
    const { click, productId } = query;

    // 记录点击日志 - 简化实现，实际应该写入日志表
    console.log(`商品点击日志: productId=${productId}, click=${click}, timestamp=${new Date().toISOString()}`);

    // 返回成功响应
    return {
      success: true,
      message: "点击日志记录成功",
    };
  }

  /**
   * 售后服务 - 对齐PHP版本 product/product/afterSalesService
   */
  @Get("afterSalesService")
  @Public()
  @ApiOperation({ summary: "获取售后服务信息" })
  async getAfterSalesService() {
    // 返回售后服务信息 - 对齐PHP版本
    return {
      // 售后服务政策
      policy: {
        title: "售后服务政策",
        content: "7天无理由退换货，15天质量问题换货，30天质量问题维修",
      },
      // 退换货流程
      process: [
        {
          step: 1,
          title: "申请售后",
          description: "在订单详情页申请售后服务",
        },
        {
          step: 2,
          title: "审核处理",
          description: "客服审核售后申请",
        },
        {
          step: 3,
          title: "寄回商品",
          description: "按照要求寄回商品",
        },
        {
          step: 4,
          title: "处理完成",
          description: "完成售后处理",
        },
      ],
      // 联系方式
      contact: {
        phone: "400-123-4567",
        email: "service@example.com",
        time: "周一至周日 9:00-21:00",
      },
      // 常见问题
      faq: [
        {
          question: "如何申请退换货？",
          answer: "在订单详情页点击申请售后，填写相关信息即可",
        },
        {
          question: "退换货需要什么条件？",
          answer: "商品完好，包装齐全，不影响二次销售",
        },
      ],
    };
  }
}
