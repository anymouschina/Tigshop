import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MessageSendType } from './dto/message-type.dto';

export const MESSAGE_SEND_TYPE_NAMES = {
  1: '会员',
  2: '商家',
};

@Injectable()
export class MessageTypeService {
  constructor(private prisma: PrismaService) {}

  async getFilterResult(filter: any): Promise<any[]> {
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(filter);

    // 如果不需要分页，返回所有结果
    if (!filter.paging) {
      const results = await this.prisma.messageType.findMany({
        where,
        orderBy,
      });
      return results;
    }

    // 分页查询
    const skip = (filter.page - 1) * filter.size;
    const take = filter.size;

    const results = await this.prisma.messageType.findMany({
      where,
      orderBy,
      skip,
      take,
    });

    return results;
  }

  async getFilterCount(filter: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.messageType.count({ where });
  }

  private buildWhereClause(filter: any): any {
    const where: any = {
      is_deleted: false,
    };

    // 关键词搜索
    if (filter.keyword) {
      where.OR = [
        {
          name: {
            contains: filter.keyword,
          },
        },
        {
          describe: {
            contains: filter.keyword,
          },
        },
      ];
    }

    // 发送类型筛选
    if (filter.send_type) {
      where.send_type = filter.send_type;
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
      message_id: 'desc',
    };
  }

  async getDetail(messageId: number): Promise<any> {
    const result = await this.prisma.messageType.findUnique({
      where: { message_id: messageId },
    });

    if (!result) {
      throw new Error('消息类型不存在');
    }

    return {
      ...result,
      send_type_name: MESSAGE_SEND_TYPE_NAMES[result.send_type],
    };
  }

  async create(data: any): Promise<any> {
    // 验证消息类型名称不能为空
    if (!data.name || data.name.trim() === '') {
      throw new Error('消息类型名称不能为空');
    }

    // 检查是否至少启用了一种消息渠道
    const hasAnyChannel = data.is_wechat || data.is_mini_program ||
                         data.is_message || data.is_msg ||
                         data.is_app || data.is_ding;

    if (!hasAnyChannel) {
      throw new Error('至少需要启用一种消息渠道');
    }

    const result = await this.prisma.messageType.create({
      data: {
        name: data.name,
        describe: data.describe || '',
        send_type: data.send_type || MessageSendType.MEMBER,
        is_wechat: data.is_wechat || false,
        is_mini_program: data.is_mini_program || false,
        is_message: data.is_message || false,
        is_msg: data.is_msg || false,
        is_app: data.is_app || false,
        is_ding: data.is_ding || false,
        add_time: Math.floor(Date.now() / 1000),
        is_deleted: false,
      },
    });

    return result;
  }

  async update(messageId: number, data: any): Promise<any> {
    const messageType = await this.prisma.messageType.findUnique({
      where: { message_id: messageId },
    });

    if (!messageType) {
      throw new Error('消息类型不存在');
    }

    // 验证消息类型名称不能为空
    if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
      throw new Error('消息类型名称不能为空');
    }

    // 如果更新了消息渠道，检查是否至少启用了一种
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.describe !== undefined) updateData.describe = data.describe;
    if (data.send_type !== undefined) updateData.send_type = data.send_type;
    if (data.is_wechat !== undefined) updateData.is_wechat = data.is_wechat;
    if (data.is_mini_program !== undefined) updateData.is_mini_program = data.is_mini_program;
    if (data.is_message !== undefined) updateData.is_message = data.is_message;
    if (data.is_msg !== undefined) updateData.is_msg = data.is_msg;
    if (data.is_app !== undefined) updateData.is_app = data.is_app;
    if (data.is_ding !== undefined) updateData.is_ding = data.is_ding;

    // 如果更新了任何消息渠道，检查是否至少启用了一种
    const channelFields = ['is_wechat', 'is_mini_program', 'is_message', 'is_msg', 'is_app', 'is_ding'];
    const hasChannelUpdate = channelFields.some(field => data[field] !== undefined);

    if (hasChannelUpdate) {
      const hasAnyChannel = Object.keys(updateData)
        .filter(key => channelFields.includes(key))
        .some(key => updateData[key]) ||
        channelFields.some(field =>
          data[field] === undefined && messageType[field as keyof typeof messageType]
        );

      if (!hasAnyChannel) {
        throw new Error('至少需要启用一种消息渠道');
      }
    }

    const result = await this.prisma.messageType.update({
      where: { message_id: messageId },
      data: updateData,
    });

    return result;
  }

  async updateField(messageId: number, field: string, value: any): Promise<boolean> {
    const messageType = await this.prisma.messageType.findUnique({
      where: { message_id: messageId },
    });

    if (!messageType) {
      throw new Error('消息类型不存在');
    }

    // 验证字段
    const allowedFields = ['name', 'describe', 'send_type', 'is_wechat', 'is_mini_program',
                          'is_message', 'is_msg', 'is_app', 'is_ding'];
    if (!allowedFields.includes(field)) {
      throw new Error('不支持的字段');
    }

    // 如果更新的是消息渠道，检查是否至少启用了一种
    const channelFields = ['is_wechat', 'is_mini_program', 'is_message', 'is_msg', 'is_app', 'is_ding'];
    if (channelFields.includes(field) && value === false) {
      const remainingChannels = channelFields
        .filter(f => f !== field)
        .some(f => messageType[f as keyof typeof messageType]);

      if (!remainingChannels) {
        throw new Error('至少需要启用一种消息渠道');
      }
    }

    const result = await this.prisma.messageType.update({
      where: { message_id: messageId },
      data: {
        [field]: value,
      },
    });

    return !!result;
  }

  async delete(messageId: number): Promise<boolean> {
    const messageType = await this.prisma.messageType.findUnique({
      where: { message_id: messageId },
    });

    if (!messageType) {
      throw new Error('消息类型不存在');
    }

    // 检查是否有关联的消息模板
    const relatedTemplates = await this.prisma.messageTemplate.count({
      where: {
        message_id: messageType.message_id.toString(),
      },
    });

    if (relatedTemplates > 0) {
      throw new Error('该消息类型下存在消息模板，无法删除');
    }

    // 软删除
    const result = await this.prisma.messageType.update({
      where: { message_id: messageId },
      data: {
        is_deleted: true,
      },
    });

    return !!result;
  }

  async batchDelete(messageIds: number[]): Promise<boolean> {
    // 检查是否有关联的消息模板
    const relatedTemplates = await this.prisma.messageTemplate.count({
      where: {
        message_id: { in: messageIds.map(id => id.toString()) },
      },
    });

    if (relatedTemplates > 0) {
      throw new Error('选中的消息类型下存在消息模板，无法删除');
    }

    // 批量软删除
    await this.prisma.messageType.updateMany({
      where: { message_id: { in: messageIds } },
      data: {
        is_deleted: true,
      },
    });

    return true;
  }

  // 获取所有可用的消息类型
  async getAllAvailableMessageTypes(): Promise<any[]> {
    const results = await this.prisma.messageType.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: {
        message_id: 'desc',
      },
    });

    return results;
  }

  // 根据发送类型获取消息类型
  async getMessageTypesBySendType(sendType: MessageSendType): Promise<any[]> {
    const results = await this.prisma.messageType.findMany({
      where: {
        send_type,
        is_deleted: false,
      },
      orderBy: {
        message_id: 'desc',
      },
    });

    return results;
  }

  // 获取消息类型及其关联的模板
  async getMessageTypesWithTemplates(): Promise<any[]> {
    const results = await this.prisma.messageType.findMany({
      where: {
        is_deleted: false,
      },
      include: {
        message_templates: true,
      },
      orderBy: {
        message_id: 'desc',
      },
    });

    return results;
  }
}