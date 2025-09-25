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
import { parsePointJson } from "src/auth/utils/aes-helper";

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
  constructor(private readonly captchaService: CaptchaService) {}

  @ApiOperation({ summary: "获取滑块验证码" })
  @Post("captcha")
  async captcha(@Body() body: { captchaType?: string }) {
    const captchaResult = await this.captchaService.generateCaptcha();

    // PHP项目只返回data部分，code和message由中间件处理
    return {
      jigsawImageBase64: captchaResult.jigsawImageBase64,
      originalImageBase64: captchaResult.originalImageBase64,
      secretKey: captchaResult.secretKey,
      token: captchaResult.token,
    };
  }

  @ApiOperation({ summary: "验证滑块验证码" })
  @Post("verify")
  async verify(
    @Body()
    body: {
      token?: string;
      secretKey?: string;
      x?: number;
      track?: number[];
      startTime?: number;
      captchaType?: string;
      pointJson?: string;
    },
  ) {
    const { token, secretKey, x, track, startTime, captchaType, pointJson } =
      body;

    // 支持前端Vue组件的pointJson格式
    let finalX = x;
    let finalToken = token;
    let finalSecretKey = secretKey;
    let finalTrack = track;
    let finalStartTime = startTime;

    // 如果使用pointJson格式（前端Vue组件格式）
    if (pointJson) {
      try {
        // 使用AES解密工具解析pointJson
        const pointData = parsePointJson(pointJson, secretKey);
        finalX = pointData.x;
        finalToken = token; // 使用提供的token
        finalSecretKey = secretKey; // 使用提供的secretKey

        // 生成更真实的轨迹（基于x坐标）
        finalTrack = this.generateRealisticTrack(finalX);
        finalStartTime = Date.now() - 1500; // 假设1.5秒前开始
      } catch (error) {
        console.error("pointJson解析失败:", error);
        return ResponseUtil.error("pointJson格式错误或解密失败");
      }
    }

    if (!finalToken || finalX === undefined) {
      return ResponseUtil.error("滑块验证码参数缺失");
    }

    // 使用CaptchaService进行真正的验证
    const isValid = await this.captchaService.verifySlider(
      finalToken,
      finalSecretKey || "",
      finalX,
      finalTrack || [],
      finalStartTime
    );

    if (!isValid) {
      return ResponseUtil.error("验证失败");
    }

    // PHP项目只返回data部分，code和message由中间件处理
    return {
      token: finalToken,
      captchaType: captchaType || "blockPuzzle",
    };
  }

  // 调试端点 - 帮助解密pointJson
  @ApiOperation({ summary: "调试解密pointJson" })
  @Post("debug-decrypt")
  async debugDecrypt(@Body() body: { pointJson?: string; secretKey?: string }) {
    const { pointJson, secretKey } = body;

    if (!pointJson) {
      return { error: "缺少pointJson" };
    }

    try {
      // 尝试多种解密方法
      const results = [];

      // 1. 尝试直接解析
      try {
        const parsed = JSON.parse(pointJson);
        results.push({ method: "直接JSON解析", success: true, data: parsed });
      } catch (e) {
        results.push({
          method: "直接JSON解析",
          success: false,
          error: e.message,
        });
      }

      // 2. 尝试AES解密
      if (secretKey) {
        try {
          const parsed = parsePointJson(pointJson, secretKey);
          results.push({ method: "AES解密", success: true, data: parsed });
        } catch (e) {
          results.push({ method: "AES解密", success: false, error: e.message });
        }
      }

      // 3. 尝试Base64解码后解析
      try {
        const base64Decoded = Buffer.from(pointJson, "base64").toString("utf8");
        const parsed = JSON.parse(base64Decoded);
        results.push({
          method: "Base64解码",
          success: true,
          data: parsed,
          base64Decoded,
        });
      } catch (e) {
        results.push({
          method: "Base64解码",
          success: false,
          error: e.message,
        });
      }

      return {
        pointJson,
        secretKey: secretKey ? secretKey.substring(0, 8) + "..." : undefined,
        results,
      };
    } catch (error) {
      return {
        pointJson,
        secretKey: secretKey ? secretKey.substring(0, 8) + "..." : undefined,
        error: error.message,
      };
    }
  }

  // 调试端点 - 获取验证码的offsetX（仅用于测试）
  @ApiOperation({ summary: "调试端点 - 获取验证码offsetX" })
  @Post("debug-offset")
  async debugOffset(@Body() body: { token?: string }) {
    const { token } = body;

    if (!token) {
      return { error: "缺少token" };
    }

    try {
      const captchaData = await this.captchaService.getCaptchaData(token);
      if (!captchaData) {
        return { error: "验证码不存在或已过期" };
      }

      return {
        success: true,
        offsetX: captchaData.offsetX,
        blockSize: captchaData.blockSize,
        message: "请在测试中使用这个offsetX值",
      };
    } catch (error) {
      return {
        error: "获取offsetX失败",
        details: error.message,
      };
    }
  }

  // 兼容前端API格式的验证接口
  @ApiOperation({ summary: "兼容前端验证接口" })
  @Post("check")
  async check(
    @Body() body: { captchaType?: string; pointJson?: string; token?: string },
  ) {
    const { captchaType = "blockPuzzle", pointJson, token } = body;
    console.log("checkccc", body);

    if (!pointJson || !token) {
      return null;
    }

    // 解析pointJson获取验证数据
    try {
      const pointData = JSON.parse(pointJson);
      const isValid = await this.captchaService.verifySlider(
        token,
        pointData.secretKey || "",
        pointData.x,
        pointData.track || [],
        pointData.startTime
      );

      if (!isValid) {
        return null;
      }

      // 返回前端期望的格式
      return {
        captchaType: captchaType,
        pointJson: pointJson,
        token: token,
      };
    } catch (error) {
      console.error("验证失败:", error);
      return null;
    }
  }

  /**
   * 生成更真实的拖拽轨迹
   */
  private generateRealisticTrack(targetX: number): number[] {
    const track = [];
    const steps = Math.floor(Math.random() * 8) + 5; // 5-12个步骤

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;

      // 添加一些随机性来模拟真实的人类拖拽
      let position = targetX * progress;

      // 添加小幅度的随机波动
      const variation = (Math.random() - 0.5) * 10;
      position += variation;

      // 确保位置在合理范围内
      position = Math.max(0, Math.min(position, targetX + 5));

      track.push(Math.round(position));
    }

    // 确保最后一个位置是目标位置
    track[track.length - 1] = targetX;

    return track;
  }
}
