// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { MessageTemplateService, MESSAGE_TEMPLATE_TYPE_NAMES } from './message-template.service';
import {
  MessageTemplateQueryDto,
  MessageTemplateDetailDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  UpdateMessageTemplateFieldDto,
  DeleteMessageTemplateDto,
  BatchDeleteMessageTemplateDto,
  MessageTemplateType,
} from './dto/message-template.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('消息模板管理')
@Controller('admin/message-template')
@UseGuards(RolesGuard)
@Roles('admin')
export class MessageTemplateController {
  constructor(private readonly messageTemplateService: MessageTemplateService) {}

  @Get()
  @ApiOperation({ summary: '获取消息模板列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, description: '消息类型' })
  @ApiQuery({ name: 'message_id', required: false, description: '消息ID' })
  @ApiQuery({ name: 'paging', required: false, description: '是否分页' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMessageTemplateList(@Query() query: MessageTemplateQueryDto) {
    const [records, total] = await Promise.all([
      this.messageTemplateService.getFilterResult(query),
      query.paging ? this.messageTemplateService.getFilterCount(query) : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: query.paging ? {
        records,
        total,
        type_list: MESSAGE_TEMPLATE_TYPE_NAMES,
      } : records,
    };
  }

  @Get('all')
  @ApiOperation({ summary: '获取所有消息模板' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'type', required: false, description: '消息类型' })
  @ApiQuery({ name: 'message_id', required: false, description: '消息ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllMessageTemplates(@Query() query: Partial<MessageTemplateQueryDto>) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.messageTemplateService.getFilterResult(filter);

    return {
      code: 200,
      message: '获取成功',
      data: records,
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取消息模板详情' })
  @ApiQuery({ name: 'id', required: true, description: '消息模板ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMessageTemplateDetail(@Query() query: MessageTemplateDetailDto) {
    const item = await this.messageTemplateService.getDetail(query.id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建消息模板' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createMessageTemplate(@Body() createDto: CreateMessageTemplateDto) {
    const result = await this.messageTemplateService.create(createDto);

    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新消息模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMessageTemplate(@Body() updateDto: UpdateMessageTemplateDto) {
    const result = await this.messageTemplateService.update(updateDto.id, updateDto);

    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put('field')
  @ApiOperation({ summary: '更新消息模板字段' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMessageTemplateField(@Body() updateDto: UpdateMessageTemplateFieldDto) {
    const result = await this.messageTemplateService.updateField(updateDto.id, updateDto.field, updateDto.value);

    if (result) {
      return {
        code: 200,
        message: '更新成功',
      };
    } else {
      return {
        code: 400,
        message: '更新失败',
      };
    }
  }

  @Delete()
  @ApiOperation({ summary: '删除消息模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteMessageTemplate(@Body() deleteDto: DeleteMessageTemplateDto) {
    const result = await this.messageTemplateService.delete(deleteDto.id);

    if (result) {
      return {
        code: 200,
        message: '删除成功',
      };
    } else {
      return {
        code: 400,
        message: '删除失败',
      };
    }
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除消息模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteMessageTemplate(@Body() batchDto: BatchDeleteMessageTemplateDto) {
    const result = await this.messageTemplateService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: '批量删除成功',
      };
    } else {
      return {
        code: 400,
        message: '批量删除失败',
      };
    }
  }

  @Get('by-message-type/:messageId')
  @ApiOperation({ summary: '根据消息类型获取模板列表' })
  @ApiParam({ name: 'messageId', description: '消息ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTemplatesByMessageType(@Param('messageId') messageId: string) {
    const result = await this.messageTemplateService.getTemplatesByMessageType(messageId);

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: '根据模板类型获取模板列表' })
  @ApiParam({ name: 'type', description: '模板类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTemplatesByType(@Param('type') type: MessageTemplateType) {
    const result = await this.messageTemplateService.getTemplatesByType(type);

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('available')
  @ApiOperation({ summary: '获取所有可用的消息模板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAvailableTemplates() {
    const result = await this.messageTemplateService.getAllAvailableTemplates();

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }
}
