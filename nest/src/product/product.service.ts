// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * 创建商品
   * @param createProductDto 商品创建数据
   * @returns 创建的商品
   */
  async create(createProductDto: CreateProductDto) {
    // 检查商品名称是否已存在
    const existingProduct = await this.prisma.product.findFirst({
      where: { productName: createProductDto.name },
    });

    if (existingProduct) {
      throw new BadRequestException("商品名称已存在");
    }

    // 转换DTO为Prisma兼容格式
    const productData: any = {
      name: createProductDto.name,
      subtitle: createProductDto.subtitle,
      description: createProductDto.description,
      price: createProductDto.price,
      marketPrice: createProductDto.marketPrice,
      costPrice: createProductDto.costPrice,
      stock: createProductDto.stock,
      sales: createProductDto.sales,
      categoryId: createProductDto.categoryId,
      brandId: createProductDto.brandId,
      supplierId: createProductDto.supplierId,
      shopId: createProductDto.shopId || 1,
      image: createProductDto.image,
      images: createProductDto.images,
      video: createProductDto.video,
      videoCover: createProductDto.videoCover,
      specType: createProductDto.specType,
      weight: createProductDto.weight,
      volume: createProductDto.volume,
      shippingFee: createProductDto.shippingFee,
      minBuy: createProductDto.minBuy,
      maxBuy: createProductDto.maxBuy,
      keywords: createProductDto.keywords,
      seoTitle: createProductDto.seoTitle,
      seoKeywords: createProductDto.seoKeywords,
      seoDescription: createProductDto.seoDescription,
      sort: createProductDto.sort,
      isBest: createProductDto.isBest,
      isNew: createProductDto.isNew,
      isHot: createProductDto.isHot,
      isRecommend: createProductDto.isRecommend,
    };

    return this.prisma.product.create({
      data: productData,
    });
  }

  /**
   * 获取商品列表
   * @param queryDto 查询参数
   * @returns 商品列表
   */
  async findAll(queryDto: ProductQueryDto) {
    const {
      page = 1,
      size = 15,
      keyword,
      categoryId,
      brandId,
      introType,
      isEnable,
      isBest,
      isNew,
      isHot,
      isRecommend,
      minPrice,
      maxPrice,
      sortField = "productId",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (isEnable !== undefined) {
      where.isEnable = isEnable;
    }

    if (isBest !== undefined) {
      where.isBest = isBest;
    }

    if (isNew !== undefined) {
      where.isNew = isNew;
    }

    if (isHot !== undefined) {
      where.isHot = isHot;
    }

    if (isRecommend !== undefined) {
      where.isRecommend = isRecommend;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortField]: sortOrder },
        include: {
          brand: true,
          category: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      list: products,
      total,
      page,
      limit: size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 根据ID查找商品
   * @param id 商品ID
   * @returns 商品详情
   */
  async findById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { productId: id },
      include: {
        brand: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    return product;
  }

  /**
   * 更新商品
   * @param id 商品ID
   * @param updateProductDto 更新数据
   * @returns 更新后的商品
   */
  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findById(id);

    // 如果更新名称，检查是否与其他商品冲突
    if (updateProductDto.name) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          productName: updateProductDto.name,
          productId: { not: id },
        },
      });

      if (existingProduct) {
        throw new BadRequestException("商品名称已存在");
      }
    }

    // 使用原始SQL更新商品以绕过XOR类型问题
    const result = (await this.prisma.$queryRaw`
      UPDATE "Product"
      SET
        productName = ${updateProductDto.name || null},
        subtitle = ${updateProductDto.subtitle || null},
        description = ${updateProductDto.description || null},
        productPrice = ${updateProductDto.price || null},
        marketPrice = ${updateProductDto.marketPrice || null},
        costPrice = ${updateProductDto.costPrice || null},
        productStock = ${updateProductDto.stock || null},
        sales = ${updateProductDto.sales || null},
        categoryId = ${updateProductDto.categoryId || null},
        brandId = ${updateProductDto.brandId || null},
        supplierId = ${updateProductDto.supplierId || null},
        image = ${updateProductDto.image || null},
        images = ${updateProductDto.images || null},
        video = ${updateProductDto.video || null},
        videoCover = ${updateProductDto.videoCover || null},
        specType = ${updateProductDto.specType || null},
        weight = ${updateProductDto.weight || null},
        volume = ${updateProductDto.volume || null},
        shippingFee = ${updateProductDto.shippingFee || null},
        minBuy = ${updateProductDto.minBuy || null},
        maxBuy = ${updateProductDto.maxBuy || null},
        keywords = ${updateProductDto.keywords || null},
        seoTitle = ${updateProductDto.seoTitle || null},
        seoKeywords = ${updateProductDto.seoKeywords || null},
        seoDescription = ${updateProductDto.seoDescription || null},
        sort = ${updateProductDto.sort || null},
        isBest = ${updateProductDto.isBest !== undefined ? updateProductDto.isBest : false},
        isNew = ${updateProductDto.isNew !== undefined ? updateProductDto.isNew : false},
        isHot = ${updateProductDto.isHot !== undefined ? updateProductDto.isHot : false},
        isRecommend = ${updateProductDto.isRecommend !== undefined ? updateProductDto.isRecommend : false},
        "updatedAt" = NOW()
      WHERE productId = ${id}
      RETURNING productId, productName, subtitle, description, productPrice, marketPrice, costPrice, productStock, sales, categoryId, brandId, supplierId, image, images, video, videoCover, specType, weight, volume, shippingFee, minBuy, maxBuy, keywords, seoTitle, seoKeywords, seoDescription, sort, isBest, isNew, isHot, isRecommend, productStatus, "createdAt", "updatedAt"
    `) as any[];

    return result[0];
  }

  /**
   * 删除商品
   * @param id 商品ID
   * @returns 删除结果
   */
  async remove(id: number) {
    await this.findById(id);

    return this.prisma.product.delete({
      where: { productId: id },
    });
  }

  /**
   * 更新商品状态
   * @param id 商品ID
   * @param status 商品状态
   * @returns 更新后的商品
   */
  async updateStatus(id: number, status: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { productId: id },
      data: { productStatus: status === "ENABLE" ? 1 : 0 },
    });
  }

  /**
   * 获取商品统计
   * @returns 商品统计信息
   */
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { productStatus: 1 } }),
      this.prisma.product.count({ where: { productStatus: 0 } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}
