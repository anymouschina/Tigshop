// @ts-nocheck
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AdminCommentCompatService } from "./admin-comment-compat.service";

@ApiTags("Admin API - 商品评价(兼容路径)")
@Controller("adminapi/product/comment")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminApiProductCommentController {
  constructor(private readonly svc: AdminCommentCompatService) {}

  @Get("list")
  @Authorities("commentManage")
  @ApiOperation({ summary: "评论列表（admin）" })
  async list(@Query() query: any) {
    const page = Number(query.page) || 1;
    const size = Number(query.size) || 15;
    const filter = {
      keyword: query.keyword || "",
      sort_field: query.sortField || "comment_id",
      sort_order: query.sortOrder || "desc",
      // 对齐PHP：is_showed = -1 表示不过滤；接受 isShowed / is_showed 两种写法
      is_showed:
        query.isShowed !== undefined || query.is_showed !== undefined
          ? Number(query.isShowed ?? query.is_showed)
          : -1,
      page,
      size,
    };
    const [records, total] = await Promise.all([
      this.svc.getFilterResult(filter),
      this.svc.getFilterCount(filter),
    ]);
    return { code: 0, message: "success", data: { records, total } };
  }

  @Get("detail")
  @Authorities("commentManage")
  @ApiOperation({ summary: "评论详情（admin）" })
  async detail(@Query("id") id: string) {
    const data = await this.svc.getDetail(Number(id));
    return { code: 0, message: "success", data };
  }

  @Post("create")
  @Authorities("commentModifyManage")
  @ApiOperation({ summary: "创建评论（admin）" })
  async create(@Body() body: any) {
    const res = await this.svc.create(body);
    return { code: 0, message: "success", data: res };
  }

  @Post("update")
  @Authorities("commentModifyManage")
  @ApiOperation({ summary: "更新评论（admin）" })
  async update(@Body() body: any) {
    await this.svc.update(Number(body.id), body);
    return { code: 0, message: "success" };
  }

  @Post("updateField")
  @Authorities("commentModifyManage")
  @ApiOperation({ summary: "更新单个字段（admin）" })
  async updateField(@Body() body: any) {
    const { id, field, val } = body;
    await this.svc.updateField(Number(id), String(field), val);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @Authorities("commentModifyManage")
  @ApiOperation({ summary: "删除评论（admin）" })
  async del(@Body() body: any) {
    await this.svc.delete(Number(body.id));
    return { code: 0, message: "success" };
  }

  @Post("batch")
  @Authorities("commentModifyManage")
  @ApiOperation({ summary: "批量操作（admin）" })
  async batch(@Body() body: any) {
    if (!Array.isArray(body.ids) || !body.ids.length) {
      return { code: 400, message: "未选择项目" };
    }
    const ids = body.ids.map((x) => Number(x));
    if (String(body.type) === "del") {
      await this.svc.batchDelete(ids);
      return { code: 0, message: "success" };
    }
    return { code: 400, message: "#type 错误" };
  }

  @Post("replyComment")
  @Authorities("commentModifyManage")
  @ApiOperation({ summary: "回复评论（admin）" })
  async replyComment(@Body() body: any) {
    const res = await this.svc.replyComment(body);
    return { code: 0, message: "success", data: res };
  }
}
