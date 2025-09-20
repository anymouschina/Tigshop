import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('User Comment')
@Controller('api')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * 评论数量 - 对齐PHP版本 user/Comment/subNum
   */
  @Get('user/comment/subNum')
  @ApiOperation({ summary: '评论数量' })
  async getCommentSubNum(@Request() req) {
    const userId = req.user.userId;
    return this.commentService.getCommentSubNum(userId);
  }

  /**
   * 晒单列表 - 对齐PHP版本 user/Comment/showedList
   */
  @Get('user/comment/showedList')
  @ApiOperation({ summary: '晒单列表' })
  async getShowedList(@Request() req, @Query() query: { is_showed?: number; page?: number; size?: number }) {
    const userId = req.user.userId;
    return this.commentService.getShowedList(userId, query);
  }

  /**
   * 已评价列表 - 对齐PHP版本 user/Comment/list
   */
  @Get('user/comment/list')
  @ApiOperation({ summary: '已评价列表' })
  async getCommentList(@Request() req, @Query() query: { page?: number; size?: number }) {
    const userId = req.user.userId;
    return this.commentService.getCommentList(userId, query);
  }

  /**
   * 商品评价/晒单 - 对齐PHP版本 user/Comment/evaluate
   */
  @Post('user/comment/evaluate')
  @ApiOperation({ summary: '商品评价/晒单' })
  async evaluate(@Request() req, @Body() data: {
    product_id: number;
    order_id: number;
    order_item_id: number;
    comment_rank: number;
    comment_tag: string[];
    content: string;
    show_pics: string[];
    shop_id: number;
  }) {
    const userId = req.user.userId;
    return this.commentService.createEvaluate(userId, data);
  }

  /**
   * 评价/晒单详情 - 对齐PHP版本 user/Comment/detail
   */
  @Get('user/comment/detail')
  @ApiOperation({ summary: '评价/晒单详情' })
  async getCommentDetail(@Query('id') id: number) {
    return this.commentService.getCommentDetail(id);
  }
}