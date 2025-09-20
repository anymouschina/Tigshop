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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserSignService } from "./user-sign.service";
import { SignQueryDto } from "./dto/user-sign.dto";

@ApiTags("用户端签到")
@Controller("api/user/sign")
export class UserSignController {
  constructor(private readonly userSignService: UserSignService) {}

  @Get("setting")
  @ApiOperation({ summary: "获取签到设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignSetting() {
    const data = await this.userSignService.getSignSetting();
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("info")
  @ApiOperation({ summary: "获取用户签到信息" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserSignInfo(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userSignService.getUserSignInfo(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Post("daily")
  @ApiOperation({ summary: "每日签到" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "签到成功" })
  async dailySign(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userSignService.dailySign(userId);
    return {
      code: 200,
      message: data.message,
      data,
    };
  }

  @Get("records")
  @ApiOperation({ summary: "获取签到记录" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: "days",
    required: false,
    description: "获取最近多少天的记录",
  })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignRecords(@Request() req, @Query("days") days?: number) {
    const userId = req.user.userId;
    const data = await this.userSignService.getSignRecords(userId, days || 30);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("log")
  @ApiOperation({ summary: "获取签到日志" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "size", required: false })
  @ApiQuery({ name: "start_date", required: false })
  @ApiQuery({ name: "end_date", required: false })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignLog(@Request() req, @Query() queryDto: SignQueryDto) {
    const userId = req.user.userId;
    const data = await this.userSignService.getSignLog(userId, queryDto);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("ranking")
  @ApiOperation({ summary: "获取签到排行榜" })
  @ApiQuery({ name: "limit", required: false, description: "排行榜数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignRanking(@Query("limit") limit?: number) {
    const data = await this.userSignService.getSignRanking(limit || 10);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Get("statistics")
  @ApiOperation({ summary: "获取签到统计信息" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignStatistics(@Request() req) {
    const userId = req.user.userId;
    const data = await this.userSignService.getSignStatistics(userId);
    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }
}
