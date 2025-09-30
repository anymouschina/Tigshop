// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AccountPanelService } from "./account-panel/account-panel.service";

@ApiTags("Admin API - 财务/账户资金面板 兼容")
@Controller("adminapi/finance/accountPanel")
@ApiBearerAuth()
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminAccountPanelCompatController {
  constructor(private readonly service: AccountPanelService) {}

  @Get("list")
  @Authorities("accountPanelManage")
  @ApiOperation({ summary: "账户资金面板数据（admin 兼容）" })
  @ApiQuery({ name: "search_start_date", required: false })
  @ApiQuery({ name: "search_end_date", required: false })
  async list(@Query() query: any) {
    const filter = {
      search_start_date: query.search_start_date ?? query.searchStartDate ?? "",
      search_end_date: query.search_end_date ?? query.searchEndDate ?? "",
    };
    const data = await this.service.getFilterResult(filter);
    return { code: 0, message: "success", data };
  }
}
