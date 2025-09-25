import { Injectable } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service";
import { v4 as uuidv4 } from "uuid";
import { createCanvas } from "canvas";
import { parsePointJson } from "../utils/aes-helper";

interface CaptchaData {
  offsetX: number;
  blockSize: number;
  secretKey: string;
  createdAt: number;
}

@Injectable()
export class CaptchaService {
  private readonly CAPTCHA_TTL = 60; // 秒
  private readonly TOLERANCE = 15; // 进一步增大容差，提高兼容性
  private readonly MIN_DURATION = 200; // 最小滑动时间（毫秒）
  private readonly MAX_DURATION = 30000; // 最大滑动时间（毫秒）

  constructor(private readonly redisService: RedisService) {}

  /** 生成滑块验证码 */
  async generateCaptcha() {
    const token = uuidv4();
    const secretKey = Math.random().toString(36).substring(2, 10);

    const width = 310;
    const height = 155;
    const blockSize = 50;

    // 先创建背景画布（包含所有干扰元素）
    const backgroundCanvas = createCanvas(width, height);
    const bgCtx = backgroundCanvas.getContext("2d");

    // 添加背景干扰
    this.addBackgroundNoise(bgCtx, width, height);

    // 随机字符
    const text = Math.random().toString(36).substring(2, 6);
    this.addText(bgCtx, text, width, height);

    // 滑块位置
    const offsetX = Math.floor(Math.random() * (width - blockSize - 20)) + 10;
    const offsetY = Math.floor(Math.random() * (height - blockSize - 20)) + 10;

    // 创建最终显示的背景画布（带挖空）
    const finalCanvas = createCanvas(width, height);
    const finalCtx = finalCanvas.getContext("2d");

    // 复制完整背景
    finalCtx.drawImage(backgroundCanvas, 0, 0);

    // 在最终背景上挖空并添加阴影效果
    this.createHole(finalCtx, offsetX, offsetY, blockSize);

    // 创建滑块图片：保持原图高度，宽度为blockSize
    const sliderCanvas = createCanvas(blockSize, height);
    const sliderCtx = sliderCanvas.getContext("2d");

    // 先用透明背景填充整个滑块画布
    sliderCtx.clearRect(0, 0, blockSize, height);

    // 从完整背景中裁剪滑块部分（只裁剪实际滑块大小的区域）
    sliderCtx.drawImage(
      backgroundCanvas,
      offsetX,
      offsetY,
      blockSize,
      blockSize,
      0,
      offsetY,  // 在滑块画布中保持垂直位置
      blockSize,
      blockSize,
    );

    // 为滑块添加边框（只在实际滑块区域添加）
    sliderCtx.strokeStyle = "#ff0000";
    sliderCtx.lineWidth = 2;
    sliderCtx.strokeRect(0, offsetY, blockSize, blockSize);

    // 保存 Redis
    const captchaData: CaptchaData = {
      offsetX,
      blockSize,
      secretKey,
      createdAt: Date.now(),
    };
    console.log(captchaData, "captchaData");
    await this.redisService.set(`captcha:${token}`, captchaData, {
      ttl: this.CAPTCHA_TTL,
    });

    return {
      originalImageBase64: finalCanvas.toDataURL(),
      jigsawImageBase64: sliderCanvas.toDataURL(),
      token,
      secretKey,
    };
  }

  /** 获取验证码数据 */
  async getCaptchaData(token: string): Promise<CaptchaData | null> {
    return await this.redisService.get<CaptchaData>(`captcha:${token}`);
  }

  /** 校验滑块 */
  async verifySlider(
    token: string,
    secretKey: string,
    x: number,
    track: number[],
    startTime?: number,
  ): Promise<boolean> {
    const captcha = await this.redisService.get<CaptchaData>(
      `captcha:${token}`,
    );
    console.log(captcha, "captcha");
    if (!captcha) {
      console.log("❌ 验证失败: 找不到验证码数据, token:", token);
      return false;
    }

    console.log("🔍 验证调试信息:");
    console.log("  - 前端X坐标:", x);
    console.log("  - 后端offsetX:", captcha.offsetX);
    console.log("  - 容差:", this.TOLERANCE);
    console.log("  - 位置差异:", Math.abs(x - captcha.offsetX));

    // 如果没有提供secretKey或使用默认值，跳过secretKey验证
    if (
      secretKey &&
      secretKey !== "default-secret-key" &&
      captcha.secretKey !== secretKey
    ) {
      console.log("❌ 验证失败: secretKey不匹配");
      return false;
    }

    // 位置验证 - 兼容PHP实现的多重验证策略
    let isValidPosition = Math.abs(x - captcha.offsetX) <= this.TOLERANCE;

    // 如果直接验证失败，尝试比例转换验证（兼容不同前端实现）
    if (!isValidPosition) {
      // 尝试常见的前端显示宽度比例
      const commonDisplayWidths = [500, 800, 1000, 1200];
      for (const displayWidth of commonDisplayWidths) {
        const scaleX = displayWidth / 310; // 310是后端原始宽度
        const adjustedX = Math.round(x / scaleX);
        if (Math.abs(adjustedX - captcha.offsetX) <= this.TOLERANCE) {
          isValidPosition = true;
          console.log(`  - 🔄 比例转换验证成功: 使用${displayWidth}px宽度转换`);
          break;
        }
      }
    }

    console.log("  - 位置验证:", isValidPosition ? "✅ 通过" : "❌ 失败");

    // 时间验证
    const now = Date.now();
    const duration = startTime ? now - startTime : 0;
    const isValidTime =
      duration >= this.MIN_DURATION && duration <= this.MAX_DURATION;
    console.log("  - 滑动时间:", duration, "ms");
    console.log("  - 时间验证:", isValidTime ? "✅ 通过" : "❌ 失败");

    // 轨迹验证 - 兼容PHP实现的宽松验证
    let isValidTrack = this.validateTrack(track);
    console.log("  - 轨迹数据:", track);
    console.log("  - 轨迹验证:", isValidTrack ? "✅ 通过" : "❌ 失败");

    // 如果轨迹验证失败但位置验证通过，且轨迹不为空，则放宽轨迹验证
    if (!isValidTrack && isValidPosition && track && track.length > 0) {
      isValidTrack = true;
      console.log("  - 🔄 轨迹验证放宽: 位置正确且有轨迹数据");
    }

    // 使用后立即删除
    await this.redisService.del(`captcha:${token}`);

    const finalResult = isValidPosition && isValidTime && isValidTrack;
    console.log("  - 最终结果:", finalResult ? "✅ 通过" : "❌ 失败");

    return finalResult;
  }

  /** 直接验证pointJson - 对齐PHP实现 */
  async verifyPointJson(
    token: string,
    pointJson: string,
  ): Promise<boolean> {
    console.log("开始验证pointJson:", pointJson);

    // 获取验证码数据
    const captcha = await this.redisService.get<CaptchaData>(
      `captcha:${token}`,
    );

    if (!captcha) {
      console.log("❌ 验证失败: 找不到验证码数据, token:", token);
      return false;
    }

    console.log("🔍 pointJson验证调试信息:");
    console.log("  - 验证码数据:", captcha);
    console.log("  - pointJson:", pointJson);

    // 尝试解析pointJson，支持多种格式
    let parsedData: any;
    let parseSuccess = false;

    // 方法1: 尝试直接JSON解析
    try {
      parsedData = JSON.parse(pointJson);
      parseSuccess = true;
      console.log("✅ 直接JSON解析成功");
    } catch (e) {
      console.log("❌ 直接JSON解析失败:", e.message);
    }

    // 方法2: 如果失败，尝试AES解密
    if (!parseSuccess) {
      try {
        parsedData = parsePointJson(pointJson, captcha.secretKey);
        parseSuccess = true;
        console.log("✅ AES解密解析成功");
      } catch (e) {
        console.log("❌ AES解密解析失败:", e.message);
      }
    }

    // 方法3: 尝试Base64解码后JSON解析
    if (!parseSuccess) {
      try {
        const base64Decoded = Buffer.from(pointJson, "base64").toString("utf8");
        parsedData = JSON.parse(base64Decoded);
        parseSuccess = true;
        console.log("✅ Base64解码后JSON解析成功");
      } catch (e) {
        console.log("❌ Base64解码后JSON解析失败:", e.message);
      }
    }

    if (!parseSuccess) {
      console.log("❌ 所有解析方法都失败");
      return false;
    }

    console.log("✅ 解析成功，数据:", parsedData);

    // 使用现有的verifySlider方法进行验证
    return this.verifySlider(
      token,
      parsedData.secretKey || captcha.secretKey,
      parsedData.x || 0,
      parsedData.track || [],
      parsedData.startTime || Date.now()
    );
  }

  /** 添加背景干扰 */
  private addBackgroundNoise(ctx: any, width: number, height: number) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#e6f3ff");
    gradient.addColorStop(1, "#b3d9ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 添加干扰线
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.3)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
      );
      ctx.stroke();
    }

    // 添加干扰点
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  /** 添加文本 */
  private addText(ctx: any, text: string, width: number, height: number) {
    ctx.fillStyle = "#333";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 文本阴影
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(text, width / 2, height / 2);

    // 重置阴影
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /** 创建挖空效果 */
  private createHole(ctx: any, x: number, y: number, size: number) {
    // 先挖空
    ctx.clearRect(x, y, size, size);

    // 创建半透明覆盖层
    const overlayCanvas = createCanvas(size, size);
    const overlayCtx = overlayCanvas.getContext("2d");

    // 添加半透明白色背景
    overlayCtx.fillStyle = "rgba(255, 255, 255, 0.3)";
    overlayCtx.fillRect(0, 0, size, size);

    // 添加边框
    overlayCtx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeRect(0, 0, size, size);

    // 添加内部阴影效果
    const gradient = overlayCtx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "rgba(200, 200, 200, 0.2)");
    overlayCtx.fillStyle = gradient;
    overlayCtx.fillRect(2, 2, size - 4, size - 4);

    // 将覆盖层绘制到最终画布上
    ctx.drawImage(overlayCanvas as any, x, y);
  }

  /** 验证滑动轨迹 */
  private validateTrack(track: number[]): boolean {
    if (!track || track.length === 0) {
      console.log("  - 轨迹验证失败: 轨迹为空");
      return false;
    }

    console.log("  - 轨迹长度:", track.length);

    // 简化轨迹验证，只要有轨迹就通过
    if (track.length >= 3) {
      console.log("  - 轨迹验证: ✅ 通过 (长度足够)");
      return true;
    }

    // 计算轨迹特征
    const points = track.length;
    const firstPoint = track[0];
    const lastPoint = track[track.length - 1];
    const distance = Math.abs(lastPoint - firstPoint);

    console.log("  - 轨迹距离:", distance);

    // 验证轨迹是否连续
    let hasBackward = false;
    let hasAcceleration = false;

    for (let i = 1; i < track.length - 1; i++) {
      const prev = track[i - 1];
      const curr = track[i];
      const next = track[i + 1];

      // 检测是否有回拖（人类的特征）
      if ((curr - prev) * (next - curr) < 0) {
        hasBackward = true;
      }

      // 检测是否有加速（人类的特征）
      if (Math.abs(next - curr) > Math.abs(curr - prev) * 1.2) {
        hasAcceleration = true;
      }
    }

    // 放宽验证条件
    const isValid =
      hasBackward || hasAcceleration || points > 5 || distance > 50;
    console.log(
      "  - 轨迹验证:",
      isValid ? "✅ 通过" : "❌ 失败",
      `回拖:${hasBackward}, 加速:${hasAcceleration}, 点数:${points}, 距离:${distance}`,
    );

    return isValid;
  }
}
