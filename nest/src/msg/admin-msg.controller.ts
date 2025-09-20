// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdminMsgService, MsgType } from "./admin-msg.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Admin Message")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminMsgController {
  constructor(private readonly adminMsgService: AdminMsgService) {}

  @Get("admin/msg/index")
  @ApiOperation({ summary: "获取管理员消息列表" })
  async index(
    @Query()
    query: {
      page?: number;
      size?: number;
      keyword?: string;
      msg_type?: number;
      is_read?: number;
      shop_id?: number;
      vendor_id?: number;
      suppliers_id?: number;
      suppliers_type?: number;
    },
  ) {
    const filter = {
      page: query.page || 1,
      size: query.size || 10,
      keyword: query.keyword || "",
      msg_type: query.msg_type || 0,
      is_read: query.is_read || -1,
      shop_id: query.shop_id || 0,
      vendor_id: query.vendor_id || 0,
      suppliers_id: query.suppliers_id || 0,
      suppliers_type: query.suppliers_type || 0,
    };

    const [list, total] = await Promise.all([
      this.adminMsgService.getFilterResult(filter),
      this.adminMsgService.getFilterCount(filter),
    ]);

    return {
      list,
      total,
      page: filter.page,
      size: filter.size,
    };
  }

  @Get("admin/msg/detail/:id")
  @ApiOperation({ summary: "获取消息详情" })
  async detail(@Param("id") id: number) {
    return this.adminMsgService.getDetail(Number(id));
  }

  @Post("admin/msg/setReaded")
  @ApiOperation({ summary: "设置消息已读" })
  async setReaded(@Body() body: { id: number }) {
    const result = await this.adminMsgService.setReaded(body.id);
    return { success: result };
  }

  @Post("admin/msg/setAllReaded")
  @ApiOperation({ summary: "设置所有消息已读" })
  async setAllReaded(@Body() body: { shop_id?: number; vendor_id?: number }) {
    const result = await this.adminMsgService.setAllReaded(
      body.shop_id || 0,
      body.vendor_id || 0,
    );
    return { success: result };
  }

  @Get("admin/msg/getMsgType")
  @ApiOperation({ summary: "获取消息类型" })
  async getMsgType(@Query() query: { shop_id?: number; vendor_id?: number }) {
    return this.adminMsgService.getMsgType(
      query.shop_id || 0,
      query.vendor_id || 0,
    );
  }
}
