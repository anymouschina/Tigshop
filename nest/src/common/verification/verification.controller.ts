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
import { VerificationService } from "./verification.service";
import {
  CreateVerificationDto,
  UpdateVerificationDto,
  QueryVerificationDto,
} from "./dto/verification.dto";
import { AdminAuthGuard } from "../../../common/guards/admin-auth.guard";
import { ResponseUtil } from "../../../common/utils/response.util";
import { CaptchaService } from "src/auth/services/captcha.service";
import * as svgCaptcha from 'svg-captcha';

@ApiTags("验证码管理")
@Controller("admin/common/verification")
@UseGuards(AdminAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @ApiOperation({ summary: "验证码列表" })
  @ApiQuery({ name: "keyword", description: "关键词", required: false })
  @ApiQuery({ name: "page", description: "页码", required: false })
  @ApiQuery({ name: "size", description: "每页数量", required: false })
  @ApiQuery({ name: "sort_field", description: "排序字段", required: false })
  @ApiQuery({ name: "sort_order", description: "排序方式", required: false })
  @Get("list")
  async list(@Query() query: QueryVerificationDto) {
    const filter = {
      keyword: query.keyword || "",
      page: query.page || 1,
      size: query.size || 15,
      sort_field: query.sort_field || "id",
      sort_order: query.sort_order || "desc",
    };

    const filterResult = await this.verificationService.getFilterList(filter);
    const total = await this.verificationService.getFilterCount(filter);

    return ResponseUtil.success({
      records: filterResult,
      total: total,
    });
  }

  @ApiOperation({ summary: "验证码详情" })
  @ApiParam({ name: "id", description: "ID" })
  @Get("detail/:id")
  async detail(@Param("id") id: number) {
    const item = await this.verificationService.getDetail(id);
    return ResponseUtil.success(item);
  }

  @ApiOperation({ summary: "创建验证码" })
  @Post("create")
  async create(@Body() createData: CreateVerificationDto) {
    const result =
      await this.verificationService.createVerification(createData);
    if (result) {
      return ResponseUtil.success("验证码创建成功");
    } else {
      return ResponseUtil.error("验证码创建失败");
    }
  }

  @ApiOperation({ summary: "更新验证码" })
  @Put("update/:id")
  async update(
    @Param("id") id: number,
    @Body() updateData: UpdateVerificationDto,
  ) {
    const result = await this.verificationService.updateVerification(
      id,
      updateData,
    );
    if (result) {
      return ResponseUtil.success("验证码更新成功");
    } else {
      return ResponseUtil.error("验证码更新失败");
    }
  }

  @ApiOperation({ summary: "删除验证码" })
  @ApiParam({ name: "id", description: "ID" })
  @Delete("del/:id")
  async del(@Param("id") id: number) {
    await this.verificationService.deleteVerification(id);
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
      await this.verificationService.batchDeleteVerification(batchData.ids);
      return ResponseUtil.success();
    } else {
      return ResponseUtil.error("#type 错误");
    }
  }

  @ApiOperation({ summary: "验证码统计" })
  @Get("statistics")
  async statistics() {
    const statistics =
      await this.verificationService.getVerificationStatistics();
    return ResponseUtil.success(statistics);
  }
}

@ApiTags("公共验证码")
@Controller("common/verification")
export class PublicVerificationController {
  constructor(
    private readonly captchaService: CaptchaService,
  ) {}

  @ApiOperation({ summary: "获取验证码" })
  @Post("captcha")
  async captcha() {
    // Generate SVG captcha
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1i', // 忽略容易混淆的字符
      noise: 3, // 干扰线数量
      color: true, // 彩色验证码
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
      fontSize: 32,
    });

    // 生成验证码key
    const captchaKey = Math.random().toString(36).substring(2, 15);

    // 存储验证码答案 (在实际应用中，这应该存储在Redis中)
    // 这里我们暂时使用内存存储，生产环境应该使用Redis
    const captchaData = {
      text: captcha.text,
      expires: Date.now() + 300000, // 5分钟过期
    };

    // 使用captchaService存储验证码
    this.captchaService['captchaStorage'] = this.captchaService['captchaStorage'] || new Map();
    this.captchaService['captchaStorage'].set(captchaKey, captchaData);

    // 将SVG转换为base64
    const base64Image = Buffer.from(captcha.data).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Image}`;

    return ResponseUtil.success({
      captcha_key: captchaKey,
      captcha_image: dataUrl,
      expires_in: 300,
    });
  }

  @ApiOperation({ summary: "验证验证码" })
  @Post("verify")
  async verify(@Body() body: { captcha_key: string; captcha_code: string }) {
    const { captcha_key, captcha_code } = body;

    // 从存储中获取验证码数据
    const captchaStorage = this.captchaService['captchaStorage'] as Map<string, any>;
    const storedCaptcha = captchaStorage?.get(captcha_key);

    if (!storedCaptcha) {
      return ResponseUtil.error("验证码不存在或已过期");
    }

    // 检查验证码是否过期
    if (Date.now() > storedCaptcha.expires) {
      captchaStorage.delete(captcha_key);
      return ResponseUtil.error("验证码已过期");
    }

    // 验证码不区分大小写
    const isValid = storedCaptcha.text.toLowerCase() === captcha_code.toLowerCase();

    // 验证后删除存储的验证码（一次性使用）
    captchaStorage.delete(captcha_key);

    if (isValid) {
      return ResponseUtil.success("验证码正确");
    } else {
      return ResponseUtil.error("验证码错误");
    }
  }
}
