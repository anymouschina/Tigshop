// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { CreateArticleDto, UpdateArticleDto } from "./dto/article.dto";

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any) {
    const { page, size, sort_field, sort_order, keyword, category_id, status } =
      filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const where: any = {};
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { summary: { contains: keyword } },
      ];
    }
    if (category_id) {
      where.category_id = parseInt(category_id);
    }
    if (status !== "") {
      where.status = parseInt(status);
    }

    const records = await this.prisma.article.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        admin: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      skip,
      take: size,
      orderBy,
    });

    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const { page, size, sort_field, sort_order, keyword, category_id, status } =
      filter;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { summary: { contains: keyword } },
      ];
    }
    if (category_id) {
      where.category_id = parseInt(category_id);
    }
    if (status !== "") {
      where.status = parseInt(status);
    }

    return this.prisma.article.count({ where });
  }

  async getDetail(id: number) {
    const item = await this.prisma.article.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        admin: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error("文章不存在");
    }

    return item;
  }

  async createArticle(createData: CreateArticleDto) {
    return this.prisma.article.create({
      data: {
        title: createData.title,
        summary: createData.summary,
        content: createData.content,
        category_id: createData.category_id,
        cover_image: createData.cover_image,
        author: createData.author,
        source: createData.source,
        sort_order: createData.sort_order || 0,
        status: createData.status || 0,
        create_time: new Date(),
        admin_id: createData.admin_id || 1,
      },
    });
  }

  async updateArticle(id: number, updateData: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data: {
        ...updateData,
        update_time: new Date(),
      },
    });
  }

  async deleteArticle(id: number) {
    return this.prisma.article.delete({
      where: { id },
    });
  }

  async batchDeleteArticle(ids: number[]) {
    return this.prisma.article.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getArticleStatistics() {
    const [total, published, draft, deleted] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { status: 1 } }),
      this.prisma.article.count({ where: { status: 0 } }),
      this.prisma.article.count({ where: { status: -1 } }),
    ]);

    return {
      total,
      published,
      draft,
      deleted,
    };
  }

  async getRecentArticles(limit: number = 5) {
    return this.prisma.article.findMany({
      where: { status: 1 },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { create_time: "desc" },
      take: limit,
    });
  }

  async getArticlesByCategory(categoryId: number, limit: number = 10) {
    return this.prisma.article.findMany({
      where: {
        category_id: categoryId,
        status: 1,
      },
      orderBy: { sort_order: "asc", create_time: "desc" },
      take: limit,
    });
  }

  async incrementViewCount(id: number) {
    return this.prisma.article.update({
      where: { id },
      data: {
        view_count: {
          increment: 1,
        },
      },
    });
  }
}
