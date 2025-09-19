import { Controller, Get, Post, Put, Query, Body, UseGuards } from '@nestjs/common';
import { AdminMsgService, MsgType, ORDER_RELATED_TYPE, PRODUCT_RELATED_TYPE } from './admin-msg.service';
import { OrderService } from '../order/order.service';
import {
  AdminMsgQueryDto,
  SetReadedDto,
  SetAllReadedDto,
  GetMsgCountDto,
  CreateAdminMsgDto,
} from './dto/admin-msg.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('消息管理')
@Controller('admin/msg')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminMsgController {
  constructor(
    private readonly adminMsgService: AdminMsgService,
    private readonly orderService: OrderService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取消息列表' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'msg_type', required: false, description: '消息类型' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMsgList(@Query() query: AdminMsgQueryDto) {
    const filter = {
      ...query,
      shop_id: 1, // TODO: 从token中获取
      suppliers_id: 1, // TODO: 从token中获取
      vendor_id: 1, // TODO: 从token中获取，可能为0
    };

    const [records, total] = await Promise.all([
      this.adminMsgService.getFilterResult(filter),
      this.adminMsgService.getFilterCount(filter),
    ]);

    return {
      code: 200,
      message: '获取成功',
      data: {
        records,
        total,
      },
    };
  }

  @Get('type-arr')
  @ApiOperation({ summary: '获取消息类型数组' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMsgTypeArr() {
    const vendorId = 1; // TODO: 从token中获取，可能为0
    const shopId = 1; // TODO: 从token中获取

    const msgTypeArr = await this.adminMsgService.getMsgType(shopId, vendorId);

    return {
      code: 200,
      message: '获取成功',
      data: msgTypeArr,
    };
  }

  @Get('config')
  @ApiOperation({ summary: '获取配置项' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getConfig() {
    return {
      code: 200,
      message: '获取成功',
      data: {
        order_type: ORDER_RELATED_TYPE,
        product_type: PRODUCT_RELATED_TYPE,
      },
    };
  }

  @Put('set-readed')
  @ApiOperation({ summary: '设置单个消息已读' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setReaded(@Body() setReadedDto: SetReadedDto) {
    await this.adminMsgService.setReaded(setReadedDto.msg_id);

    return {
      code: 200,
      message: '设置成功',
    };
  }

  @Put('set-all-readed')
  @ApiOperation({ summary: '设置全部消息已读' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAllReaded(@Body() setAllReadedDto: SetAllReadedDto) {
    const shopId = setAllReadedDto.shop_id || 1; // TODO: 从token中获取
    const vendorId = setAllReadedDto.vendor_id || 0; // TODO: 从token中获取

    await this.adminMsgService.setAllReaded(shopId, vendorId);

    return {
      code: 200,
      message: '设置成功',
    };
  }

  @Get('count')
  @ApiOperation({ summary: '获取消息统计' })
  @ApiQuery({ name: 'start_time', required: false, description: '开始时间' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMsgCount(@Query() query: GetMsgCountDto) {
    const shopId = 1; // TODO: 从token中获取

    // 获取订单数量
    const orderCount = await this.orderService.getFilterCount({
      shop_id: shopId,
      add_start_time: this.formatTime(query.start_time),
      add_end_time: this.getCurrentDate(),
    });

    // 获取未读消息数量
    const unreadMsgCount = await this.adminMsgService.getFilterCount({
      is_read: 0,
      shop_id: shopId,
    });

    return {
      code: 200,
      message: '获取成功',
      data: {
        order_count: orderCount,
        im_msg_count: 0, // TODO: 实现IM消息统计
        unread_msg_count: unreadMsgCount,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: '创建消息' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createMessage(@Body() createDto: CreateAdminMsgDto) {
    const msgId = await this.adminMsgService.createMessage(createDto);

    return {
      code: 200,
      message: '创建成功',
      data: { msg_id: msgId },
    };
  }

  // 工具方法
  private formatTime(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}