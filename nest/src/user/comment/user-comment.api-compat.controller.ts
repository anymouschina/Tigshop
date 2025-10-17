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
import { OrderService } from "src/order/order.service";

@ApiTags("用户评论（API兼容）")
@Controller("api/user/comment")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserCommentApiCompatController {
  constructor(
    private readonly commentService: CommentService,
    private readonly orderService: OrderService,
  ) {}

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
  async list(@Request() req, @Query() query: { page?: number; size?: number }) {
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
    const idNum = Number(id);
    let data: any = null;
    try {
      // 先使用评论服务的解析，可能返回评论或直接返回订单详情
      const item = await this.commentService.getCommentDetail(
        idNum,
        Number(userId),
      );
      // 如果已是订单详情（包含 orderId / items 等键），直接返回
      if (
        item &&
        ("orderId" in item || (item.items && Array.isArray(item.items)))
      ) {
        data = item;
      } else if (item && ("order_id" in item || "orderId" in item)) {
        // 若为评论对象，提取其订单ID，再查订单详情
        const oid = Number((item as any).order_id ?? (item as any).orderId);
        data = await this.orderService.getOrderDetail(oid, Number(userId));
      } else {
        // 兜底：把 id 当作订单ID 查详情
        data = await this.orderService.getOrderDetail(idNum, Number(userId));
      }
    } catch (e) {
      // 若上面流程异常，再尝试将 id 作为订单ID 直接查询
      try {
        data = await this.orderService.getOrderDetail(idNum, Number(userId));
      } catch (_) {
        // 保持兼容：返回空数据，不抛出 500
        data = null;
      }
    }
    return { code: 0, message: "success", data };
  }
}
