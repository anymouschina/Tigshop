// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  GetCommentsDto,
  CommentReplyDto,
} from './dto/comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Product Comment Management')
@Controller('product/comment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * 创建评论 - 对齐PHP版本 product/comment/create
   */
  @Post('create')
  @ApiOperation({ summary: '创建评论' })
  async createComment(@Request() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(req.user.userId, createCommentDto);
  }

  /**
   * 获取评论列表 - 对齐PHP版本 product/comment/getCommentList
   */
  @Get('getCommentList')
  @ApiOperation({ summary: '获取评论列表' })
  async getComments(@Query() query: GetCommentsDto) {
    return this.commentService.getComments(query);
  }

  /**
   * 获取评论详情 - 对齐PHP版本 product/comment/getComment
   */
  @Get('getComment/:commentId')
  @ApiOperation({ summary: '获取评论详情' })
  async getCommentDetail(@Param('commentId') commentId: number) {
    return this.commentService.getCommentDetail(Number(commentId));
  }

  /**
   * 更新评论 - 对齐PHP版本 product/comment/update
   */
  @Put('update/:commentId')
  @ApiOperation({ summary: '更新评论' })
  async updateComment(
    @Request() req,
    @Param('commentId') commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(
      Number(commentId),
      req.user.userId,
      updateCommentDto,
    );
  }

  /**
   * 删除评论 - 对齐PHP版本 product/comment/delete
   */
  @Delete('delete/:commentId')
  @ApiOperation({ summary: '删除评论' })
  async deleteComment(@Request() req, @Param('commentId') commentId: number) {
    return this.commentService.deleteComment(Number(commentId), req.user.userId);
  }

  /**
   * 点赞评论 - 对齐PHP版本 product/comment/like
   */
  @Post('like/:commentId')
  @ApiOperation({ summary: '点赞评论' })
  async likeComment(@Request() req, @Param('commentId') commentId: number) {
    return this.commentService.likeComment(req.user.userId, Number(commentId));
  }

  /**
   * 回复评论 - 对齐PHP版本 product/comment/reply
   */
  @Post('reply/:commentId')
  @ApiOperation({ summary: '回复评论' })
  async replyComment(
    @Request() req,
    @Param('commentId') commentId: number,
    @Body() replyDto: CommentReplyDto,
  ) {
    return this.commentService.replyComment(req.user.userId, Number(commentId), replyDto);
  }

  /**
   * 获取产品评论统计 - 对齐PHP版本 product/comment/getStats
   */
  @Get('getStats/:productId')
  @ApiOperation({ summary: '获取产品评论统计' })
  async getCommentStats(@Param('productId') productId: number) {
    return this.commentService.getCommentStats(Number(productId));
  }

  /**
   * 获取我的评论 - 对齐PHP版本 user/comment/list
   */
  @Get('user/list')
  @ApiOperation({ summary: '获取我的评论' })
  async getUserComments(@Request() req, @Query() query: any) {
    return this.commentService.getUserComments(req.user.userId, query);
  }

  /**
   * 获取产品评论 - 对齐PHP版本 product/product/getComment
   */
  @Get('product/:productId')
  @ApiOperation({ summary: '获取产品评论' })
  async getProductComments(@Param('productId') productId: number, @Query() query: GetCommentsDto) {
    return this.commentService.getComments({
      ...query,
      productId: Number(productId),
    });
  }
}
