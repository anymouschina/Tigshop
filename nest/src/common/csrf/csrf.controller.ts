// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { CsrfService } from "./csrf.service";
import {
  CsrfQueryDto,
  CsrfDetailDto,
  CreateCsrfDto,
  UpdateCsrfDto,
  DeleteCsrfDto,
  BatchDeleteCsrfDto,
  CSRF_TYPE,
  CSRF_STATUS,
} from "./csrf.dto";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CsrfService as AuthCsrfService } from "../../auth/services/csrf.service";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("通用-CSRF保护")
@Controller("admin/csrf")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get()
  @ApiOperation({ summary: "获取CSRF保护列表" })
  @ApiQuery({ name: "keyword", description: "关键词搜索", required: false })
  @ApiQuery({ name: "type", description: "CSRF类型", required: false })
  @ApiQuery({ name: "status", description: "状态", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  async findAll(@Query() query: CsrfQueryDto) {
    return await this.csrfService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取CSRF保护详情" })
  @ApiParam({ name: "id", description: "CSRF ID" })
  async findOne(@Param("id") id: number) {
    return await this.csrfService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "创建CSRF保护" })
  async create(@Body() createCsrfDto: CreateCsrfDto) {
    return await this.csrfService.create(createCsrfDto);
  }

  @Put()
  @ApiOperation({ summary: "更新CSRF保护" })
  async update(@Body() updateCsrfDto: UpdateCsrfDto) {
    return await this.csrfService.update(updateCsrfDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除CSRF保护" })
  @ApiParam({ name: "id", description: "CSRF ID" })
  async remove(@Param("id") id: number) {
    return await this.csrfService.remove(id);
  }

  @Post("batch-delete")
  @ApiOperation({ summary: "批量删除CSRF保护" })
  async batchRemove(@Body() batchDeleteCsrfDto: BatchDeleteCsrfDto) {
    return await this.csrfService.batchRemove(batchDeleteCsrfDto.ids);
  }

  @Post("generate-token")
  @ApiOperation({ summary: "生成CSRF令牌" })
  @ApiQuery({ name: "user_id", description: "用户ID", required: false })
  @ApiQuery({ name: "type", description: "令牌类型", required: false })
  async generateToken(
    @Query("user_id") userId?: number,
    @Query("type") type?: number,
  ) {
    return await this.csrfService.generateToken(userId, type);
  }

  @Post("validate-token")
  @ApiOperation({ summary: "验证CSRF令牌" })
  async validateToken(
    @Body() validateTokenDto: { token: string; user_id?: number },
  ) {
    return await this.csrfService.validateToken(
      validateTokenDto.token,
      validateTokenDto.user_id,
    );
  }

  @Post("refresh-token")
  @ApiOperation({ summary: "刷新CSRF令牌" })
  async refreshToken(
    @Body() refreshTokenDto: { old_token: string; user_id?: number },
  ) {
    return await this.csrfService.refreshToken(
      refreshTokenDto.old_token,
      refreshTokenDto.user_id,
    );
  }

  @Get("type/list")
  @ApiOperation({ summary: "获取CSRF类型列表" })
  async getTypeList() {
    return CSRF_TYPE;
  }

  @Get("status/list")
  @ApiOperation({ summary: "获取CSRF状态列表" })
  async getStatusList() {
    return CSRF_STATUS;
  }

  @Get("stats/info")
  @ApiOperation({ summary: "获取CSRF统计信息" })
  async getCsrfStats() {
    return await this.csrfService.getCsrfStats();
  }

  @Post("cleanup-expired")
  @ApiOperation({ summary: "清理过期令牌" })
  async cleanupExpiredTokens() {
    return await this.csrfService.cleanupExpiredTokens();
  }
}

@ApiTags("公共CSRF")
@Controller("common/csrf")
export class PublicCsrfController {
  constructor(
    private readonly authCsrfService: AuthCsrfService,
  ) {}

  @ApiOperation({ summary: "创建CSRF令牌" })
  @Get("create")
  async create() {
    const token = this.authCsrfService.generateToken();

    return ResponseUtil.success({
      csrf_token: token,
      expires_in: 3600, // 1 hour
    });
  }

  @ApiOperation({ summary: "验证CSRF令牌" })
  @Post("validate")
  async validate(@Body() body: { csrf_token: string }) {
    const isValid = this.authCsrfService.validateToken(body.csrf_token);

    if (isValid) {
      return ResponseUtil.success("CSRF令牌有效");
    } else {
      return ResponseUtil.error("CSRF令牌无效或已过期");
    }
  }

  @ApiOperation({ summary: "删除CSRF令牌" })
  @Post("delete")
  async delete(@Body() body: { csrf_token: string }) {
    const success = this.authCsrfService.deleteToken(body.csrf_token);

    if (success) {
      return ResponseUtil.success("CSRF令牌已删除");
    } else {
      return ResponseUtil.error("CSRF令牌不存在");
    }
  }
}
