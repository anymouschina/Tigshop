// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { UserAftersalesService } from "./user-aftersales.service";
import {
  CreateAftersalesDto,
  UpdateAftersalesDto,
  AftersalesFeedbackDto,
  AftersalesQueryDto,
  ApplyDataDto,
} from "./dto/user-aftersales.dto";

@ApiTags("用户端-售后服务")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/user/aftersales")
export class UserAftersalesController {
  constructor(private readonly userAftersalesService: UserAftersalesService) {}

  @Get("list")
  @ApiOperation({ summary: "可售后订单列表" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "size", required: false, type: Number })
  async getAfterSalesOrderList(
    @Request() req,
    @Query() queryDto: AftersalesQueryDto,
  ) {
    const userId = req.user.userId;
    return await this.userAftersalesService.getAfterSalesOrderList(
      userId,
      queryDto,
    );
  }

  @Get("config")
  @ApiOperation({ summary: "售后服务配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAfterSalesConfig() {
    return await this.userAftersalesService.getAfterSalesConfig();
  }

  @Get("apply-data")
  @ApiOperation({ summary: "售后申请详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAfterSalesApplyData(@Query() applyDataDto: ApplyDataDto) {
    return await this.userAftersalesService.getAfterSalesApplyData(
      applyDataDto,
    );
  }

  @Post("create")
  @ApiOperation({ summary: "创建售后申请" })
  @ApiResponse({ status: 200, description: "申请成功" })
  async createAfterSales(
    @Request() req,
    @Body() createDto: CreateAftersalesDto,
  ) {
    const userId = req.user.userId;
    return await this.userAftersalesService.createAfterSales(userId, createDto);
  }

  @Post("update")
  @ApiOperation({ summary: "更新售后申请" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateAfterSales(
    @Request() req,
    @Body() updateDto: UpdateAftersalesDto,
  ) {
    const userId = req.user.userId;
    return await this.userAftersalesService.updateAfterSales(userId, updateDto);
  }

  @Get("record")
  @ApiOperation({ summary: "售后申请记录" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "size", required: false, type: Number })
  async getAfterSalesRecord(
    @Request() req,
    @Query() queryDto: AftersalesQueryDto,
  ) {
    const userId = req.user.userId;
    return await this.userAftersalesService.getAfterSalesRecord(
      userId,
      queryDto,
    );
  }

  @Get("detail/:id")
  @ApiOperation({ summary: "查看售后记录详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAfterSalesDetail(@Request() req, @Param("id") id: string) {
    const userId = req.user.userId;
    const aftersaleId = parseInt(id);
    return await this.userAftersalesService.getAfterSalesDetail(
      aftersaleId,
      userId,
    );
  }

  @Get("detail-log/:id")
  @ApiOperation({ summary: "查看售后日志记录" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAfterSalesDetailLog(@Param("id") id: string) {
    const aftersaleId = parseInt(id);
    return await this.userAftersalesService.getAfterSalesDetailLog(aftersaleId);
  }

  @Post("feedback")
  @ApiOperation({ summary: "提交售后反馈记录" })
  @ApiResponse({ status: 200, description: "提交成功" })
  async submitFeedback(
    @Request() req,
    @Body() feedbackDto: AftersalesFeedbackDto,
  ) {
    const userId = req.user.userId;
    return await this.userAftersalesService.submitFeedback(userId, feedbackDto);
  }

  @Post("cancel")
  @ApiOperation({ summary: "撤销申请售后" })
  @ApiResponse({ status: 200, description: "撤销成功" })
  @ApiQuery({ name: "aftersale_id", required: true, type: Number })
  async cancelAfterSales(
    @Request() req,
    @Query("aftersale_id") aftersale_id: string,
  ) {
    const userId = req.user.userId;
    const aftersalesId = parseInt(aftersale_id);
    return await this.userAftersalesService.cancelAfterSales(
      userId,
      aftersalesId,
    );
  }
}
