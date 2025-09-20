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
import { ShippingTplService } from "./shippingTpl.service";
import {
  CreateShippingTplDto,
  UpdateShippingTplDto,
  ShippingTplQueryDto,
  ShippingTplConfigDto,
} from "./dto/shippingTpl.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

@ApiTags("ShippingTpl Management")
@Controller("setting/shipping_tpl")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShippingTplController {
  constructor(private readonly shippingTplService: ShippingTplService) {}

  @Get("list")
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "获取运费模板列表" })
  async list(@Query() queryDto: ShippingTplQueryDto) {
    const result = await this.shippingTplService.findAll(queryDto);
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
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "获取配置信息" })
  async config() {
    const config = await this.shippingTplService.getConfig();
    return {
      code: 200,
      msg: "获取成功",
      data: {
        status_config: config.statusConfig,
      },
    };
  }

  @Get("detail")
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "获取运费模板详情" })
  async detail(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    const item = await this.shippingTplService.findById(itemId);
    return {
      code: 200,
      msg: "获取成功",
      data: item,
    };
  }

  @Post("create")
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "创建运费模板" })
  @ApiBody({ type: CreateShippingTplDto })
  async create(@Body() createDto: CreateShippingTplDto) {
    const item = await this.shippingTplService.create(createDto);
    return {
      code: 200,
      msg: "创建成功",
      data: item,
    };
  }

  @Put("update")
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "更新运费模板" })
  @ApiBody({ type: UpdateShippingTplDto })
  async update(@Body() updateDto: UpdateShippingTplDto & { id: number }) {
    const { id, ...data } = updateDto;

    const item = await this.shippingTplService.update(id, data);
    return {
      code: 200,
      msg: "更新成功",
      data: item,
    };
  }

  @Delete("del")
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "删除运费模板" })
  async delete(@Query("id") id: string) {
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return {
        code: 400,
        msg: "参数错误",
      };
    }

    await this.shippingTplService.delete(itemId);
    return {
      code: 200,
      msg: "删除成功",
    };
  }

  @Post("batch")
  @Roles("shippingTplManage")
  @ApiOperation({ summary: "批量操作" })
  async batch(@Body() body: { type: string; ids: number[] }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        code: 400,
        msg: "未选择项目",
      };
    }

    if (body.type === "del") {
      await this.shippingTplService.batchDelete(body.ids);
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
