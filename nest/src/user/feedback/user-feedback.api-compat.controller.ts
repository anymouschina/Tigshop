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
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UserFeedbackService } from "./user-feedback.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@ApiTags("User Feedback API Compat")
@Controller("api/user/feedback")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserFeedbackApiCompatController {
  constructor(private readonly userFeedbackService: UserFeedbackService) {}

  // 对齐 PHP：GET /api/user/feedback/list（需登录）
  @Get("list")
  @ApiOperation({ summary: "获取反馈列表（兼容）" })
  async list(
    @Request() req,
    @Query()
    query: { page?: number; size?: number; type?: number; status?: number },
  ) {
    const userId = req.user.userId;
    return this.userFeedbackService.getUserFeedbackList(userId, query);
  }

  // 对齐 PHP：POST /api/user/feedback/submit（需登录）
  @Post("submit")
  @ApiOperation({ summary: "提交反馈（兼容）" })
  async submit(
    @Request() req,
    @Body()
    body: {
      type: number;
      title: string;
      content: string;
      images?: string[];
      contact?: string;
    },
  ) {
    const userId = req.user.userId;
    return this.userFeedbackService.createFeedback(userId, body);
  }
}
