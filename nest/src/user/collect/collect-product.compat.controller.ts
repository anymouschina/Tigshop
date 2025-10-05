// @ts-nocheck
import { Controller, Get, Post, Body, Query, UseGuards, Request, Logger } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CollectService } from "./collect.service";
import { CollectListDto, CollectType, CollectListResponse, CollectProductDto, DeleteCollectDto, SuccessResponse } from "./dto/collect.dto";

@ApiTags("User Collection (Compat)")
@Controller("api/user/collectProduct")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CollectProductCompatController {
  private readonly logger = new Logger(CollectProductCompatController.name);
  constructor(private readonly collectService: CollectService) {}

  /**
   * 兼容PHP路径：/api/user/collectProduct/list
   */
  @Get("list")
  @ApiOperation({ summary: "获取商品收藏列表（兼容 /api/user/collectProduct/list）" })
  async list(
    @Request() req,
    @Query() query: { page?: number; size?: number },
  ): Promise<CollectListResponse> {
    const dto: CollectListDto = {
      page: Number(query.page) || 1,
      size: Number(query.size) || 10,
      collect_type: CollectType.PRODUCT,
    };
    return this.collectService.getCollectList(req.user.userId, dto);
  }

  /**
   * 兼容PHP路径：/api/user/collectProduct/save
   */
  @Post("save")
  @ApiOperation({ summary: "收藏商品（兼容 /api/user/collectProduct/save）" })
  async save(
    @Request() req,
    @Body() body: CollectProductDto,
  ): Promise<SuccessResponse> {
    this.logger.debug(`CollectProductCompatController save called with body: ${JSON.stringify(body)} ${JSON.stringify(req.user)}`);
    return this.collectService.collectProduct(req.user.userId, body);
  }

  /**
   * 兼容PHP路径：/api/user/collectProduct/cancel
   */
  @Post("cancel")
  @ApiOperation({ summary: "取消收藏（兼容 /api/user/collectProduct/cancel）" })
  async cancel(
    @Request() req,
    @Body() body: DeleteCollectDto,
  ): Promise<SuccessResponse> {
    return this.collectService.cancelCollect(req.user.userId, body);
  }
}
