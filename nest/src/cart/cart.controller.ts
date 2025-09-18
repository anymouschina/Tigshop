import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Shopping Cart')
@Controller('api/cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * 获取购物车
   */
  @Get()
  @ApiOperation({ summary: '获取购物车' })
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  /**
   * 添加商品到购物车
   */
  @Post('add')
  @ApiOperation({ summary: '添加商品到购物车' })
  async addItem(
    @Request() req,
    @Body() { productId, quantity }: { productId: number; quantity?: number },
  ) {
    return this.cartService.addItem(
      req.user.userId,
      productId,
      quantity || 1,
    );
  }

  /**
   * 更新购物车商品数量
   */
  @Put('item/:cartItemId')
  @ApiOperation({ summary: '更新购物车商品数量' })
  async updateQuantity(
    @Request() req,
    @Param('cartItemId') cartItemId: string,
    @Body() { quantity }: { quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.userId,
      Number(cartItemId),
      quantity,
    );
  }

  /**
   * 删除购物车商品
   */
  @Delete('item/:cartItemId')
  @ApiOperation({ summary: '删除购物车商品' })
  async removeItem(@Request() req, @Param('cartItemId') cartItemId: string) {
    return this.cartService.removeItem(req.user.userId, Number(cartItemId));
  }

  /**
   * 清空购物车
   */
  @Delete('clear')
  @ApiOperation({ summary: '清空购物车' })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }

  
  /**
   * 获取选中的购物车商品
   */
  @Get('selected')
  @ApiOperation({ summary: '获取选中的购物车商品' })
  async getSelectedItems(@Request() req) {
    return this.cartService.getSelectedItems(req.user.userId);
  }
}