// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailTemplateType } from './dto/mail-template.dto';

@Injectable()
export class MailTemplateService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.mailTemplates.findMany({
        where,
        orderBy,
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.mailTemplates.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.mailTemplates.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          template_code: {
            contains: filter.keyword,
          },
        },
        {
          template_subject: {
            contains: filter.keyword,
          },
        },
        {
          template_content: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 模板代码筛选
    if (filter.template_code) {
      where.template_code = {
        contains: filter.template_code,
      };
    }

    // 类型筛选
    if (filter.type) {
      where.type = filter.type;
    }

    return where;
  }

  private buildOrderBy(filter: any): any {
    if (filter.sort_field && filter.sort_order) {
      return {
        [filter.sort_field]: filter.sort_order,
      };
    }
    return {
      template_id: 'desc',
    };
  }

  async getDetail(templateId: number): Promise<any> {
    const result = await this.prisma.mailTemplates.findUnique({
      where: { template_id: templateId },
    });

    if (!result) {
      throw new Error('邮件模板不存在');
    }

    return result;
  }

  async create(data: any): Promise<any> {
    // 验证模板代码不能为空
    if (!data.template_code || data.template_code.trim() === '') {
      throw new Error('模板代码不能为空');
    }

    // 验证模板主题不能为空
    if (!data.template_subject || data.template_subject.trim() === '') {
      throw new Error('模板主题不能为空');
    }

    // 验证模板内容不能为空
    if (!data.template_content || data.template_content.trim() === '') {
      throw new Error('模板内容不能为空');
    }

    // 检查模板代码是否已存在
    const existingTemplate = await this.prisma.mailTemplates.findFirst({
      where: {
        template_code: data.template_code,
      },
    });

    if (existingTemplate) {
      throw new Error('模板代码已存在');
    }

    const result = await this.prisma.mailTemplates.create({
      data: {
        template_code: data.template_code,
        is_html: data.is_html,
        template_subject: data.template_subject,
        template_content: data.template_content,
        type: data.type || MailTemplateType.TEMPLATE,
        last_modify: new Date(),
        last_send: null,
      },
    });

    return result;
  }

  async update(templateId: number, data: any): Promise<any> {
    const mailTemplate = await this.prisma.mailTemplates.findUnique({
      where: { template_id: templateId },
    });

    if (!mailTemplate) {
      throw new Error('邮件模板不存在');
    }

    // 验证模板代码不能为空
    if (data.template_code !== undefined && (!data.template_code || data.template_code.trim() === '')) {
      throw new Error('模板代码不能为空');
    }

    // 验证模板主题不能为空
    if (data.template_subject !== undefined && (!data.template_subject || data.template_subject.trim() === '')) {
      throw new Error('模板主题不能为空');
    }

    // 验证模板内容不能为空
    if (data.template_content !== undefined && (!data.template_content || data.template_content.trim() === '')) {
      throw new Error('模板内容不能为空');
    }

    // 检查模板代码是否已存在（排除当前模板）
    if (data.template_code && data.template_code !== mailTemplate.template_code) {
      const existingTemplate = await this.prisma.mailTemplates.findFirst({
        where: {
          template_code: data.template_code,
          template_id: { not: templateId },
        },
      });

      if (existingTemplate) {
        throw new Error('模板代码已存在');
      }
    }

    const updateData: any = {
      last_modify: new Date(),
    };
    if (data.template_code !== undefined) updateData.template_code = data.template_code;
    if (data.is_html !== undefined) updateData.is_html = data.is_html;
    if (data.template_subject !== undefined) updateData.template_subject = data.template_subject;
    if (data.template_content !== undefined) updateData.template_content = data.template_content;
    if (data.type !== undefined) updateData.type = data.type;

    const result = await this.prisma.mailTemplates.update({
      where: { template_id: templateId },
      data: updateData,
    });

    return result;
  }

  async updateField(templateId: number, field: string, value: any): Promise<boolean> {
    const mailTemplate = await this.prisma.mailTemplates.findUnique({
      where: { template_id: templateId },
    });

    if (!mailTemplate) {
      throw new Error('邮件模板不存在');
    }

    // 验证字段
    const allowedFields = ['template_code', 'is_html', 'template_subject', 'template_content', 'type'];
    if (!allowedFields.includes(field)) {
      throw new Error('不支持的字段');
    }

    // 如果更新模板代码，检查是否已存在
    if (field === 'template_code' && value !== mailTemplate.template_code) {
      const existingTemplate = await this.prisma.mailTemplates.findFirst({
        where: {
          template_code: value,
          template_id: { not: templateId },
        },
      });

      if (existingTemplate) {
        throw new Error('模板代码已存在');
      }
    }

    const result = await this.prisma.mailTemplates.update({
      where: { template_id: templateId },
      data: {
        [field]: value,
        last_modify: new Date(),
      },
    });

    return !!result;
  }

  async delete(templateId: number): Promise<boolean> {
    const mailTemplate = await this.prisma.mailTemplates.findUnique({
      where: { template_id: templateId },
    });

    if (!mailTemplate) {
      throw new Error('邮件模板不存在');
    }

    const result = await this.prisma.mailTemplates.delete({
      where: { template_id: templateId },
    });

    return !!result;
  }

  async batchDelete(templateIds: number[]): Promise<boolean> {
    await this.prisma.mailTemplates.deleteMany({
      where: { template_id: { in: templateIds } },
    });

    return true;
  }

  // 根据模板代码获取模板
  async getTemplateByCode(templateCode: string): Promise<any> {
    const result = await this.prisma.mailTemplates.findFirst({
      where: {
        template_code: templateCode,
      },
    });

    return result;
  }

  // 获取所有邮件模板
  async getAllMailTemplates(): Promise<any[]> {
    const results = await this.prisma.mailTemplates.findMany({
      orderBy: {
        template_id: 'desc',
      },
    });

    return results;
  }

  // 更新邮件发送时间
  async updateLastSendTime(templateId: number): Promise<void> {
    await this.prisma.mailTemplates.update({
      where: { template_id: templateId },
      data: {
        last_send: new Date(),
      },
    });
  }

  // 预览模板内容（变量替换示例）
  async previewTemplate(templateId: number, variables: any = {}): Promise<string> {
    const template = await this.prisma.mailTemplates.findUnique({
      where: { template_id: templateId },
    });

    if (!template) {
      throw new Error('邮件模板不存在');
    }

    let content = template.template_content;
    let subject = template.template_subject;

    // 替换变量 {$variable_name}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\$${key}\\}`, 'g');
      content = content.replace(regex, variables[key]);
      subject = subject.replace(regex, variables[key]);
    });

    return {
      subject,
      content,
      is_html: template.is_html,
    };
  }
}
