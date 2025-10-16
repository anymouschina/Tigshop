// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CommentService } from "./comment.service";

@ApiTags("用户评论（API兼容）")
@Controller("api/user/comment")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserCommentApiCompatController {
  constructor(private readonly commentService: CommentService) {}

  // GET /api/user/comment/subNum
  @Get("subNum")
  @ApiOperation({ summary: "评论数量（兼容）" })
  async subNum(@Request() req) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const data = await this.commentService.getCommentSubNum(userId);
    return { code: 0, message: "success", data };
  }

  // GET /api/user/comment/showedList
  @Get("showedList")
  @ApiOperation({ summary: "晒单列表（兼容）" })
  async showedList(
    @Request() req,
    @Query() query: { is_showed?: number; page?: number; size?: number },
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const data = await this.commentService.getShowedList(userId, query);
    return { code: 0, message: "success", data };
  }

  // GET /api/user/comment/list
  @Get("list")
  @ApiOperation({ summary: "已评价列表（兼容）" })
  async list(
    @Request() req,
    @Query() query: { page?: number; size?: number },
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const data = await this.commentService.getCommentList(userId, query);
    return { code: 0, message: "success", data };
  }

  // POST /api/user/comment/evaluate
  @Post("evaluate")
  @ApiOperation({ summary: "商品评价/晒单（兼容）" })
  async evaluate(
    @Request() req,
    @Body()
    body: {
      product_id: number;
      order_id: number;
      order_item_id: number;
      comment_rank: number;
      comment_tag: string[];
      content: string;
      show_pics: string[];
      shop_id?: number;
    },
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const ok = await this.commentService.createEvaluate(userId, body);
    return { code: 0, message: "success", data: ok };
  }

  // GET /api/user/comment/detail
  @Get("detail")
  @ApiOperation({ summary: "评价详情（兼容）" })
  async detail(@Request() req, @Query("id") id: number) {
    const userId = req.user.userId || req.user.user_id || req.user.sub;
    const item = await this.commentService.getCommentDetail(Number(id), Number(userId));
    return { code: 0, message: "success", data: item };
  }
}
