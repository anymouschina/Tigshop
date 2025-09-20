// @ts-nocheck
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { UserRankLogService } from "./user-rank-log.service";
import {
  CreateUserRankLogDto,
  UpdateUserRankLogDto,
  QueryUserRankLogDto,
} from "./dto/user-rank-log.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";

@ApiTags("用户等级日志管理")
@Controller("admin/user/user-rank-log")
@UseGuards(AdminAuthGuard)
export class UserRankLogController {
  constructor(private readonly userranklogService: UserRankLogService) {}

  @ApiOperation({ summary: "用户等级日志列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryUserRankLogDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.userranklogService.getFilterList(filter);
    const total = await this.userranklogService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "用户等级日志详情" })
  @ApiParam({ name: "id", description: "ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.userranklogService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建用户等级日志" })
  @Post("create")
  async create(@Body() createData: CreateUserRankLogDto) {
    const result = await this.userranklogService.createUserRankLog(createData);
    if (result) {
      return ResponseUtil.success("用户等级日志创建成功");
    } else {
      return ResponseUtil.error("用户等级日志创建失败");
    }
  }

  @ApiOperation({ summary: "更新用户等级日志" })
  @Put("update/:id")
  async update(
    @Param("id") id: number,
    @Body() updateData: UpdateUserRankLogDto,
  ) {
    const result = await this.userranklogService.updateUserRankLog(
      id,
      updateData,
    );
    if (result) {
      return ResponseUtil.success("用户等级日志更新成功");
    } else {
      return ResponseUtil.error("用户等级日志更新失败");
    }
  }

  @ApiOperation({ summary: "删除用户等级日志" })
  @ApiParam({ name: "id", description: "ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.userranklogService.deleteUserRankLog(id);
    return ResponseUtil.success();
  }

  @ApiOperation({ summary: "批量操作" })
  @Post("batch")
  async batch(@Body() batchData: any) {
    if (
      !batchData.ids ||
      !Array.isArray(batchData.ids) ||
      batchData.ids.length === 0
    ) {
      return ResponseUtil.error("未选择项目");
    }

    if (batchData.type === "del") {
      await this.userranklogService.batchDeleteUserRankLog(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "用户等级日志统计" })
  @Get("statistics")
  async statistics() {
    const statistics = await this.userranklogService.getUserRankLogStatistics();
    return ResponseUtil.success(statistics);
  }
}
