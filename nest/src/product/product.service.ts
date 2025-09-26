// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";
import { camelCase } from "src/common/utils/camel-case.util";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

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
      ids,
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {
      product_status: 1,
      is_delete: 0,
    };

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

    // 处理ids参数 - 与PHP版本保持一致
    let orderBy: any = { [sortField]: sortOrder };
    if (ids) {
      // 尝试解析ids参数
      let productIdArray: number[] = [];

      try {
        // 如果ids是JSON字符串，尝试解析
        const parsed = JSON.parse(ids);
        if (typeof parsed === 'object' && parsed.data) {
          // 如果是{"code":0,"data":"2,3,4,5","message":"success"}格式，提取data字段
          const idsString = parsed.data;
          productIdArray = idsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        } else if (typeof parsed === 'string') {
          // 如果直接是字符串
          productIdArray = parsed.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }
      } catch (e) {
        // 如果JSON解析失败，直接作为逗号分隔字符串处理
        productIdArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }

      if (productIdArray.length > 0) {
        where.product_id = { in: productIdArray };
        // Prisma不支持MySQL的FIELD()函数，所以这里按ID数组顺序查询需要手动处理
        // 这里先使用默认排序，实际应用中可能需要在内存中重新排序
      }
    }

    // 确保排序字段使用正确的数据库字段名
    const finalOrderBy: any = {};
    if (sortField === 'productId') {
      finalOrderBy.product_id = sortOrder;
    } else {
      finalOrderBy[sortField] = sortOrder;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(size), // 确保size是数字类型
        orderBy: finalOrderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return camelCase(products);
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
