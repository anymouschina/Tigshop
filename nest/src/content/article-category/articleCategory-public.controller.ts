// @ts-nocheck
import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { Public } from "../../auth/decorators/public.decorator";

@ApiTags("User - 文章分类")
@Controller("api/article/category")
export class UserArticleCategoryPublicController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 文章分类列表 - 对齐 PHP: /api/article/category/list
   * 入参：category_sn（可选），返回该分类的子分类树
   */
  @Get("list")
  @Public()
  @ApiOperation({ summary: "文章分类列表" })
  @ApiQuery({ name: "category_sn", required: false })
  async list(@Query("category_sn") category_sn?: string) {
    if (!category_sn) {
      // 返回所有一级分类及其子项
      const roots = await this.prisma.article_category.findMany({
        where: { parent_id: 0 },
        orderBy: { sort_order: "asc" },
      });
      const children = await this.prisma.article_category.findMany({
        where: { parent_id: { gt: 0 } },
        orderBy: { sort_order: "asc" },
      });
      const byParent: Record<number, any[]> = {};
      for (const c of children) {
        byParent[c.parent_id] ??= [];
        byParent[c.parent_id].push(c);
      }
      return {
        code: 0,
        message: "success",
        data: roots.map((r) => ({
          ...r,
          children: byParent[r.article_category_id] || [],
        })),
      };
    }

    const parent = await this.prisma.article_category.findFirst({
      where: { category_sn: String(category_sn) },
    });
    if (!parent) return { code: 0, message: "success", data: [] };
    const children = await this.prisma.article_category.findMany({
      where: { parent_id: parent.article_category_id },
      orderBy: { sort_order: "asc" },
    });
    return { code: 0, message: "success", data: children };
  }

  /**
   * 首页帮助分类与文章 - 对齐 PHP: /api/article/category/indexBzzxList
   * 入参：category_size(默认5), article_size(默认4)
   */
  @Get("indexBzzxList")
  @Public()
  @ApiOperation({ summary: "首页帮助分类与文章" })
  @ApiQuery({ name: "category_size", required: false })
  @ApiQuery({ name: "article_size", required: false })
  async indexBzzxList(
    @Query("category_size") category_size?: number,
    @Query("article_size") article_size?: number,
  ) {
    const cs = Number(category_size) || 5;
    const as = Number(article_size) || 4;
    const bzzx = await this.prisma.article_category.findFirst({
      where: { category_sn: "bzzx" },
    });
    if (!bzzx) return { code: 0, message: "success", data: [] };
    const children = await this.prisma.article_category.findMany({
      where: { parent_id: bzzx.article_category_id },
      orderBy: { sort_order: "asc" },
      take: cs,
    });
    const data = [] as any[];
    for (const cat of children) {
      const articles = await this.prisma.article.findMany({
        where: { is_show: 1, article_category_id: cat.article_category_id },
        take: as,
        orderBy: [{ is_top: "desc" }, { add_time: "desc" }],
      });
      data.push({ ...cat, articles });
    }
    return { code: 0, message: "success", data };
  }
}
