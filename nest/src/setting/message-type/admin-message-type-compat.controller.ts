// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { MessageTypeService, MESSAGE_SEND_TYPE_NAMES } from "../message-type.service";

@ApiTags("Admin API - 消息类型(兼容路径)")
@Controller("adminapi/setting/messageType")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminMessageTypeCompatController {
  constructor(private messageTypeService: MessageTypeService) {}

  @Get("list")
  @Authorities("setting")
  @ApiOperation({ summary: "消息类型列表（兼容）" })
  async list(@Query() query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.max(1, Number(query.size) || 15);
    const filter: any = {
      keyword: (query.keyword || "").trim(),
      send_type: query.sendType ? Number(query.sendType) : undefined,
      message_id: query.messageId ? Number(query.messageId) : undefined,
      paging: true,
      page,
      size,
      sort_field: query.sortField,
      sort_order: query.sortOrder,
    };

    const [records, total] = await Promise.all([
      this.messageTypeService.getFilterResult(filter),
      this.messageTypeService.getFilterCount(filter),
    ]);

    const data = {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size) || 1,
      sendTypeList: MESSAGE_SEND_TYPE_NAMES,
    };

    return { code: 0, message: "success", data };
  }
}
