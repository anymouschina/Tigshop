import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateProductDto, CreateProductSpecDto, CreateProductAttrDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 创建商品
   */
  async create(createProductDto: CreateProductDto, userId?: number) {
    this.logger.debug(`创建商品: ${JSON.stringify(createProductDto)}`);

    const {
      specs,
      attrs,
      categoryId,
      brandId,
      supplierId,
      shopId,
      images,
      ...productData
    } = createProductDto;

    // 验证分类是否存在
    if (categoryId) {
      const category = await this.databaseService.category.findUnique({
        where: { categoryId }
      });
      if (!category) {
        throw new BadRequestException('分类不存在');
      }
    }

    // 验证品牌是否存在
    if (brandId) {
      const brand = await this.databaseService.brand.findUnique({
        where: { brandId }
      });
      if (!brand) {
        throw new BadRequestException('品牌不存在');
      }
    }

    try {
      const product = await this.databaseService.product.create({
        data: {
          ...productData,
          categoryId,
          brandId,
          supplierId,
          shopId: shopId || 1,
          images: images || [],
          specs: {
            create: specs?.map(spec => ({
              specName: spec.specName,
              specValue: spec.specValue,
              specPrice: spec.specPrice,
              specStock: spec.specStock,
              specSku: spec.specSku,
              specImage: spec.specImage,
              sort: spec.sort
            })) || []
          },
          attrs: {
            create: attrs?.map(attr => ({
              attrName: attr.attrName,
              attrValue: attr.attrValue,
              sort: attr.sort
            })) || []
          }
        },
        include: {
          category: true,
          brand: true,
          supplier: true,
          shop: true,
          specs: true,
          attrs: true
        }
      });

      this.logger.log(`商品创建成功: ${product.productId}`);
      return product;
    } catch (error) {
      this.logger.error(`创建商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('创建商品失败');
    }
  }

  /**
   * 获取商品列表
   */
  async findAll(queryDto: ProductQueryDto) {
    this.logger.debug(`查询商品列表: ${JSON.stringify(queryDto)}`);

    const {
      page = 1,
      size = 15,
      sortField = 'productId',
      sortOrder = 'desc',
      keyword,
      categoryId,
      brandId,
      shopId = -2,
      introType,
      isEnable,
      isBest,
      isNew,
      isHot,
      isRecommend,
      minPrice,
      maxPrice,
      ids,
      isDelete = -1,
      ...filters
    } = queryDto;

    const skip = (page - 1) * size;

    // 构建查询条件
    const where: Prisma.ProductWhereInput = {
      isDeleted: isDelete === 1,
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { subtitle: { contains: keyword, mode: 'insensitive' } },
          { keywords: { contains: keyword, mode: 'insensitive' } }
        ]
      }),
      ...(categoryId !== undefined && { categoryId }),
      ...(brandId !== undefined && { brandId }),
      ...(shopId !== -2 && { shopId }),
      ...(introType !== undefined && {
        [introType === 'best' ? 'isBest' :
         introType === 'new' ? 'isNew' :
         introType === 'hot' ? 'isHot' : 'isRecommend']: true
      }),
      ...(isEnable !== undefined && { isEnable }),
      ...(isBest !== undefined && { isBest }),
      ...(isNew !== undefined && { isNew }),
      ...(isHot !== undefined && { isHot }),
      ...(isRecommend !== undefined && { isRecommend }),
      ...(minPrice !== undefined && maxPrice !== undefined && {
        price: { gte: minPrice, lte: maxPrice }
      }),
      ...(minPrice !== undefined && maxPrice === undefined && {
        price: { gte: minPrice }
      }),
      ...(maxPrice !== undefined && minPrice === undefined && {
        price: { lte: maxPrice }
      }),
      ...(ids && {
        productId: {
          in: ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        }
      })
    };

    // 移除 undefined 的条件
    Object.keys(where).forEach(key => {
      if (where[key] === undefined || where[key] === null) {
        delete where[key];
      }
    });

    try {
      const [products, total] = await Promise.all([
        this.databaseService.product.findMany({
          skip,
          take: size,
          where,
          orderBy: {
            [sortField]: sortOrder
          },
          include: {
            category: true,
            brand: true,
            supplier: true,
            shop: true,
            specs: true,
            attrs: true
          }
        }),
        this.databaseService.product.count({ where })
      ]);

      return {
        records: products,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size)
      };
    } catch (error) {
      this.logger.error(`查询商品列表失败: ${error.message}`, error.stack);
      throw new BadRequestException('查询商品列表失败');
    }
  }

  /**
   * 获取商品详情
   */
  async findOne(id: number) {
    this.logger.debug(`获取商品详情: ${id}`);

    try {
      const product = await this.databaseService.product.findUnique({
        where: { productId: id },
        include: {
          category: true,
          brand: true,
          supplier: true,
          shop: true,
          specs: {
            orderBy: { sort: 'asc' }
          },
          attrs: {
            orderBy: { sort: 'asc' }
          }
        }
      });

      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      if (product.isDeleted) {
        throw new NotFoundException('商品已被删除');
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`获取商品详情失败: ${error.message}`, error.stack);
      throw new BadRequestException('获取商品详情失败');
    }
  }

  /**
   * 更新商品
   */
  async update(id: number, updateProductDto: UpdateProductDto) {
    this.logger.debug(`更新商品: ${id}, ${JSON.stringify(updateProductDto)}`);

    // 检查商品是否存在
    const existingProduct = await this.databaseService.product.findUnique({
      where: { productId: id }
    });

    if (!existingProduct) {
      throw new NotFoundException('商品不存在');
    }

    if (existingProduct.isDeleted) {
      throw new BadRequestException('商品已被删除，无法更新');
    }

    const {
      specs,
      attrs,
      categoryId,
      brandId,
      supplierId,
      images,
      ...productData
    } = updateProductDto;

    try {
      // 先删除现有的规格和属性，然后重新创建
      await this.databaseService.productSpec.deleteMany({
        where: { productId: id }
      });

      await this.databaseService.productAttr.deleteMany({
        where: { productId: id }
      });

      const product = await this.databaseService.product.update({
        where: { productId: id },
        data: {
          ...productData,
          categoryId,
          brandId,
          supplierId,
          images: images || undefined,
          specs: {
            create: specs?.map(spec => ({
              specName: spec.specName,
              specValue: spec.specValue,
              specPrice: spec.specPrice,
              specStock: spec.specStock,
              specSku: spec.specSku,
              specImage: spec.specImage,
              sort: spec.sort
            })) || []
          },
          attrs: {
            create: attrs?.map(attr => ({
              attrName: attr.attrName,
              attrValue: attr.attrValue,
              sort: attr.sort
            })) || []
          }
        },
        include: {
          category: true,
          brand: true,
          supplier: true,
          shop: true,
          specs: true,
          attrs: true
        }
      });

      this.logger.log(`商品更新成功: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`更新商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('更新商品失败');
    }
  }

  /**
   * 删除商品（软删除）
   */
  async remove(id: number) {
    this.logger.debug(`删除商品: ${id}`);

    const product = await this.databaseService.product.findUnique({
      where: { productId: id }
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (product.isDeleted) {
      throw new BadRequestException('商品已被删除');
    }

    try {
      await this.databaseService.product.update({
        where: { productId: id },
        data: { isDeleted: true, deletedAt: new Date() }
      });

      this.logger.log(`商品删除成功: ${id}`);
      return { message: '商品删除成功' };
    } catch (error) {
      this.logger.error(`删除商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('删除商品失败');
    }
  }

  /**
   * 恢复商品
   */
  async restore(id: number) {
    this.logger.debug(`恢复商品: ${id}`);

    const product = await this.databaseService.product.findUnique({
      where: { productId: id }
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (!product.isDeleted) {
      throw new BadRequestException('商品未被删除');
    }

    try {
      await this.databaseService.product.update({
        where: { productId: id },
        data: { isDeleted: false, deletedAt: null }
      });

      this.logger.log(`商品恢复成功: ${id}`);
      return { message: '商品恢复成功' };
    } catch (error) {
      this.logger.error(`恢复商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('恢复商品失败');
    }
  }

  /**
   * 获取商品库存信息
   */
  async getStock(productId: number, specId?: number) {
    this.logger.debug(`获取商品库存: ${productId}, ${specId}`);

    const product = await this.databaseService.product.findUnique({
      where: { productId: id },
      include: {
        specs: specId ? { where: { specId } } : true
      }
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (specId) {
      const spec = product.specs[0];
      if (!spec) {
        throw new NotFoundException('商品规格不存在');
      }
      return {
        productId,
        specId,
        stock: spec.specStock,
        price: spec.specPrice || product.price
      };
    }

    return {
      productId,
      stock: product.stock,
      price: product.price
    };
  }

  /**
   * 更新商品库存
   */
  async updateStock(productId: number, quantity: number, specId?: number) {
    this.logger.debug(`更新商品库存: ${productId}, ${quantity}, ${specId}`);

    try {
      if (specId) {
        // 更新规格库存
        const spec = await this.databaseService.productSpec.findUnique({
          where: { specId }
        });

        if (!spec || spec.productId !== productId) {
          throw new NotFoundException('商品规格不存在');
        }

        const newStock = spec.specStock + quantity;
        if (newStock < 0) {
          throw new BadRequestException('库存不足');
        }

        await this.databaseService.productSpec.update({
          where: { specId },
          data: { specStock: newStock }
        });

        // 同时更新商品总库存
        const totalStock = await this.databaseService.productSpec.aggregate({
          where: { productId },
          _sum: { specStock: true }
        });

        await this.databaseService.product.update({
          where: { productId },
          data: { stock: totalStock._sum.specStock || 0 }
        });
      } else {
        // 更新商品库存
        const product = await this.databaseService.product.findUnique({
          where: { productId }
        });

        if (!product) {
          throw new NotFoundException('商品不存在');
        }

        const newStock = product.stock + quantity;
        if (newStock < 0) {
          throw new BadRequestException('库存不足');
        }

        await this.databaseService.product.update({
          where: { productId },
          data: { stock: newStock }
        });
      }

      this.logger.log(`商品库存更新成功: ${productId}, ${quantity}`);
      return { message: '库存更新成功' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`更新商品库存失败: ${error.message}`, error.stack);
      throw new BadRequestException('更新商品库存失败');
    }
  }

  /**
   * 获取热门商品
   */
  async getHotProducts(limit = 10) {
    this.logger.debug(`获取热门商品: ${limit}`);

    try {
      const products = await this.databaseService.product.findMany({
        where: {
          isDeleted: false,
          isEnable: true,
          isHot: true
        },
        orderBy: { sales: 'desc' },
        take: limit,
        include: {
          category: true,
          brand: true
        }
      });

      return products;
    } catch (error) {
      this.logger.error(`获取热门商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('获取热门商品失败');
    }
  }

  /**
   * 获取推荐商品
   */
  async getRecommendedProducts(limit = 10) {
    this.logger.debug(`获取推荐商品: ${limit}`);

    try {
      const products = await this.databaseService.product.findMany({
        where: {
          isDeleted: false,
          isEnable: true,
          isRecommend: true
        },
        orderBy: { sort: 'asc' },
        take: limit,
        include: {
          category: true,
          brand: true
        }
      });

      return products;
    } catch (error) {
      this.logger.error(`获取推荐商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('获取推荐商品失败');
    }
  }

  /**
   * 获取新品商品
   */
  async getNewProducts(limit = 10) {
    this.logger.debug(`获取新品商品: ${limit}`);

    try {
      const products = await this.databaseService.product.findMany({
        where: {
          isDeleted: false,
          isEnable: true,
          isNew: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          category: true,
          brand: true
        }
      });

      return products;
    } catch (error) {
      this.logger.error(`获取新品商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('获取新品商品失败');
    }
  }

  /**
   * 搜索商品
   */
  async search(keyword: string, limit = 20) {
    this.logger.debug(`搜索商品: ${keyword}`);

    try {
      const products = await this.databaseService.product.findMany({
        where: {
          isDeleted: false,
          isEnable: true,
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { subtitle: { contains: keyword, mode: 'insensitive' } },
            { keywords: { contains: keyword, mode: 'insensitive' } }
          ]
        },
        orderBy: { sort: 'asc' },
        take: limit,
        include: {
          category: true,
          brand: true
        }
      });

      return products;
    } catch (error) {
      this.logger.error(`搜索商品失败: ${error.message}`, error.stack);
      throw new BadRequestException('搜索商品失败');
    }
  }
}
