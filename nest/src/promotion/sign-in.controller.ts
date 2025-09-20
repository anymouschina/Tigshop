// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { SignInService } from "./sign-in.service";
import {
  SignInQueryDto,
  SignInDetailDto,
  CreateSignInDto,
  UpdateSignInDto,
  DeleteSignInDto,
  BatchDeleteSignInDto,
  UserSignInDto,
} from "./dto/sign-in.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("签到管理")
@Controller("admin/sign-in")
@UseGuards(RolesGuard)
@Roles("admin")
export class SignInController {
  constructor(private readonly signInService: SignInService) {}

  @Get()
  @ApiOperation({ summary: "获取签到设置列表" })
  @ApiQuery({ name: "keyword", required: false, description: "关键词" })
  @ApiQuery({ name: "page", required: false, description: "页码" })
  @ApiQuery({ name: "size", required: false, description: "每页数量" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignInList(@Query() query: SignInQueryDto) {
    const [records, total] = await Promise.all([
      this.signInService.getFilterResult(query),
      this.signInService.getFilterCount(query),
    ]);

    return {
      code: 200,
      message: "获取成功",
      data: {
        records,
        total,
      },
    };
  }

  @Get("detail")
  @ApiOperation({ summary: "获取签到设置详情" })
  @ApiQuery({ name: "id", required: true, description: "签到设置ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSignInDetail(@Query() query: SignInDetailDto) {
    const item = await this.signInService.getDetail(query.id);

    return {
      code: 200,
      message: "获取成功",
      data: item,
    };
  }

  @Post()
  @ApiOperation({ summary: "创建签到设置" })
  @ApiResponse({ status: 200, description: "创建成功" })
  async createSignIn(@Body() createDto: CreateSignInDto) {
    const result = await this.signInService.create(createDto);

    return {
      code: 200,
      message: "创建成功",
      data: result,
    };
  }

  @Put()
  @ApiOperation({ summary: "更新签到设置" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateSignIn(@Body() updateDto: UpdateSignInDto) {
    const result = await this.signInService.update(updateDto.id, updateDto);

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  }

  @Delete()
  @ApiOperation({ summary: "删除签到设置" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteSignIn(@Body() deleteDto: DeleteSignInDto) {
    const result = await this.signInService.delete(deleteDto.id);

    if (result) {
      return {
        code: 200,
        message: "删除成功",
      };
    } else {
      return {
        code: 400,
        message: "删除失败",
      };
    }
  }

  @Delete("batch")
  @ApiOperation({ summary: "批量删除签到设置" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async batchDeleteSignIn(@Body() batchDto: BatchDeleteSignInDto) {
    const result = await this.signInService.batchDelete(batchDto.ids);

    if (result) {
      return {
        code: 200,
        message: "删除成功",
      };
    } else {
      return {
        code: 400,
        message: "删除失败",
      };
    }
  }

  // 用户签到接口（这些接口应该放在用户模块，这里临时放在签到管理模块中）
  @Get("user/data")
  @ApiOperation({ summary: "获取用户签到主页数据" })
  @ApiQuery({ name: "user_id", required: true, description: "用户ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserSignData(@Query("user_id") userId: number) {
    const data = await this.signInService.getUserSignData(userId);

    return {
      code: 200,
      message: "获取成功",
      data,
    };
  }

  @Post("user/sign")
  @ApiOperation({ summary: "用户执行签到" })
  @ApiResponse({ status: 200, description: "签到成功" })
  async userSignIn(@Body() signInDto: UserSignInDto) {
    const result = await this.signInService.userSignIn(signInDto.user_id);

    return {
      code: 200,
      message: "签到成功",
      data: result,
    };
  }

  @Get("user/check")
  @ApiOperation({ summary: "检查用户今日是否已签到" })
  @ApiQuery({ name: "user_id", required: true, description: "用户ID" })
  @ApiResponse({ status: 200, description: "检查成功" })
  async checkUserSignIn(@Query("user_id") userId: number) {
    const isSigned = await this.signInService.checkUserSignIn(userId);

    return {
      code: 200,
      message: "检查成功",
      data: {
        is_signed: isSigned,
      },
    };
  }

  @Get("user/count")
  @ApiOperation({ summary: "获取用户签到次数" })
  @ApiQuery({ name: "user_id", required: true, description: "用户ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserSignCount(@Query("user_id") userId: number) {
    const count = await this.signInService.getSignCount(userId);

    return {
      code: 200,
      message: "获取成功",
      data: {
        sign_count: count,
      },
    };
  }
}
