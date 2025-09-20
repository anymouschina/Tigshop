// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  MessageTypeService,
  MESSAGE_SEND_TYPE_NAMES,
} from "./message-type.service";
import {
  MessageTypeQueryDto,
  MessageTypeDetailDto,
  CreateMessageTypeDto,
  UpdateMessageTypeDto,
  UpdateMessageTypeFieldDto,
  DeleteMessageTypeDto,
  BatchDeleteMessageTypeDto,
  MessageSendType,
} from "./dto/message-type.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("消息类型管理")
@Controller("admin/message-type")
@UseGuards(RolesGuard)
@Roles("admin")
export class MessageTypeController {
  constructor(private readonly messageTypeService: MessageTypeService) {}

  @Get()
  @ApiOperation({ summary: "获取消息类型列表" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiQuery({ name: "send_type", required: false, description: "发送类型" })
  @ApiQuery({ name: "message_id", required: false, description: "消息ID" })
  @ApiQuery({ name: "paging", required: false, description: "是否分页" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageTypeList(@Query() query: MessageTypeQueryDto) {
    const [records, total] = await Promise.all([
      this.messageTypeService.getFilterResult(query),
      query.paging
        ? this.messageTypeService.getFilterCount(query)
        : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: query.paging
        ? {
            records,
            total,
            send_type_list: MESSAGE_SEND_TYPE_NAMES,
          }
        : records,
    };
  }

  @Get("all")
  @ApiOperation({ summary: "获取所有消息类型" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "send_type", required: false, description: "发送类型" })
  @ApiQuery({ name: "message_id", required: false, description: "消息ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAllMessageTypes(@Query() query: Partial<MessageTypeQueryDto>) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.messageTypeService.getFilterResult(filter);

    return {
      code: 200,
      message: "获取成功",
      data: records,
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "获取消息类型详情" })
  @ApiQuery({ name: "message_id", required: true, description: "消息类型ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageTypeDetail(@Query() query: MessageTypeDetailDto) {
    const item = await this.messageTypeService.getDetail(query.message_id);

    return {
      code: 200,
      message: "获取成功",
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建消息类型" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createMessageType(@Body() createDto: CreateMessageTypeDto) {
    const result = await this.messageTypeService.create(createDto);

    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: "更新消息类型" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateMessageType(@Body() updateDto: UpdateMessageTypeDto) {
    const result = await this.messageTypeService.update(
      updateDto.message_id,
      updateDto,
    );

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Put("field")
  @ApiOperation({ summary: "更新消息类型字段" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateMessageTypeField(@Body() updateDto: UpdateMessageTypeFieldDto) {
    const result = await this.messageTypeService.updateField(
      updateDto.message_id,
      updateDto.field,
      updateDto.value,
    );

    if (result) {
      return {
        code: 200,
        message: "更新成功",
      };
    } else {
      return {
        code: 400,
        message: "更新失败",
      };
    }
  }

  @Delete()
  @ApiOperation({ summary: "删除消息类型" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteMessageType(@Body() deleteDto: DeleteMessageTypeDto) {
    const result = await this.messageTypeService.delete(deleteDto.message_id);

    if (result) {
      return {
        code: 200,
        message: "删除成功",
      };
    } else {
      return {
        code: 400,
        message: "删除失败",
      };
    }
  }

  @Delete("batch")
  @ApiOperation({ summary: "批量删除消息类型" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeleteMessageType(@Body() batchDto: BatchDeleteMessageTypeDto) {
    const result = await this.messageTypeService.batchDelete(
      batchDto.message_ids,
    );

    if (result) {
      return {
        code: 200,
        message: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        message: "批量删除失败",
      };
    }
  }

  @Get("available")
  @ApiOperation({ summary: "获取所有可用的消息类型" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAvailableMessageTypes() {
    const result = await this.messageTypeService.getAllAvailableMessageTypes();

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Get("by-send-type/:sendType")
  @ApiOperation({ summary: "根据发送类型获取消息类型" })
  @ApiParam({ name: "sendType", description: "发送类型" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageTypesBySendType(
    @Param("sendType") sendType: MessageSendType,
  ) {
    const result =
      await this.messageTypeService.getMessageTypesBySendType(sendType);

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }

  @Get("with-templates")
  @ApiOperation({ summary: "获取消息类型及其关联的模板" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMessageTypesWithTemplates() {
    const result = await this.messageTypeService.getMessageTypesWithTemplates();

    return {
      code: 200,
      message: "获取成功",
      data: result,
    };
  }
}
