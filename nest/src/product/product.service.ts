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
      where: { product_name: createProductDto.name },
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

    return camelCase({
      records: products,
      total,
      waitingCheckedCount: 0,
    });
  }

  /**
   * 根据ID查找商品
   * @param id 商品ID
   * @returns 商品详情
   */
  async findById(id: number) {
    // 由于product表有复合主键，需要使用findFirst而不是findUnique
    const product = await this.prisma.product.findFirst({
      where: { product_id: id },
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
          product_name: updateProductDto.name,
          product_id: { not: id },
        },
      });

      if (existingProduct) {
        throw new BadRequestException("商品名称已存在");
      }
    }

    // 使用原始SQL更新商品以绕过XOR类型问题
    const result = (await this.prisma.$queryRaw`
      UPDATE product
      SET
        product_name = ${updateProductDto.name || null},
        subtitle = ${updateProductDto.subtitle || null},
        product_desc = ${updateProductDto.description || null},
        product_price = ${updateProductDto.price || null},
        market_price = ${updateProductDto.marketPrice || null},
        cost_price = ${updateProductDto.costPrice || null},
        product_stock = ${updateProductDto.stock || null},
        virtual_sales = ${updateProductDto.sales || null},
        category_id = ${updateProductDto.categoryId || null},
        brand_id = ${updateProductDto.brandId || null},
        suppliers_id = ${updateProductDto.supplierId || null},
        pic_url = ${updateProductDto.image || null},
        pic_thumb = ${updateProductDto.images || null},
        product_video = ${updateProductDto.video || null},
        weight = ${updateProductDto.weight || null},
        free_shipping = ${updateProductDto.shippingFee || null},
        limit_number = ${updateProductDto.minBuy || null},
        keywords = ${updateProductDto.keywords || null},
        sort_order = ${updateProductDto.sort || null},
        is_best = ${updateProductDto.isBest !== undefined ? updateProductDto.isBest : false},
        is_new = ${updateProductDto.isNew !== undefined ? updateProductDto.isNew : false},
        is_hot = ${updateProductDto.isHot !== undefined ? updateProductDto.isHot : false},
        last_update = UNIX_TIMESTAMP()
      WHERE product_id = ${id}
      RETURNING product_id, product_name, subtitle, product_desc, product_price, market_price, cost_price, product_stock, virtual_sales, category_id, brand_id, suppliers_id, pic_url, pic_thumb, product_video, weight, free_shipping, limit_number, keywords, sort_order, is_best, is_new, is_hot, product_status, add_time, last_update
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

    // 由于product表有复合主键，需要使用findFirst找到记录然后删除
    const product = await this.prisma.product.findFirst({
      where: { product_id: id },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    return this.prisma.product.delete({
      where: {
        product_id_brand_id_product_weight: {
          product_id: id,
          brand_id: product.brand_id,
          product_weight: product.product_weight
        }
      },
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

    // 由于product表有复合主键，需要使用findFirst找到记录然后更新
    const product = await this.prisma.product.findFirst({
      where: { product_id: id },
    });

    if (!product) {
      throw new NotFoundException("商品不存在");
    }

    return this.prisma.product.update({
      where: {
        product_id_brand_id_product_weight: {
          product_id: id,
          brand_id: product.brand_id,
          product_weight: product.product_weight
        }
      },
      data: { product_status: status === "ENABLE" ? 1 : 0 },
    });
  }

  /**
   * 获取商品统计
   * @returns 商品统计信息
   */
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { product_status: 1 } }),
      this.prisma.product.count({ where: { product_status: 0 } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }
}
