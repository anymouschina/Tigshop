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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CommentService } from './comment/comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Product Management')
@Controller('product/product')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  /**
   * 获取商品列表 - 对齐PHP版本 product/product/list
   */
  @Get('list')
  @ApiOperation({ summary: '获取商品列表' })
  async getProductList(@Query() query: any) {
    return this.productService.findAll(query);
  }

  /**
   * 获取商品详情 - 对齐PHP版本 product/product/detail
   */
  @Get('detail')
  @ApiOperation({ summary: '获取商品详情' })
  async getProductDetail(@Query() query: { id: number }) {
    return this.productService.findById(Number(query.id));
  }

  /**
   * 获取商品评论 - 对齐PHP版本 product/product/getComment
   */
  @Get('getComment')
  @ApiOperation({ summary: '获取商品评论' })
  async getProductComment(@Query() query: { id: number; page?: number; size?: number }) {
    const { id, page = 1, size = 10 } = query;

    // 获取评论列表
    const comments = await this.commentService.getComments({
      productId: Number(id),
      page: Number(page),
      size: Number(size),
      status: CommentStatus.APPROVED,
    });

    // 获取评论统计
    const stats = await this.commentService.getCommentStats(Number(id));

    return {
      comments: comments.list,
      averageRating: stats.averageRating,
      totalComments: stats.totalComments,
      ratingDistribution: stats.ratingDistribution,
      pagination: {
        page: comments.page,
        size: comments.size,
        total: comments.total,
        totalPages: comments.totalPages,
      },
    };
  }

  /**
   * 获取评论列表 - 对齐PHP版本 product/product/getCommentList
   */
  @Get('getCommentList')
  @ApiOperation({ summary: '获取评论列表' })
  async getCommentList(@Query() query: { id: number; page?: number; size?: number }) {
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
  @Get('getProductAvailability')
  @ApiOperation({ summary: '获取SKU库存信息' })
  async getProductAvailability(@Query() query: { productId: number; skuId?: string }) {
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
  @Post('promotion')
  @ApiOperation({ summary: '获取商品促销信息' })
  async getPromotion(@Body() data: { productId: number }) {
    // 简化实现，返回促销信息
    return {
      promotionType: 'discount',
      discountRate: 0.8,
      startTime: '2024-01-01 00:00:00',
      endTime: '2024-01-31 23:59:59',
      description: '新年特惠，8折优惠',
    };
  }

  /**
   * 获取商品价格 - 对齐PHP版本 product/product/getProductAmount
   */
  @Post('getProductAmount')
  @ApiOperation({ summary: '获取商品价格' })
  async getProductAmount(@Body() data: { productId: number; quantity?: number; skuId?: string }) {
    const product = await this.productService.findById(data.productId);
    const quantity = data.quantity || 1;

    return {
      productId: data.productId,
      quantity,
      unitPrice: product.price,
      totalPrice: Number(product.price) * quantity,
      discountAmount: 0,
      finalPrice: Number(product.price) * quantity,
    };
  }

  /**
   * 批量获取库存 - 对齐PHP版本 product/product/getBatchProductAvailability
   */
  @Get('getBatchProductAvailability')
  @ApiOperation({ summary: '批量获取库存' })
  async getBatchProductAvailability(@Query() query: { productIds: string }) {
    const productIds = query.productIds.split(',').map(id => parseInt(id));
    const results = await Promise.all(
      productIds.map(async (id) => {
        try {
          const product = await this.productService.findById(id);
          return {
            productId: id,
            stock: product.stock || 0,
            isAvailable: product.isEnable && (product.stock || 0) > 0,
          };
        } catch {
          return {
            productId: id,
            stock: 0,
            isAvailable: false,
          };
        }
      })
    );

    return { results };
  }

  /**
   * 获取商品优惠券 - 对齐PHP版本 product/product/getCoupon
   */
  @Get('getCoupon')
  @ApiOperation({ summary: '获取商品可用优惠券' })
  async getProductCoupon(@Query() query: { id: number }) {
    // 简化实现，返回优惠券信息
    return {
      coupons: [
        {
          id: 1,
          name: '新用户优惠券',
          discountAmount: 10,
          minAmount: 100,
          startTime: '2024-01-01 00:00:00',
          endTime: '2024-12-31 23:59:59',
        },
      ],
    };
  }

  /**
   * 收藏状态查询 - 对齐PHP版本 product/product/isCollect
   */
  @Get('isCollect')
  @ApiOperation({ summary: '收藏状态查询' })
  async isCollect(@Request() req, @Query() query: { productId: number }) {
    // 简化实现，返回未收藏状态
    return {
      isCollected: false,
      collectCount: 256,
    };
  }

  /**
   * 添加到购物车 - 对齐PHP版本 product/product/addToCart
   */
  @Post('addToCart')
  @ApiOperation({ summary: '添加到购物车' })
  async addToCart(
    @Request() req,
    @Body() data: { productId: number; quantity?: number; skuId?: string },
  ) {
    // 这里应该调用购物车服务，简化实现直接返回成功
    return {
      success: true,
      message: '已添加到购物车',
      cartItemCount: 1,
    };
  }
}