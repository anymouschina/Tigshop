// @ts-nocheck
import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { Public } from "../../auth/decorators/public.decorator";
import { camelCase } from "../../common/utils/camel-case.util";

@ApiTags("User - 文章")
@Controller("api/article/article")
export class UserArticlePublicController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 文章列表 - 对齐 PHP: /api/article/article/list
   * 支持参数：article_ids, article_category_id, category_sn, size(<=50), page, sort_field, sort_order
   */
  @Get("list")
  @Public()
  @ApiOperation({ summary: "文章列表" })
  async list(
    @Query()
    query: {
      article_ids?: string | number[];
      article_category_id?: number;
      category_sn?: string;
      size?: number;
      page?: number;
      sort_field?: string;
      sort_order?: "asc" | "desc";
    },
  ) {
    const size = clamp(toNumber(query.size, 9), 1, 50);
    const page = toNumber(query.page, 1);
    const skip = (page - 1) * size;

    const where: any = { is_show: 1 };

    // 处理 article_ids
    const ids = toIdArray(query.article_ids);
    if (ids.length) where.article_id = { in: ids };

    // 根据分类ID
    const catId = toNumber(query.article_category_id);
    if (catId) where.article_category_id = catId;

    // 根据 category_sn 获取该分类及其直属子分类文章
    if (!catId && query.category_sn) {
      const cat = await this.prisma.article_category.findFirst({
        where: { category_sn: String(query.category_sn) },
      });
      if (cat) {
        const children = await this.prisma.article_category.findMany({
          where: { parent_id: cat.article_category_id },
          select: { article_category_id: true },
        });
        const catIds = [
          cat.article_category_id,
          ...children.map((c) => c.article_category_id),
        ];
        where.article_category_id = { in: catIds };
      }
    }

    // 排序
    const fieldMap: Record<string, string> = {
      article_id: "article_id",
      add_time: "add_time",
      click_count: "click_count",
      is_top: "is_top",
      is_hot: "is_hot",
    };
    const sortFieldRaw = query.sort_field || "article_id";
    const sortField = fieldMap[sortFieldRaw] || "article_id";
    const sortOrder = (query.sort_order === "asc" ? "asc" : "desc") as
      | "asc"
      | "desc";

    const [records, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: size,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { code: 0, message: "success", data: camelCase({ records, total }) };

    function toNumber(v: any, def?: number) {
      if (v === undefined || v === null || v === "") return def;
      const n = Number(v);
      return Number.isNaN(n) ? def : n;
    }
    function clamp(n: number, min: number, max: number) {
      return Math.max(min, Math.min(max, n));
    }
    function toIdArray(val: any): number[] {
      if (val == null) return [];
      if (Array.isArray(val))
        return val.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
      if (typeof val === "number") return Number.isNaN(val) ? [] : [val];
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return toIdArray(parsed);
        } catch {
          return val
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((n) => !Number.isNaN(n));
        }
      }
      if (typeof val === "object" && val.data) return toIdArray(val.data);
      return [];
    }
  }

  /**
   * 资讯类文章详情 - 对齐 PHP: /api/article/article/newsInfo
   * 入参：id
   */
  @Get("newsInfo")
  @Public()
  @ApiOperation({ summary: "资讯类文章详情" })
  @ApiQuery({ name: "id", required: true })
  async newsInfo(@Query("id") id: number) {
    const articleId = Number(id) || 0;
    const item = await this.prisma.article.findFirst({
      where: { article_id: articleId, is_show: 1 },
    });
    if (!item)
      return {
        code: 0,
        message: "success",
        data: { item: null, next: null, prev: null },
      };

    const next = await this.prisma.article.findFirst({
      where: { is_show: 1, article_id: { gt: articleId } },
      orderBy: { article_id: "asc" },
    });
    const prev = await this.prisma.article.findFirst({
      where: { is_show: 1, article_id: { lt: articleId } },
      orderBy: { article_id: "desc" },
    });

    return {
      code: 0,
      message: "success",
      data: camelCase({ item, next, prev }),
    };
  }

  /**
   * 帮助类文章详情 - 对齐 PHP: /api/article/article/issueInfo
   * 入参：id, article_sn(可选)
   */
  @Get("issueInfo")
  @Public()
  @ApiOperation({ summary: "帮助类文章详情" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "article_sn", required: false })
  @ApiQuery({
    name: "articleSn",
    required: false,
    description: "兼容前端驼峰参数名",
  })
  async issueInfo(
    @Query("id") id?: number,
    @Query("article_sn") article_sn?: string,
    @Query("articleSn") articleSn?: string,
  ) {
    let item = null;
    if (id) {
      item = await this.prisma.article.findFirst({
        where: { article_id: Number(id), is_show: 1 },
      });
    }
    const sn = article_sn || articleSn;
    if (!item && sn) {
      item = await this.prisma.article.findFirst({
        where: { article_sn: String(sn), is_show: 1 },
      });
    }
    if (!item)
      return {
        code: 0,
        message: "success",
        data: { item: null, next: null, prev: null },
      };

    const next = await this.prisma.article.findFirst({
      where: { is_show: 1, article_id: { gt: item.article_id } },
      orderBy: { article_id: "asc" },
    });
    const prev = await this.prisma.article.findFirst({
      where: { is_show: 1, article_id: { lt: item.article_id } },
      orderBy: { article_id: "desc" },
    });

    return {
      code: 0,
      message: "success",
      data: camelCase({ item, next, prev }),
    };
  }
}
