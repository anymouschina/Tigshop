// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateArticleCategoryDto,
  UpdateArticleCategoryDto,
  ArticleCategoryQueryDto,
  ArticleCategoryStatus,
  ArticleCategoryConfigDto,
} from "./dto/articleCategory.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ArticleCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: ArticleCategoryQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "category_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { category_id: { contains: keyword } },
        { name: { contains: keyword } },
        { parent_id: { contains: keyword } },
        { sort: { contains: keyword } },
        { status: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.article_category.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.article_category.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: number) {
    const item = await this.prisma.article_category.findUnique({
      where: { category_id: id },
    });

    if (!item) {
      throw new NotFoundException("文章分类不存在");
    }

    return item;
  }

  async create(createDto: CreateArticleCategoryDto) {
    const item = await this.prisma.article_category.create({
      data: {
        name: createDto.name,
        sort: createDto.sort,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateArticleCategoryDto) {
    const item = await this.prisma.article_category.findUnique({
      where: { category_id: id },
    });

    if (!item) {
      throw new NotFoundException("文章分类不存在");
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.sort !== undefined) {
      updateData.sort = updateDto.sort;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.article_category.update({
      where: { category_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.article_category.findUnique({
      where: { category_id: id },
    });

    if (!item) {
      throw new NotFoundException("文章分类不存在");
    }

    await this.prisma.article_category.delete({
      where: { category_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.article_category.deleteMany({
      where: { category_id: { in: ids } },
    });
  }

  async getConfig(): Promise<ArticleCategoryConfigDto> {
    return {
      statusConfig: {
        [ArticleCategoryStatus.DISABLED]: "禁用",
        [ArticleCategoryStatus.ENABLED]: "启用",
      },
    };
  }
}
