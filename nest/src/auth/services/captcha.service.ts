import { Injectable, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(CaptchaService.name);
  private readonly CAPTCHA_TTL = 60; // 秒
  private readonly TOLERANCE = 10; // 减少容差，增加验证严格性
  private readonly MIN_DURATION = 500; // 增加最小滑动时间，防止机器人
  private readonly MAX_DURATION = 30000; // 减少最大滑动时间

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
      offsetY, // 在滑块画布中保持垂直位置
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
    this.logger.debug(`生成验证码数据: ${JSON.stringify(captchaData)}`);
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

    if (!captcha) {
      this.logger.warn(`验证失败: 找不到验证码数据, token: ${token}`);
      return false;
    }

    // 严格验证secretKey
    if (captcha.secretKey !== secretKey) {
      this.logger.warn(
        `验证失败: secretKey不匹配, 期望: ${captcha.secretKey}, 实际: ${secretKey}`,
      );
      return false;
    }

    // 检查验证码是否过期
    const now = Date.now();
    if (now - captcha.createdAt > this.CAPTCHA_TTL * 1000) {
      this.logger.warn(
        `验证失败: 验证码已过期, 创建时间: ${captcha.createdAt}, 当前时间: ${now}`,
      );
      return false;
    }

    // 位置验证 - 使用严格容差
    const positionDiff = Math.abs(x - captcha.offsetX);
    const isValidPosition = positionDiff <= this.TOLERANCE;

    // 如果位置验证失败，不再进行比例转换验证，直接拒绝
    if (!isValidPosition) {
      this.logger.warn(
        `位置验证失败: 前端X=${x}, 后端offsetX=${captcha.offsetX}, 差异=${positionDiff}, 容差=${this.TOLERANCE}`,
      );
      return false;
    }

    // 时间验证 - 必须提供startTime
    if (!startTime) {
      this.logger.warn("时间验证失败: 缺少开始时间");
      return false;
    }

    const duration = now - startTime;
    const isValidTime =
      duration >= this.MIN_DURATION && duration <= this.MAX_DURATION;

    if (!isValidTime) {
      this.logger.warn(
        `时间验证失败: 滑动时间=${duration}ms, 要求范围=${this.MIN_DURATION}-${this.MAX_DURATION}ms`,
      );
      return false;
    }

    // 轨迹验证 - 必须提供有效轨迹
    if (!track || track.length < 5) {
      this.logger.warn(
        `轨迹验证失败: 轨迹数据不足, 长度=${track?.length || 0}`,
      );
      return false;
    }

    // 验证轨迹是否为连续递增（模拟真实滑动）
    let isTrackValid = true;
    for (let i = 1; i < track.length; i++) {
      if (track[i] <= track[i - 1]) {
        isTrackValid = false;
        break;
      }
    }

    if (!isTrackValid) {
      this.logger.warn(
        `轨迹验证失败: 轨迹不是连续递增, ${JSON.stringify(track)}`,
      );
      return false;
    }

    // 验证轨迹距离是否合理
    const trackDistance = track[track.length - 1] - track[0];
    if (Math.abs(trackDistance - x) > this.TOLERANCE * 2) {
      this.logger.warn(
        `轨迹验证失败: 轨迹距离与点击位置不匹配, 轨迹距离=${trackDistance}, 点击位置=${x}`,
      );
      return false;
    }

    // 使用后立即删除
    await this.redisService.del(`captcha:${token}`);

    this.logger.log(
      `滑块验证通过: 位置差异=${positionDiff}, 滑动时间=${duration}ms, 轨迹长度=${track.length}`,
    );
    return true;
  }

  /** 直接验证pointJson - 对齐PHP实现 */
  async verifyPointJson(token: string, pointJson: string): Promise<boolean> {
    // 获取验证码数据
    const captcha = await this.redisService.get<CaptchaData>(
      `captcha:${token}`,
    );

    if (!captcha) {
      this.logger.warn(`验证失败: 找不到验证码数据, token: ${token}`);
      return false;
    }

    // 直接使用前端aesEncrypt方式解密
    let parsedData: any;
    let parseSuccess = false;

    // 只尝试AES解密（前端使用的加密方式）
    try {
      // 使用前端相同的加密逻辑进行解密
      parsedData = parsePointJson(pointJson, captcha.secretKey);
      parseSuccess = true;
      this.logger.debug(`AES解密成功: ${JSON.stringify(parsedData)}`);
    } catch (e) {
      this.logger.warn(`AES解密失败: ${e.message}`);

      // 如果AES解密失败，直接返回失败，不再使用模拟数据
      this.logger.warn("pointJson解密失败，验证失败");
      return false;
    }

    // 使用现有的verifySlider方法进行验证
    const result = await this.verifySlider(
      token,
      parsedData.secretKey || captcha.secretKey,
      parsedData.x || 0,
      parsedData.track || [],
      parsedData.startTime || Date.now(),
    );

    return result;
  }

  /** 生成默认轨迹数据 */
  private generateDefaultTrack(targetX: number): number[] {
    const track: number[] = [];
    const steps = Math.max(5, Math.floor(targetX / 20)); // 根据距离生成步数

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const position = Math.round(targetX * progress);
      track.push(position);
    }

    // 确保最后一个点是目标位置
    if (track.length > 0) {
      track[track.length - 1] = targetX;
    }

    return track;
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
      this.logger.warn("轨迹验证失败: 轨迹为空");
      return false;
    }

    if (track.length < 3) {
      this.logger.warn(`轨迹验证失败: 轨迹长度不足, 长度=${track.length}`);
      return false;
    }

    // 计算轨迹特征
    const points = track.length;
    const firstPoint = track[0];
    const lastPoint = track[track.length - 1];
    const distance = Math.abs(lastPoint - firstPoint);

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

    // 严格验证条件：需要有人类特征
    const isValid = hasBackward || hasAcceleration;

    if (!isValid) {
      this.logger.debug(
        `轨迹验证缺乏人类特征: 回拖=${hasBackward}, 加速=${hasAcceleration}, 点数=${points}, 距离=${distance}`,
      );
    }

    return isValid;
  }
}
