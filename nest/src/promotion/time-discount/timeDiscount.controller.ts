import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TimeDiscountService } from './timeDiscount.service';
import {
  CreateTimeDiscountDto,
  UpdateTimeDiscountDto,
  TimeDiscountQueryDto,
  TimeDiscountConfigDto
} from './dto/timeDiscount.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('TimeDiscount Management')
@Controller('promotion/time_discount')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimeDiscountController {
  constructor(private readonly timeDiscountService: TimeDiscountService) {}

  @Get('list')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '获取时段折扣列表' })
  async list(@Query() queryDto: TimeDiscountQueryDto) {
    const result = await this.timeDiscountService.findAll(queryDto);
    return {
      code: 200,
      msg: '获取成功',
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('config')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '获取配置信息' })
  async config() {
    const config = await this.timeDiscountService.getConfig();
    return {
      code: 200,
      msg: '获取成功',
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get('detail')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '获取时段折扣详情' })
  async detail(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    const item = await this.timeDiscountService.findById(itemId);
    return {
      code: 200,
      msg: '获取成功',
      data: item,
    };
  }

  @Post('create')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '创建时段折扣' })
  @ApiBody({ type: CreateTimeDiscountDto })
  async create(@Body() createDto: CreateTimeDiscountDto) {
    const item = await this.timeDiscountService.create(createDto);
    return {
      code: 200,
      msg: '创建成功',
      data: item,
    };
  }

  @Put('update')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '更新时段折扣' })
  @ApiBody({ type: UpdateTimeDiscountDto })
  async update(@Body() updateDto: UpdateTimeDiscountDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.timeDiscountService.update(id, data);
    return {
      code: 200,
      msg: '更新成功',
      data: item,
    };
  }

  @Delete('del')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '删除时段折扣' })
  async delete(@Query('id') id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: '参数错误',
      };
    }

    await this.timeDiscountService.delete(itemId);
    return {
      code: 200,
      msg: '删除成功',
    };
  }

  @Post('batch')
  @Roles('timeDiscountManage')
  @ApiOperation({ summary: '批量操作' })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: '未选择项目',
      };
    }

    if (body.type === 'del') {
      await this.timeDiscountService.batchDelete(body.ids);
      return {
        code: 200,
        msg: '批量删除成功',
      };
    } else {
      return {
        code: 400,
        msg: '操作类型错误',
      };
    }
  }
}
