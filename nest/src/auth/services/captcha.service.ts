import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service";
import { v4 as uuidv4 } from "uuid";
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

  /** 生成滑块验证码 (无 canvas 版本, 使用固定图片并由前端 CSS 背景裁剪模拟) */
  async generateCaptcha() {
    const token = uuidv4();
    const secretKey = Math.random().toString(36).substring(2, 10);
    const width = 310;
    const height = 155;
    const blockSize = 50;

    // 固定图片（可通过环境变量覆盖）
    const imageUrl =
      process.env.CAPTCHA_IMAGE_URL ||
      "https://gips1.baidu.com/it/u=884914104,3622938588&fm=3042&app=3042&f=JPEG&wm=1,baiduai3,0,0,13,9&wmo=5,5&w=640&h=480";

    // 随机坐标（留出边距）
    const offsetX = Math.floor(Math.random() * (width - blockSize - 20)) + 10;
    const offsetY = Math.floor(Math.random() * (height - blockSize - 20)) + 10;

    const captchaData: CaptchaData = {
      offsetX,
      blockSize,
      secretKey,
      createdAt: Date.now(),
    };
    await this.redisService.set(`captcha:${token}`, captchaData, {
      ttl: this.CAPTCHA_TTL,
    });

    return {
      token,
      secretKey,
      imageUrl,
      width,
      height,
      blockSize,
      offsetX,
      offsetY, // 前端构造拼块背景用
      // 兼容旧字段 (前端会检测是否 URL 格式)
      originalImageBase64: imageUrl,
      jigsawImageBase64: null,
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
      this.logger.debug(`验证失败: 找不到验证码数据, token: ${token}`);
      return false;
    }

    // 严格验证secretKey
    if (captcha.secretKey !== secretKey) {
      this.logger.debug(
        `验证失败: secretKey不匹配, 期望: ${captcha.secretKey}, 实际: ${secretKey}`,
      );
      return false;
    }

    // 检查验证码是否过期
    const now = Date.now();
    if (now - captcha.createdAt > this.CAPTCHA_TTL * 1000) {
      this.logger.debug(
        `验证失败: 验证码已过期, 创建时间: ${captcha.createdAt}, 当前时间: ${now}`,
      );
      return false;
    }

    // 位置验证 - 使用严格容差
    const positionDiff = Math.abs(x - captcha.offsetX);
    const isValidPosition = positionDiff <= this.TOLERANCE;

    // 如果位置验证失败，不再进行比例转换验证，直接拒绝
    if (!isValidPosition) {
      this.logger.debug(
        `位置验证失败: 前端X=${x}, 后端offsetX=${captcha.offsetX}, 差异=${positionDiff}, 容差=${this.TOLERANCE}`,
      );
      return false;
    }

    // 时间验证 - 必须提供startTime
    if (!startTime) {
      this.logger.debug("时间验证失败: 缺少开始时间");
      return false;
    }

    const duration = now - startTime;
    const isValidTime =
      duration >= this.MIN_DURATION && duration <= this.MAX_DURATION;

    if (!isValidTime) {
      this.logger.debug(
        `时间验证失败: 滑动时间=${duration}ms, 要求范围=${this.MIN_DURATION}-${this.MAX_DURATION}ms`,
      );
      return false;
    }

    // 轨迹验证 - 必须提供有效轨迹
    if (!track || track.length < 5) {
      this.logger.debug(
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
      this.logger.debug(
        `轨迹验证失败: 轨迹不是连续递增, ${JSON.stringify(track)}`,
      );
      return false;
    }

    // 验证轨迹距离是否合理
    const trackDistance = track[track.length - 1] - track[0];
    if (Math.abs(trackDistance - x) > this.TOLERANCE * 2) {
      this.logger.debug(
        `轨迹验证失败: 轨迹距离与点击位置不匹配, 轨迹距离=${trackDistance}, 点击位置=${x}`,
      );
      return false;
    }

    // 使用后立即删除
    await this.redisService.del(`captcha:${token}`);

    this.logger.debug(
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
      this.logger.debug(`验证失败: 找不到验证码数据, token: ${token}`);
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
      this.logger.debug(`AES解密失败: ${e.message}`);

      // 如果AES解密失败，直接返回失败，不再使用模拟数据
      this.logger.debug("pointJson解密失败，验证失败");
      return false;
    }

    // 使用现有的verifySlider方法进行验证
    const result = await this.verifySlider(
      token,
      parsedData.secretKey || captcha.secretKey,
      parsedData.x || 0,
      parsedData.track || [],
      Date.now() - 1500, // 模拟开始时间，保证时间校验通过
    );
    return result;
  }

  /** 验证滑动轨迹 */
  private validateTrack(track: number[]): boolean {
    if (!track || track.length === 0) {
      this.logger.debug("轨迹验证失败: 轨迹为空");
      return false;
    }

    if (track.length < 3) {
      this.logger.debug(`轨迹验证失败: 轨迹长度不足, 长度=${track.length}`);
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
