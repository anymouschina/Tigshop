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
        { product_name: { contains: keyword } },
        { product_desc: { contains: keyword } },
        { keywords: { contains: keyword } },
      ];
    }

    if (categoryId) {
      where.category_id = Number(categoryId);
    }

    if (brandId) {
      where.brand_id = Number(brandId);
    }

    if (isEnable !== undefined) {
      // 映射为 product_status: 1/0
      where.product_status = isEnable ? 1 : 0;
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
      where.product_price = {};
      if (minPrice !== undefined) {
        where.product_price.gte = minPrice as any;
      }
      if (maxPrice !== undefined) {
        where.product_price.lte = maxPrice as any;
      }
    }

    // 处理ids参数 - 与PHP版本保持一致
    const orderBy: any = { [sortField]: sortOrder };
    if (ids !== undefined && ids !== null && ids !== "") {
      // 统一归一成数字ID数组
      const toNumberArray = (val: any): number[] => {
        if (val == null) return [];
        if (Array.isArray(val)) {
          return val
            .map((x) => Number(String(x).trim()))
            .filter((n) => !Number.isNaN(n));
        }
        if (typeof val === "number") return Number.isNaN(val) ? [] : [val];
        if (typeof val === "string") {
          // 直接以逗号分隔
          return val
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((n) => !Number.isNaN(n));
        }
        if (typeof val === "object") {
          // 兼容 { data: "1,2,3" }
          if (val.data) return toNumberArray(val.data);
          // 兼容纯数组对象
          if (Array.isArray(val)) return toNumberArray(val);
        }
        return [];
      };

      let productIdArray: number[] = [];
      // 先尝试JSON解析字符串
      if (typeof ids === "string") {
        try {
          const parsed = JSON.parse(ids);
          productIdArray = toNumberArray(parsed);
        } catch (_) {
          productIdArray = toNumberArray(ids);
        }
      } else {
        productIdArray = toNumberArray(ids);
      }

      if (productIdArray.length > 0) {
        where.product_id = { in: productIdArray };
        // 提示：如果需要按传入顺序排序，需在取回后手动排序。
      }
    }

    // 确保排序字段使用正确的数据库字段名
    const finalOrderBy: any = {};
    // 常见排序字段映射（驼峰 -> 下划线）
    const sortFieldMap: Record<string, string> = {
      productId: "product_id",
      productPrice: "product_price",
      productStock: "product_stock",
      virtualSales: "virtual_sales",
      sortOrder: "sort_order",
      addTime: "add_time",
      lastUpdate: "last_update",
      productStatus: "product_status",
      clickCount: "click_count",
    };
    const prismaSortField = sortFieldMap[sortField] || sortField;
    finalOrderBy[prismaSortField] = sortOrder;

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
   * 获取待审核商品数量（用于admin列表角标）
   * 对齐PHP：check_status=0 且 is_delete=0
   */
  async getWaitingCheckedCount(query?: any): Promise<number> {
    const where: any = {
      check_status: 0,
      is_delete: 0,
    };
    // 按店铺筛选（若有）
    if (query?.shopId) {
      where.shop_id = Number(query.shopId);
    }
    const count = await this.prisma.product.count({ where });
    return count;
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
          product_weight: product.product_weight,
        },
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
          product_weight: product.product_weight,
        },
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
