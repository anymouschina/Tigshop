import { Injectable } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service";
import { v4 as uuidv4 } from "uuid";
import { createCanvas } from "canvas";

interface CaptchaData {
  offsetX: number;
  blockSize: number;
  secretKey: string;
  createdAt: number;
}

@Injectable()
export class CaptchaService {
  private readonly CAPTCHA_TTL = 60; // 秒
  private readonly TOLERANCE = 5;

  constructor(private readonly redisService: RedisService) {}

  /** 生成滑块验证码 */
  async generateCaptcha() {
    const token = uuidv4();
    const secretKey = Math.random().toString(36).substring(2, 10);

    const width = 310;
    const height = 155;
    const blockSize = 50;

    // 背景画布
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 背景色
    ctx.fillStyle = '#ccf2ff';
    ctx.fillRect(0, 0, width, height);

    // 随机字符
    const text = Math.random().toString(36).substring(2, 6);
    ctx.fillStyle = '#333';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    // 滑块位置
    const offsetX = Math.floor(Math.random() * (width - blockSize - 10)) + 5;
    const offsetY = Math.floor(Math.random() * (height - blockSize - 10)) + 5;

    // 裁剪滑块
    const sliderCanvas = createCanvas(blockSize, blockSize);
    const sliderCtx = sliderCanvas.getContext('2d');
    sliderCtx.drawImage(canvas, offsetX, offsetY, blockSize, blockSize, 0, 0, blockSize, blockSize);

    // 在背景上挖空（透明）
    ctx.clearRect(offsetX, offsetY, blockSize, blockSize);

    // 保存 Redis
    const captchaData: CaptchaData = { offsetX, blockSize, secretKey, createdAt: Date.now() };
    await this.redisService.set(`captcha:${token}`, captchaData, { ttl: this.CAPTCHA_TTL });

    return {
      originalImageBase64: canvas.toDataURL(),
      jigsawImageBase64: sliderCanvas.toDataURL(),
      token,
      secretKey,
    };
  }

  /** 校验滑块 */
  async verifySlider(token: string, secretKey: string, x: number, track: number[]): Promise<boolean> {
    const captcha = await this.redisService.get<CaptchaData>(`captcha:${token}`);
    if (!captcha || captcha.secretKey !== secretKey) return false;

    const isValidPosition = Math.abs(x - captcha.offsetX) <= this.TOLERANCE;
    const isValidTrack = this.validateTrack(track);

    await this.redisService.del(`captcha:${token}`);
    return isValidPosition && isValidTrack;
  }

  private validateTrack(track: number[]): boolean {
    return track && track.length >= 3;
  }
}
