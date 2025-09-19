import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { MailTemplateService } from './mail-template.service';
import {
  MailTemplateQueryDto,
  MailTemplateDetailDto,
  CreateMailTemplateDto,
  UpdateMailTemplateDto,
  UpdateMailTemplateFieldDto,
  DeleteMailTemplateDto,
  BatchDeleteMailTemplateDto,
} from './dto/mail-template.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('邮件模板管理')
@Controller('admin/mail-template')
@UseGuards(RolesGuard)
@Roles('admin')
export class MailTemplateController {
  constructor(private readonly mailTemplateService: MailTemplateService) {}

  @Get()
  @ApiOperation({ summary: '获取邮件模板列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiQuery({ name: 'template_code', required: false, description: '模板代码' })
  @ApiQuery({ name: 'type', required: false, description: '模板类型' })
  @ApiQuery({ name: 'paging', required: false, description: '是否分页' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMailTemplateList(@Query() query: MailTemplateQueryDto) {
    const [records, total] = await Promise.all([
      this.mailTemplateService.getFilterResult(query),
      query.paging ? this.mailTemplateService.getFilterCount(query) : Promise.resolve(records?.length || 0),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: query.paging ? {
        records,
        total,
      } : records,
    };
  }

  @Get('all')
  @ApiOperation({ summary: '获取所有邮件模板' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'template_code', required: false, description: '模板代码' })
  @ApiQuery({ name: 'type', required: false, description: '模板类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllMailTemplates(@Query() query: Partial<MailTemplateQueryDto>) {
    const filter = {
      ...query,
      paging: false,
    };
    const records = await this.mailTemplateService.getFilterResult(filter);

    return {
      code: 200,
      message: '获取成功',
      data: records,
    };
  }

  @Get('detail')
  @ApiOperation({ summary: '获取邮件模板详情' })
  @ApiQuery({ name: 'template_id', required: true, description: '邮件模板ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMailTemplateDetail(@Query() query: MailTemplateDetailDto) {
    const item = await this.mailTemplateService.getDetail(query.template_id);

    return {
      code: 200,
      message: '获取成功',
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: '创建邮件模板' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createMailTemplate(@Body() createDto: CreateMailTemplateDto) {
    const result = await this.mailTemplateService.create(createDto);

    return {
      code: 200,
      message: '创建成功',
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: '更新邮件模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMailTemplate(@Body() updateDto: UpdateMailTemplateDto) {
    const result = await this.mailTemplateService.update(updateDto.template_id, updateDto);

    return {
      code: 200,
      message: '更新成功',
      data: result,
    };
  }

  @Put('field')
  @ApiOperation({ summary: '更新邮件模板字段' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMailTemplateField(@Body() updateDto: UpdateMailTemplateFieldDto) {
    const result = await this.mailTemplateService.updateField(updateDto.template_id, updateDto.field, updateDto.value);

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
  @ApiOperation({ summary: '删除邮件模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteMailTemplate(@Body() deleteDto: DeleteMailTemplateDto) {
    const result = await this.mailTemplateService.delete(deleteDto.template_id);

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
  @ApiOperation({ summary: '批量删除邮件模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchDeleteMailTemplate(@Body() batchDto: BatchDeleteMailTemplateDto) {
    const result = await this.mailTemplateService.batchDelete(batchDto.template_ids);

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

  @Get('by-code/:templateCode')
  @ApiOperation({ summary: '根据模板代码获取邮件模板' })
  @ApiParam({ name: 'templateCode', description: '模板代码' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTemplateByCode(@Param('templateCode') templateCode: string) {
    const result = await this.mailTemplateService.getTemplateByCode(templateCode);

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('get-all')
  @ApiOperation({ summary: '获取所有邮件模板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllTemplates() {
    const result = await this.mailTemplateService.getAllMailTemplates();

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }

  @Get('preview/:templateId')
  @ApiOperation({ summary: '预览邮件模板' })
  @ApiParam({ name: 'templateId', description: '模板ID' })
  @ApiQuery({ name: 'variables', required: false, description: '变量JSON字符串' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async previewTemplate(@Param('templateId') templateId: number, @Query('variables') variables?: string) {
    let parsedVariables = {};
    if (variables) {
      try {
        parsedVariables = JSON.parse(variables);
      } catch (error) {
        throw new Error('变量格式不正确');
      }
    }

    const result = await this.mailTemplateService.previewTemplate(templateId, parsedVariables);

    return {
      code: 200,
      message: '获取成功',
      data: result,
    };
  }
}