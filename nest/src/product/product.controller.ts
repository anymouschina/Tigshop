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
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('Product Management')
@Controller('api/products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 创建商品
   */
  @Post()
  @ApiOperation({ summary: '创建商品' })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  /**
   * 获取商品列表
   */
  @Get()
  @ApiOperation({ summary: '获取商品列表' })
  async findAll(@Query() queryDto: ProductQueryDto) {
    return this.productService.findAll(queryDto);
  }

  /**
   * 获取商品详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取商品详情' })
  async findById(@Param('id') id: string) {
    return this.productService.findById(Number(id));
  }

  /**
   * 更新商品
   */
  @Put(':id')
  @ApiOperation({ summary: '更新商品' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(Number(id), updateProductDto);
  }

  /**
   * 删除商品
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除商品' })
  async remove(@Param('id') id: string) {
    return this.productService.remove(Number(id));
  }

  /**
   * 更新商品状态
   */
  @Put(':id/status')
  @ApiOperation({ summary: '更新商品状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: { status: boolean },
  ) {
    return this.productService.updateStatus(Number(id), status);
  }

  /**
   * 获取商品统计
   */
  @Get('stats/summary')
  @ApiOperation({ summary: '获取商品统计' })
  async getStats() {
    return this.productService.getStats();
  }
}