// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { AccountPanelService } from "./account-panel.service";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("账户资金面板")
@Controller("admin/finance/account-panel")
@UseGuards(AdminAuthGuard)
export class AccountPanelController {
  constructor(private readonly accountPanelService: AccountPanelService) {}

  @ApiOperation({ summary: "账户资金面板数据" })
  @ApiQuery({
    name: "search_start_date",
    description: "开始日期",
    required: false,
  })
  @ApiQuery({
    name: "search_end_date",
    description: "结束日期",
    required: false,
  })
  @Get("list")
  async list(@Query() query: any) {
    const filter = {
      search_start_date: query.search_start_date || "",
      search_end_date: query.search_end_date || "",
    };

    const filterResult = await this.accountPanelService.getFilterResult(filter);
    return ResponseUtil.success(filterResult);
  }

  @ApiOperation({ summary: "资金统计" })
  @Get("statistics")
  async statistics() {
    const statistics = await this.accountPanelService.getStatistics();
    return ResponseUtil.success(statistics);
  }

  @ApiOperation({ summary: "资金趋势" })
  @ApiQuery({
    name: "period",
    description: "周期(day/week/month)",
    default: "day",
  })
  @Get("trend")
  async trend(@Query("period") period: string = "day") {
    const trend = await this.accountPanelService.getTrend(period);
    return ResponseUtil.success(trend);
  }

  @ApiOperation({ summary: "账户余额排行" })
  @ApiQuery({ name: "limit", description: "限制数量", default: 10 })
  @Get("balance-rank")
  async balanceRank(@Query("limit") limit: number = 10) {
    const rank = await this.accountPanelService.getBalanceRank(limit);
    return ResponseUtil.success(rank);
  }

  @ApiOperation({ summary: "资金流水明细" })
  @ApiQuery({ name: "start_date", description: "开始日期", required: false })
  @ApiQuery({ name: "end_date", description: "结束日期", required: false })
  @ApiQuery({ name: "type", description: "类型", required: false })
  @ApiQuery({ name: "page", description: "页码", default: 1 })
  @ApiQuery({ name: "size", description: "每页数量", default: 15 })
  @Get("flow-detail")
  async flowDetail(@Query() query: any) {
    const filter = {
      start_date: query.start_date || "",
      end_date: query.end_date || "",
      type: query.type || "",
      page: query.page || 1,
      size: query.size || 15,
    };

    const result = await this.accountPanelService.getFlowDetail(filter);
    return ResponseUtil.success(result);
  }
}
