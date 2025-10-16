import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "src/prisma/prisma.service";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";

// 兼容 PHP 后台文章分类: /adminapi/content/articleCategory/*
@ApiTags("Admin API - 文章分类(兼容)")
@Controller("adminapi/content/articleCategory")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
@ApiBearerAuth()
export class AdminArticleCategoryCompatController {
  constructor(private prisma: PrismaService) {}

  // 列表
  @Get("list")
  @ApiOperation({ summary: "分类列表（兼容）" })
  @Authorities("articleCategoryManage")
  async list(
    @Query()
    query: {
      keyword?: string;
      parent_id?: string | number;
      is_show?: string | number; // PHP 端没在表里，忽略
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
      const kw = String(query.keyword);
      where.OR = [
        { article_category_name: { contains: kw } },
        { category_sn: { contains: kw } },
      ];
    }
    if ((query as any).parentId) {
      const pid = Number((query as any).parentId);
      if (!Number.isNaN(pid)) where.parent_id = pid;
    } else if (query.parent_id) {
      const pid = Number(query.parent_id);
      if (!Number.isNaN(pid)) where.parent_id = pid;
    }

    const allowed = new Set(["article_category_id", "sort_order"]);
    const sortField =
      query.sort_field && allowed.has(query.sort_field)
        ? query.sort_field
        : "article_category_id";
    const sortOrder =
      query.sort_order === "asc" || query.sort_order === "ascend"
        ? "asc"
        : "desc";

    const [recordsRaw, total] = await Promise.all([
      this.prisma.article_category.findMany({
        where,
        skip,
        take: size,
        orderBy: { [sortField]: sortOrder },
      }),
      this.prisma.article_category.count({ where }),
    ]);

    // 计算 has_children，增强前端可用性（与 PHP 接口一致）
    const ids = recordsRaw.map((r) => r.article_category_id);
    const childrenCountMap = new Map<number, number>();
    if (ids.length) {
      const children = await this.prisma.article_category.findMany({
        where: { parent_id: { in: ids } },
        select: { parent_id: true },
      });
      for (const c of children) {
        const key = c.parent_id;
        childrenCountMap.set(key, (childrenCountMap.get(key) || 0) + 1);
      }
    }
    const records = recordsRaw.map((r) => ({
      ...r,
      has_children: childrenCountMap.get(r.article_category_id) || 0,
    }));

    return { code: 0, message: "success", data: { records, total } };
  }

  // 详情
  @Get("detail")
  @ApiOperation({ summary: "分类详情（兼容）" })
  @Authorities("articleCategoryManage")
  async detail(@Query("id") idParam: string) {
    const id = Number(idParam || 0);
    if (!id) return { code: 400, message: "参数错误", data: null };
    const item = await this.prisma.article_category.findUnique({
      where: { article_category_id: id },
    });
    if (!item) return { code: 404, message: "分类不存在", data: null };
    return { code: 0, message: "success", data: item };
  }

  // 树
  @Get("tree")
  @ApiOperation({ summary: "分类树（兼容）" })
  @Authorities("articleCategoryManage")
  async tree(@Query("id") pidParam?: string) {
    const pid = Number(pidParam || 0);
    // 简版：一次性取出全部分类并构建树（数据量通常不大）
    const all = await this.prisma.article_category.findMany();
    const byParent: Record<number, any[]> = {};
    for (const c of all) {
      byParent[c.parent_id] = byParent[c.parent_id] || [];
      byParent[c.parent_id].push({ ...c, children: [] });
    }
    const build = (parentId: number): any[] => {
      const list = (byParent[parentId] || []).sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      for (const node of list) node.children = build(node.article_category_id);
      return list;
    };
    const tree = build(pid);
    return { code: 0, message: "success", data: tree };
  }

  // 创建
  @Post("create")
  @ApiOperation({ summary: "创建分类（兼容）" })
  @Authorities("articleCategoryModifyManage")
  async create(@Body() body: any) {
    // 支持 parentId/parent_id 为数组（取最后一个）或数字
    const parentInput =
      body.parent_id !== undefined ? body.parent_id : body.parentId;
    const parent_id = Array.isArray(parentInput)
      ? Number(parentInput[parentInput.length - 1] || 0)
      : Number(parentInput ?? 0);

    const data: any = {
      parent_id: Number.isNaN(parent_id) ? 0 : parent_id,
      article_category_name: String(
        (body.article_category_name ?? body.articleCategoryName) || "",
      ),
      category_sn: String((body.category_sn ?? body.categorySn) || ""),
      // 与数据库默认值对齐（1），避免前端看不到该分类
      category_type: Number(body.category_type ?? body.categoryType ?? 1),
      keywords: String(body.keywords ?? ""),
      description: String(body.description ?? ""),
      sort_order: Number(body.sort_order ?? body.sortOrder ?? 50),
    };
    await this.prisma.article_category.create({ data });
    return { code: 0, message: "success", data: null };
  }

  // 更新
  @Post("update")
  @ApiOperation({ summary: "更新分类（兼容）" })
  @Authorities("articleCategoryModifyManage")
  async update(@Body() body: any) {
    const id = Number(
      body.id || body.article_category_id || body.articleCategoryId || 0,
    );
    if (!id) return { code: 400, message: "参数错误", data: null };
    // 处理 parentId/parent_id 为数组或数字
    let resolvedParentId: number | undefined = undefined;
    if (body.parent_id !== undefined || body.parentId !== undefined) {
      const parentInput =
        body.parent_id !== undefined ? body.parent_id : body.parentId;
      if (Array.isArray(parentInput)) {
        const last = Number(parentInput[parentInput.length - 1] || 0);
        if (last === 0) {
          return { code: 400, message: "上级分类选择有误", data: null };
        }
        resolvedParentId = Number.isNaN(last) ? undefined : last;
      } else {
        const v = Number(parentInput);
        resolvedParentId = Number.isNaN(v) ? undefined : v;
      }
    }

    const data: any = {
      parent_id: resolvedParentId,
      article_category_name:
        body.article_category_name ?? body.articleCategoryName,
      category_sn: body.category_sn ?? body.categorySn,
      category_type:
        body.category_type !== undefined
          ? Number(body.category_type)
          : body.categoryType !== undefined
            ? Number(body.categoryType)
            : undefined,
      keywords: body.keywords,
      description: body.description,
      sort_order:
        body.sort_order !== undefined
          ? Number(body.sort_order)
          : body.sortOrder !== undefined
            ? Number(body.sortOrder)
            : undefined,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    await this.prisma.article_category.update({
      where: { article_category_id: id },
      data,
    });
    return { code: 0, message: "success", data: null };
  }

  // 删除
  @Post("del")
  @ApiOperation({ summary: "删除分类（兼容）" })
  @Authorities("articleCategoryModifyManage")
  async del(@Body() body: any) {
    const id = Number(body.id || 0);
    if (!id) return { code: 400, message: "参数错误", data: null };
    await this.prisma.article_category.delete({
      where: { article_category_id: id },
    });
    return { code: 0, message: "success", data: null };
  }

  // 更新字段
  @Post("updateField")
  @ApiOperation({ summary: "更新分类字段（兼容）" })
  @Authorities("articleCategoryModifyManage")
  async updateField(@Body() body: any) {
    const id = Number(body.id || 0);
    const field = String(body.field || "");
    const val = body.val;
    if (!id) return { code: 400, message: "参数错误", data: null };
    const allow = new Set([
      "article_category_name",
      "category_sn",
      "sort_order",
    ]);
    if (!allow.has(field))
      return { code: 400, message: "#field 错误", data: null };
    const numeric = new Set(["sort_order"]);
    const data: any = numeric.has(field)
      ? { [field]: Number(val) }
      : { [field]: String(val ?? "") };
    await this.prisma.article_category.update({
      where: { article_category_id: id },
      data,
    });
    return { code: 0, message: "success", data: null };
  }

  // 批量删除
  @Post("batch")
  @ApiOperation({ summary: "分类批量（兼容）" })
  @Authorities("articleCategoryModifyManage")
  async batch(@Body() body: any) {
    const ids: number[] = Array.isArray(body.ids)
      ? body.ids
          .map((x: any) => Number(x))
          .filter((x: number) => !Number.isNaN(x))
      : [];
    const type = String(body.type || "");
    if (!ids.length) return { code: 400, message: "未选择项目", data: null };
    if (type !== "del") return { code: 400, message: "#type 错误", data: null };
    await this.prisma.article_category.deleteMany({
      where: { article_category_id: { in: ids } },
    });
    return { code: 0, message: "success", data: null };
  }
}
