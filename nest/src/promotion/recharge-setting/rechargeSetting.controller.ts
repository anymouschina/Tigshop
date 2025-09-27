// @ts-nocheck
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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { RechargeSettingService } from "./rechargeSetting.service";
import {
  CreateRechargeSettingDto,
  UpdateRechargeSettingDto,
  RechargeSettingQueryDto,
  RechargeSettingConfigDto,
} from "./dto/rechargeSetting.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("RechargeSetting Management")
@Controller("promotion/recharge_setting")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RechargeSettingController {
  constructor(
    private readonly rechargeSettingService: RechargeSettingService,
  ) {}

  @Get("list")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "获取充值设置列表" })
  async list(@Query() queryDto: RechargeSettingQueryDto) {
    const result = await this.rechargeSettingService.findAll(queryDto);
    return {
      code: 200,
      msg: "获取成功",
      data: {
        records: result.records,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  @Get("config")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.rechargeSettingService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "获取充值设置详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.rechargeSettingService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "创建充值设置" })
  @ApiBody({ type: CreateRechargeSettingDto })
  async create(@Body() createDto: CreateRechargeSettingDto) {
    const item = await this.rechargeSettingService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "更新充值设置" })
  @ApiBody({ type: UpdateRechargeSettingDto })
  async update(@Body() updateDto: UpdateRechargeSettingDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.rechargeSettingService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: item,
    };
  }

  @Delete("del")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "删除充值设置" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.rechargeSettingService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Roles("rechargeSettingManage")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.rechargeSettingService.batchDelete(body.ids);
      return {
        code: 200,
        msg: "批量删除成功",
      };
    } else {
      return {
        code: 400,
        msg: "操作类型错误",
      };
    }
  }
}
