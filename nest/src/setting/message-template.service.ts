import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MessageTemplateType } from './dto/message-template.dto';

export const MESSAGE_TEMPLATE_TYPE_NAMES = {
  1: '微信公众号',
  2: '小程序',
  3: '短信',
  4: '站内消息',
  5: 'APP',
  6: '钉钉',
};

@Injectable()
export class MessageTemplateService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.messageTemplate.findMany({
        where,
        orderBy,
        include: {
          message_type: true,
        },
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.messageTemplate.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        message_type: true,
      },
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.messageTemplate.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {};

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          template_name: {
            contains: filter.keyword,
          },
        },
        {
          template_id: {
            contains: filter.keyword,
          },
        },
        {
          content: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 消息类型筛选
    if (filter.type) {
      where.type = filter.type;
    }

    // 消息ID筛选
    if (filter.message_id) {
      where.message_id = filter.message_id;
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
      id: 'desc',
    };
  }

  async getDetail(id: number): Promise<any> {
    const result = await this.prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        message_type: true,
      },
    });

    if (!result) {
      throw new Error('消息模板不存在');
    }

    return {
      ...result,
      type_name: MESSAGE_TEMPLATE_TYPE_NAMES[result.type],
    };
  }

  async create(data: any): Promise<any> {
    // 验证消息类型是否存在
    if (data.message_id) {
      const messageType = await this.prisma.messageType.findUnique({
        where: { message_id: data.message_id },
      });
      if (!messageType) {
        throw new Error('消息类型不存在');
      }
    }

    // 验证模板名称不能为空
    if (!data.template_name || data.template_name.trim() === '') {
      throw new Error('模板名称不能为空');
    }

    // 验证模板ID不能为空
    if (!data.template_id || data.template_id.trim() === '') {
      throw new Error('模板ID不能为空');
    }

    // 验证模板内容不能为空
    if (!data.content || data.content.trim() === '') {
      throw new Error('模板内容不能为空');
    }

    const result = await this.prisma.messageTemplate.create({
      data: {
        message_id: data.message_id || '',
        type: data.type,
        template_name: data.template_name,
        to_userid: data.to_userid || '',
        template_id: data.template_id,
        template_num: data.template_num || '',
        content: data.content,
      },
      include: {
        message_type: true,
      },
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const messageTemplate = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!messageTemplate) {
      throw new Error('消息模板不存在');
    }

    // 验证消息类型是否存在
    if (data.message_id) {
      const messageType = await this.prisma.messageType.findUnique({
        where: { message_id: data.message_id },
      });
      if (!messageType) {
        throw new Error('消息类型不存在');
      }
    }

    // 验证模板名称不能为空
    if (data.template_name !== undefined && (!data.template_name || data.template_name.trim() === '')) {
      throw new Error('模板名称不能为空');
    }

    // 验证模板ID不能为空
    if (data.template_id !== undefined && (!data.template_id || data.template_id.trim() === '')) {
      throw new Error('模板ID不能为空');
    }

    // 验证模板内容不能为空
    if (data.content !== undefined && (!data.content || data.content.trim() === '')) {
      throw new Error('模板内容不能为空');
    }

    const updateData: any = {};
    if (data.message_id !== undefined) updateData.message_id = data.message_id;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.template_name !== undefined) updateData.template_name = data.template_name;
    if (data.to_userid !== undefined) updateData.to_userid = data.to_userid;
    if (data.template_id !== undefined) updateData.template_id = data.template_id;
    if (data.template_num !== undefined) updateData.template_num = data.template_num;
    if (data.content !== undefined) updateData.content = data.content;

    const result = await this.prisma.messageTemplate.update({
      where: { id },
      data: updateData,
      include: {
        message_type: true,
      },
    });

    return result;
  }

  async updateField(id: number, field: string, value: any): Promise<boolean> {
    const messageTemplate = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!messageTemplate) {
      throw new Error('消息模板不存在');
    }

    // 验证字段
    const allowedFields = ['template_name', 'type', 'template_id', 'template_num', 'content', 'to_userid'];
    if (!allowedFields.includes(field)) {
      throw new Error('不支持的字段');
    }

    const result = await this.prisma.messageTemplate.update({
      where: { id },
      data: {
        [field]: value,
      },
    });

    return !!result;
  }

  async delete(id: number): Promise<boolean> {
    const messageTemplate = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!messageTemplate) {
      throw new Error('消息模板不存在');
    }

    const result = await this.prisma.messageTemplate.delete({
      where: { id },
    });

    return !!result;
  }

  async batchDelete(ids: number[]): Promise<boolean> {
    await this.prisma.messageTemplate.deleteMany({
      where: { id: { in: ids } },
    });

    return true;
  }

  // 根据消息类型获取模板列表
  async getTemplatesByMessageType(messageId: string): Promise<any[]> {
    const results = await this.prisma.messageTemplate.findMany({
      where: {
        message_id: messageId,
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        message_type: true,
      },
    });

    return results;
  }

  // 根据模板类型获取模板列表
  async getTemplatesByType(type: MessageTemplateType): Promise<any[]> {
    const results = await this.prisma.messageTemplate.findMany({
      where: {
        type,
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        message_type: true,
      },
    });

    return results;
  }

  // 获取所有可用的模板
  async getAllAvailableTemplates(): Promise<any[]> {
    const results = await this.prisma.messageTemplate.findMany({
      where: {
        message_type: {
          is_deleted: false,
        },
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        message_type: true,
      },
    });

    return results;
  }
}