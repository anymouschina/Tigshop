// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { CommonConfigService } from "./config.service";
import { Public } from "../../auth/decorators/public.decorator";

@ApiTags("通用-配置接口")
@Controller("/api/common/config")
export class CommonConfigController {
  constructor(private readonly commonConfigService: CommonConfigService) {}

  // 对齐 PHP：/api/common/config/base （与 initConfigSettings 等价）
  @Get("base")
  @Public()
  @ApiOperation({ summary: "获取基础配置（别名：base）" })
  async getBase() {
    return this.commonConfigService.getInitConfigSettings();
  }

  @Get("themeSettings")
  @ApiOperation({ summary: "获取主题设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getThemeSettings() {
    // 从数据库获取主题设置
    return this.commonConfigService.getThemeSettings();
  }

  @Get("initConfigSettings")
  @ApiOperation({ summary: "获取初始化配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getInitConfigSettings() {
    // 从数据库获取初始化配置
    return this.commonConfigService.getInitConfigSettings();
  }

  @Get("mobileAreaCode")
  @ApiOperation({ summary: "获取手机区号配置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getMobileAreaCode() {
    // 从数据库获取手机区号配置
    return this.commonConfigService.getMobileAreaCode();
  }

  // 对齐 PHP：/api/common/config/afterSalesService
  @Get("afterSalesService")
  @Public()
  @ApiOperation({ summary: "获取售后服务政策（公共配置）" })
  async getAfterSalesService() {
    // 复用 product/product/afterSalesService 的内容，保持前端契约路径
    return this.commonConfigService.getAfterSalesService?.() ?? {
      policy: {
        title: "售后服务政策",
        content: "7天无理由退换货，15天质量问题换货，30天质量问题维修",
      },
      process: [
        { step: 1, title: "申请售后", description: "在订单详情页申请售后服务" },
        { step: 2, title: "审核处理", description: "客服审核售后申请" },
        { step: 3, title: "寄回商品", description: "按照要求寄回商品" },
        { step: 4, title: "处理完成", description: "完成售后处理" },
      ],
      contact: {
        phone: "400-123-4567",
        email: "service@example.com",
        time: "周一至周日 9:00-21:00",
      },
      faq: [
        {
          question: "如何申请退换货？",
          answer: "在订单详情页点击申请售后，填写相关信息即可",
        },
        {
          question: "退换货需要什么条件？",
          answer: "商品完好，包装齐全，不影响二次销售",
        },
      ],
    };
  }

  // Placeholder for future POST methods
  // @Post("themeSettings")
  // @Post("initConfigSettings")
}
