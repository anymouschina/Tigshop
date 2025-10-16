import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserMessageService } from "./user-message.service";
import {
  GetUserMessageListDto,
  UpdateMessageReadDto,
} from "./dto/user-message.dto";
import { ResponseUtil } from "../../common/utils/response.util";

@ApiTags("用户站内信（API兼容）")
@Controller("api/user/message")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserMessageApiCompatController {
  constructor(private readonly userMessageService: UserMessageService) {}

  @ApiOperation({ summary: "获取用户站内信列表(兼容)" })
  @Get("list")
  async getMessageList(@Request() req, @Query() query: GetUserMessageListDto) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const result = await this.userMessageService.getUserMessageList(
      userId,
      query,
    );
    return ResponseUtil.success(result);
  }

  @ApiOperation({ summary: "标记所有消息为已读(兼容)" })
  @Post("updateAllRead")
  async updateAllRead(@Request() req) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const ok = await this.userMessageService.markAllMessagesAsRead(userId);
    return ok ? ResponseUtil.success() : ResponseUtil.error("操作失败");
  }

  @ApiOperation({ summary: "标记单条消息为已读(兼容)" })
  @Post("updateMessageRead")
  async updateMessageRead(@Request() req, @Body() body: UpdateMessageReadDto) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const ok = await this.userMessageService.markMessageAsRead(body.id, userId);
    return ok
      ? ResponseUtil.success()
      : ResponseUtil.error("标记失败或消息不存在");
  }

  @ApiOperation({ summary: "删除消息(兼容)" })
  @Post("del")
  async deleteMessage(@Request() req, @Body() body: UpdateMessageReadDto) {
    const userId = req.user.user_id || req.user.userId || req.user.sub;
    const ok = await this.userMessageService.deleteMessage(body.id, userId);
    return ok
      ? ResponseUtil.success()
      : ResponseUtil.error("删除失败或消息不存在");
  }
}
