import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "src/prisma/prisma.service";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";

// 兼容 PHP 后台文章管理: /adminapi/content/article/*
@ApiTags("Admin API - 文章管理(兼容)")
@Controller("adminapi/content/article")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminArticleCompatController {
  constructor(private prisma: PrismaService) {}

  // 列表
  @Get("list")
  @ApiOperation({ summary: "文章列表（兼容）" })
  @Authorities("articleManage")
  async list(
    @Query()
    query: {
      keyword?: string;
      is_show?: string | number;
      is_hot?: string | number;
      article_category_id?: string | number;
      article_ids?: string | number[];
      page?: string | number;
      size?: string | number;
      sort_field?: string;
      sort_order?: string;
    },
  ) {
    const page = Math.max(Number(query.page) || 1, 1);
    const size = Math.min(Number(query.size) || 15, 200);
    const skip = (page - 1) * size;

    const where: any = {};
    if (query.keyword) {
      where.article_title = { contains: String(query.keyword) };
    }
    if (
      query.is_show !== undefined &&
      query.is_show !== null &&
      String(query.is_show) !== "-1"
    ) {
      const v = Number(query.is_show);
      if (!Number.isNaN(v)) where.is_show = v;
    }
    if (
      query.is_hot !== undefined &&
      query.is_hot !== null &&
      String(query.is_hot) !== "-1"
    ) {
      const v = Number(query.is_hot);
      if (!Number.isNaN(v)) where.is_hot = v;
    }
    if (query.article_category_id) {
      const cid = Number(query.article_category_id);
      if (!Number.isNaN(cid) && cid > 0) where.article_category_id = cid;
    }
    if (query.article_ids) {
      const ids = Array.isArray(query.article_ids)
        ? (query.article_ids as any[])
            .map((x) => Number(x))
            .filter((x) => !Number.isNaN(x))
        : String(query.article_ids)
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((x) => !Number.isNaN(x));
      if (ids.length) where.article_id = { in: ids };
    }

    const allowedSortFields = new Set([
      "article_id",
      "add_time",
      "click_count",
      "is_show",
      "is_hot",
    ]);
    const sortField =
      query.sort_field && allowedSortFields.has(query.sort_field)
        ? query.sort_field
        : "article_id";
    const sortOrder =
      query.sort_order === "asc" || query.sort_order === "ascend"
        ? "asc"
        : "desc";
    const orderBy: any = { [sortField]: sortOrder };

    const [records, total] = await Promise.all([
      this.prisma.article.findMany({ where, skip, take: size, orderBy }),
      this.prisma.article.count({ where }),
    ]);

    return {
      code: 0,
      message: "success",
      data: { records, total },
    };
  }

  // 详情
  @Get("detail")
  @ApiOperation({ summary: "文章详情（兼容）" })
  @Authorities("articleManage")
  async detail(@Query("id") idParam: string) {
    const id = Number(idParam || 0);
    if (!id) return { code: 400, message: "参数错误", data: null };

    const item = await this.prisma.article.findUnique({
      where: { article_id: id },
    });
    if (!item) return { code: 404, message: "文章不存在", data: null };

    const productLinks = await this.prisma.product_article.findMany({
      where: { article_id: id },
    });
    const product_ids = productLinks.map((x) => x.goods_id);
    const data = { ...item, product_ids } as any;
    return { code: 0, message: "success", data };
  }

  // 创建
  @Post("create")
  @ApiOperation({ summary: "创建文章（兼容）" })
  @Authorities("articleModifyManage")
  async create(@Body() body: any) {
    // 映射字段，兼容 PHP 命名
    const now = Math.floor(Date.now() / 1000);
    const categoryRaw = body.article_category_id ?? body.articleCategoryId;
    const article_category_id = Array.isArray(categoryRaw)
      ? Number(categoryRaw[0] || 0)
      : Number(categoryRaw || 0);

    const data: any = {
      article_title: String((body.article_title ?? body.articleTitle) || ""),
      article_category_id: Number.isNaN(article_category_id)
        ? 0
        : article_category_id,
      article_sn: String((body.article_sn ?? body.articleSn) || ""),
      article_thumb: String((body.article_thumb ?? body.articleThumb) || ""),
      article_author: String((body.article_author ?? body.articleAuthor) || ""),
      article_tag: String((body.article_tag ?? body.articleTag) || ""),
      article_type: Number(body.article_type ?? body.articleType ?? 0),
      content: String(body.content ?? ""),
      description: body.description ?? "",
      keywords: String(body.keywords ?? ""),
      is_show: Number(body.is_show ?? body.isShow ?? 0),
      is_hot: Number(body.is_hot ?? body.isHot ?? 0),
      is_top: Number(body.is_top ?? body.isTop ?? 0),
      click_count: Number(body.click_count ?? body.clickCount ?? 0),
      link: String(body.link ?? ""),
      add_time: now,
    };

    const created = await this.prisma.article.create({ data });

    const productArr = (body.product_ids ?? body.productIds) as any;
    const productIds: number[] = Array.isArray(productArr)
      ? productArr
          .map((x: any) => Number(x))
          .filter((x: number) => !Number.isNaN(x))
      : [];
    if (productIds.length) {
      await this.prisma.product_article.createMany({
        data: productIds.map((pid) => ({
          goods_id: pid,
          article_id: created.article_id,
        })),
        skipDuplicates: true,
      });
    }

    return { code: 0, message: "success", data: null };
  }

  // 更新
  @Post("update")
  @ApiOperation({ summary: "更新文章（兼容）" })
  @Authorities("articleModifyManage")
  async update(@Body() body: any) {
    const id = Number(body.id || body.article_id || body.articleId || 0);
    if (!id) return { code: 400, message: "参数错误", data: null };

    const categoryRaw = body.article_category_id ?? body.articleCategoryId;
    const article_category_id = Array.isArray(categoryRaw)
      ? Number(categoryRaw[0] || 0)
      : Number(categoryRaw || 0);

    const data: any = {
      article_title: body.article_title ?? body.articleTitle,
      article_category_id: Number.isNaN(article_category_id)
        ? undefined
        : article_category_id,
      article_sn: body.article_sn ?? body.articleSn,
      article_thumb: body.article_thumb ?? body.articleThumb,
      article_author: body.article_author ?? body.articleAuthor,
      article_tag: body.article_tag ?? body.articleTag,
      article_type:
        body.article_type !== undefined
          ? Number(body.article_type)
          : body.articleType !== undefined
            ? Number(body.articleType)
            : undefined,
      content: body.content,
      description: body.description,
      keywords: body.keywords,
      is_show:
        body.is_show !== undefined
          ? Number(body.is_show)
          : body.isShow !== undefined
            ? Number(body.isShow)
            : undefined,
      is_hot:
        body.is_hot !== undefined
          ? Number(body.is_hot)
          : body.isHot !== undefined
            ? Number(body.isHot)
            : undefined,
      is_top:
        body.is_top !== undefined
          ? Number(body.is_top)
          : body.isTop !== undefined
            ? Number(body.isTop)
            : undefined,
      click_count:
        body.click_count !== undefined
          ? Number(body.click_count)
          : body.clickCount !== undefined
            ? Number(body.clickCount)
            : undefined,
      link: body.link,
    };

    // 清理 undefined，避免 Prisma 报错
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    await this.prisma.article.update({ where: { article_id: id }, data });

    // 维护关联的 product_article
    const productArr2 = (body.product_ids ?? body.productIds) as any;
    const productIds: number[] = Array.isArray(productArr2)
      ? productArr2
          .map((x: any) => Number(x))
          .filter((x: number) => !Number.isNaN(x))
      : [];
    await this.prisma.$transaction([
      this.prisma.product_article.deleteMany({ where: { article_id: id } }),
      ...(productIds.length
        ? [
            this.prisma.product_article.createMany({
              data: productIds.map((pid) => ({
                goods_id: pid,
                article_id: id,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return { code: 0, message: "success", data: null };
  }

  // 删除
  @Post("del")
  @ApiOperation({ summary: "删除文章（兼容）" })
  @Authorities("articleModifyManage")
  async del(@Body() body: any) {
    const id = Number(body.id || 0);
    if (!id) return { code: 400, message: "参数错误", data: null };

    await this.prisma.$transaction([
      this.prisma.product_article.deleteMany({ where: { article_id: id } }),
      this.prisma.article.delete({ where: { article_id: id } }),
    ]);
    return { code: 0, message: "success", data: null };
  }

  // 更新字段
  @Post("updateField")
  @ApiOperation({ summary: "更新字段（兼容）" })
  @Authorities("articleModifyManage")
  async updateField(@Body() body: any) {
    const id = Number(body.id || 0);
    const field = String(body.field || "");
    const val = body.val;
    if (!id) return { code: 400, message: "参数错误", data: null };
    const fieldMap: Record<string, string> = {
      article_title: "article_title",
      article_sn: "article_sn",
      is_hot: "is_hot",
      is_show: "is_show",
      // camelCase
      articleTitle: "article_title",
      articleSn: "article_sn",
      isHot: "is_hot",
      isShow: "is_show",
    };
    const mapped = fieldMap[field];
    if (!mapped) return { code: 400, message: "#field 错误", data: null };

    const numeric = new Set(["is_hot", "is_show"]);
    const data: any = numeric.has(mapped)
      ? { [mapped]: Number(val) }
      : { [mapped]: String(val ?? "") };
    await this.prisma.article.update({ where: { article_id: id }, data });
    return { code: 0, message: "success", data: null };
  }

  // 批量操作: del/show/hide/move_cat
  @Post("batch")
  @ApiOperation({ summary: "批量操作（兼容）" })
  @Authorities("articleModifyManage")
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids)
      ? body.ids
          .map((x: any) => Number(x))
          .filter((x: number) => !Number.isNaN(x))
      : [];
    const type = String(body.type || "");
    if (!ids.length) return { code: 400, message: "未选择项目", data: null };

    if (["del", "show", "hide", "move_cat"].includes(type)) {
      if (type === "del") {
        await this.prisma.$transaction([
          this.prisma.product_article.deleteMany({
            where: { article_id: { in: ids } },
          }),
          this.prisma.article.deleteMany({
            where: { article_id: { in: ids } },
          }),
        ]);
      } else if (type === "show" || type === "hide") {
        await this.prisma.article.updateMany({
          where: { article_id: { in: ids } },
          data: { is_show: type === "show" ? 1 : 0 },
        });
      } else if (type === "move_cat") {
        // 目标分类
        const target = Array.isArray(body.target_cat)
          ? Number(body.target_cat[0] || 0)
          : Number(body.target_cat || 0);
        if (!target) return { code: 400, message: "目标分类无效", data: null };
        await this.prisma.article.updateMany({
          where: { article_id: { in: ids } },
          data: { article_category_id: target },
        });
      }
      return { code: 0, message: "success", data: null };
    }
    return { code: 400, message: "#type 错误", data: null };
  }
}
