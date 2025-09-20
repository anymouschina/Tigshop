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
import { UserMessageService } from "./user-message.service";
import { MessageQueryDto, MessageBatchDto } from "./dto/user-message.dto";

@ApiTags("用户端消息")
@Controller("api/user/message")
export class UserMessageController {
  constructor(private readonly userMessageService: UserMessageService) {}

  @Get("list")
  @ApiOperation({ summary: "获取消息列表" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "size", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "message_type", required: false })
  @ApiQuery({ name: "start_date", required: false })
  @ApiQuery({ name: "end_date", required: false })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageList(@Request() req, @Query() queryDto: MessageQueryDto) {
    const userId = req.user.userId;
    const data = await this.userMessageService.getMessageList(userId, queryDto);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("detail/:messageId")
  @ApiOperation({ summary: "获取消息详情" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "messageId", description: "消息ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageDetail(
    @Request() req,
    @Param("messageId") messageId: number,
  ) {
    const userId = req.user.userId;
    const data = await this.userMessageService.getMessageDetail(
      userId,
      messageId,
    );
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Put("read/:messageId")
  @ApiOperation({ summary: "标记消息为已读" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "messageId", description: "消息ID" })
  @ApiResponse({ status: 200, description: "标记成功" })
  async markAsRead(@Request() req, @Param("messageId") messageId: number) {
    const userId = req.user.userId;
    const data = await this.userMessageService.markAsRead(userId, messageId);
    return {
      code: 200,
      message: "标记成功",
      data,
    };
  }

  @Put("readAll")
  @ApiOperation({ summary: "标记所有消息为已读" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "标记成功" })
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userMessageService.markAllAsRead(userId);
    return {
      code: 200,
      message: "标记成功",
      data,
    };
  }

  @Delete("delete/:messageId")
  @ApiOperation({ summary: "删除消息" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: "messageId", description: "消息ID" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteMessage(@Request() req, @Param("messageId") messageId: number) {
    const userId = req.user.userId;
    const data = await this.userMessageService.deleteMessage(userId, messageId);
    return {
      code: 200,
      message: "删除成功",
      data,
    };
  }

  @Delete("batchDelete")
  @ApiOperation({ summary: "批量删除消息" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeleteMessages(@Request() req, @Body() batchDto: MessageBatchDto) {
    const userId = req.user.userId;
    const data = await this.userMessageService.batchDeleteMessages(
      userId,
      batchDto,
    );
    return {
      code: 200,
      message: "批量删除成功",
      data,
    };
  }

  @Put("batchRead")
  @ApiOperation({ summary: "批量标记消息为已读" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "标记成功" })
  async batchMarkAsRead(@Request() req, @Body() batchDto: MessageBatchDto) {
    const userId = req.user.userId;
    const data = await this.userMessageService.batchMarkAsRead(
      userId,
      batchDto,
    );
    return {
      code: 200,
      message: "批量标记成功",
      data,
    };
  }

  @Get("unreadCount")
  @ApiOperation({ summary: "获取未读消息数量" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userMessageService.getUnreadCount(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("statistics")
  @ApiOperation({ summary: "获取消息统计信息" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageStatistics(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userMessageService.getMessageStatistics(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }
}
