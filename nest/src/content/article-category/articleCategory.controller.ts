// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { ArticleCategoryService } from "./articleCategory.service";
import {
  CreateArticleCategoryDto,
  UpdateArticleCategoryDto,
  ArticleCategoryQueryDto,
  ArticleCategoryConfigDto,
} from "./dto/articleCategory.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("ArticleCategory Management")
@Controller("content/article_category")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ArticleCategoryController {
  constructor(
    private readonly articleCategoryService: ArticleCategoryService,
  ) {}

  @Get("list")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "获取文章分类列表" })
  async list(@Query() queryDto: ArticleCategoryQueryDto) {
    const result = await this.articleCategoryService.findAll(queryDto);
    return {
      code: 200,
      msg: "获取成功",
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  @Get("config")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.articleCategoryService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "获取文章分类详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.articleCategoryService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "创建文章分类" })
  @ApiBody({ type: CreateArticleCategoryDto })
  async create(@Body() createDto: CreateArticleCategoryDto) {
    const item = await this.articleCategoryService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "更新文章分类" })
  @ApiBody({ type: UpdateArticleCategoryDto })
  async update(@Body() updateDto: UpdateArticleCategoryDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.articleCategoryService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: item,
    };
  }

  @Delete("del")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "删除文章分类" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.articleCategoryService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Roles("articleCategoryManage")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.articleCategoryService.batchDelete(body.ids);
      return {
        code: 200,
        msg: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        msg: "操作类型错误",
      };
    }
  }
}
