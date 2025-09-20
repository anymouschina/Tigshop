// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Request,
  UseGuards,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserCommentService } from "./user-comment.service";
import {
  CreateCommentDto,
  CommentQueryDto,
  ReplyCommentDto,
} from "./dto/user-comment.dto";

@ApiTags("用户端评论")
@Controller("user/comment")
export class UserCommentController {
  constructor(private readonly userCommentService: UserCommentService) {}

  @Post("create")
  @ApiOperation({ summary: "创建评论" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "创建成功" })
  async createComment(@Request() req, @Body() createDto: CreateCommentDto) {
    const userId = req.user.userId;
    const data = await this.userCommentService.createComment(userId, createDto);
    return {
      code: 200,
      message: "评论创建成功",
      data,
    };
  }

  @Get("list")
  @ApiOperation({ summary: "获取评论列表" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "size", required: false })
  @ApiQuery({ name: "product_id", required: false })
  @ApiQuery({ name: "comment_type", required: false })
  @ApiQuery({ name: "filter_type", required: false })
  @ApiQuery({ name: "sort_type", required: false })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCommentList(@Query() queryDto: CommentQueryDto) {
    const data = await this.userCommentService.getCommentList(queryDto);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("myList")
  @ApiOperation({ summary: "获取我的评论列表" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "size", required: false })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserCommentList(@Request() req, @Query() queryDto: CommentQueryDto) {
    const userId = req.user.userId;
    const data = await this.userCommentService.getUserCommentList(
      userId,
      queryDto,
    );
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("detail/:commentId")
  @ApiOperation({ summary: "获取评论详情" })
  @ApiParam({ name: "commentId", description: "评论ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCommentDetail(@Param("commentId") commentId: number) {
    const data = await this.userCommentService.getCommentDetail(commentId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Post("reply")
  @ApiOperation({ summary: "回复评论" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "回复成功" })
  async replyComment(@Request() req, @Body() replyDto: ReplyCommentDto) {
    const userId = req.user.userId;
    const data = await this.userCommentService.replyComment(userId, replyDto);
    return {
      code: 200,
      message: "回复成功",
      data,
    };
  }

  @Delete("delete/:commentId")
  @ApiOperation({ summary: "删除评论" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "commentId", description: "评论ID" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteComment(@Request() req, @Param("commentId") commentId: number) {
    const userId = req.user.userId;
    const data = await this.userCommentService.deleteComment(userId, commentId);
    return {
      code: 200,
      message: "删除成功",
      data,
    };
  }

  @Post("like/:commentId")
  @ApiOperation({ summary: "点赞/取消点赞评论" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "commentId", description: "评论ID" })
  @ApiResponse({ status: 200, description: "操作成功" })
  async likeComment(@Request() req, @Param("commentId") commentId: number) {
    const userId = req.user.userId;
    const data = await this.userCommentService.likeComment(userId, commentId);
    return {
      code: 200,
      message: data.liked ? "点赞成功" : "取消点赞成功",
      data,
    };
  }

  @Get("uncommentedOrders")
  @ApiOperation({ summary: "获取待评价订单" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUncommentedOrders(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userCommentService.getUncommentedOrders(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }
}
