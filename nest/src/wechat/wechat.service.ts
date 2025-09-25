// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom, map } from "rxjs";
import { PrismaService } from "src/prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
@Injectable()
export class WechatService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    this.logger = new Logger(WechatService.name);
  }

  /**
   * 获取小程序全局接口调用凭据
   * @returns 返回access_token
   */
  private async getAccessToken(): Promise<string> {
    const appId = this.configService.get<string>("WECHAT_APP_ID");
    const appSecret = this.configService.get<string>("WECHAT_APP_SECRET");

    if (!appId || !appSecret) {
      this.logger.debug("WeChat configuration is missing");
      throw new InternalServerErrorException("WeChat configuration is missing");
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

      this.logger.debug(`Requesting access token from: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          map((res) => res.data),
          catchError((error) => {
            this.logger.debug(
              `Failed to get WeChat access token: ${error.message}`,
            );
            throw new BadRequestException("Failed to get WeChat access token");
          }),
        ),
      );

      if (response.errcode) {
        this.logger.debug(`WeChat API error: ${response.errmsg}`);
        throw new BadRequestException(`WeChat API error: ${response.errmsg}`);
      }

      this.logger.debug("Successfully got access token");
      return response.access_token as string;
    } catch (error) {
      this.logger.debug(`Failed to get access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成小程序跳转二维码
   * @param page 小程序页面路径
   * @param scene 场景参数，最大32个可见字符
   * @param width 二维码宽度，单位像素
   * @param envVersion 小程序环境版本，默认为正式版 release
   * @returns 返回二维码图片Buffer
   */
  async generateMiniProgramQrCode(
    page: string,
    scene: string,
    width: number = 430,
    envVersion: "release" | "trial" | "develop" = "release",
  ): Promise<Buffer> {
    try {
      this.logger.debug(
        `Generating QR code for page: ${page}, scene: ${scene}, width: ${width}, envVersion: ${envVersion}`,
      );

      // 获取接口调用凭证
      const accessToken = await this.getAccessToken();

      const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

      // 检查scene长度，微信限制最大32个可见字符
      if (scene.length > 32) {
        this.logger.debug(
          `Scene parameter exceeds 32 characters limit: ${scene}`,
        );
        throw new BadRequestException(
          "Scene parameter exceeds 32 characters limit",
        );
      }

      // 发送请求参数
      const data = {
        page,
        scene,
        check_path: false,
        env_version: envVersion,
      };

      this.logger.debug(
        `Requesting QR code with data: ${JSON.stringify(data)} ${url}`,
      );

      // 发送请求获取二维码图片
      const response = await firstValueFrom(
        this.httpService
          .post(url, data, {
            responseType: "arraybuffer",
          })
          .pipe(
            catchError((error) => {
              this.logger.debug(`Failed to generate QR code: ${error.message}`);
              throw new BadRequestException("Failed to generate QR code");
            }),
          ),
      );
      this.logger.debug(`response.data ${response.data}`);
      // 微信返回的图片是二进制流
      const buffer = Buffer.from(response.data as ArrayBuffer);

      // 检查返回结果是否为JSON格式错误信息
      try {
        const errorText = buffer.toString();
        const errorJson = JSON.parse(errorText);
        if (errorJson.errcode) {
          this.logger.debug(`WeChat API error: ${errorJson.errmsg}`);
          throw new BadRequestException(
            `WeChat API error: ${errorJson.errmsg}`,
          );
        }
      } catch (e) {
        // 不是JSON格式，说明返回的是正常的图片二进制数据
        this.logger.debug("QR code generated successfully");
      }

      return buffer;
    } catch (error) {
      this.logger.debug(
        `Failed to generate mini program QR code: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 保存二维码到服务器并返回访问URL
   * @param qrCodeBuffer 二维码图片Buffer
   * @param scene 场景参数，用于生成唯一文件名
   * @returns 返回二维码访问URL
   */
  async saveQrCodeAndGetUrl(
    qrCodeBuffer: Buffer,
    scene: string,
  ): Promise<string> {
    try {
      // 确保存储目录存在
      const uploadDir = path.join(process.cwd(), "uploads", "qrcodes");
      if (!fs.existsSync(uploadDir)) {
        this.logger.debug(`Creating directory: ${uploadDir}`);
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 创建唯一文件名
      const filename = `qrcode_${scene}_${Date.now()}.jpg`;
      const filePath = path.join(uploadDir, filename);

      this.logger.debug(`Saving QR code to: ${filePath}`);

      // 写入文件
      fs.writeFileSync(filePath, qrCodeBuffer);

      // 返回访问URL
      const baseUrl =
        process.env.API_BASE_URL ||
        `http://localhost:${process.env.PORT || 3000}`;
      const qrCodeUrl = `${baseUrl}/uploads/qrcodes/${filename}`;

      this.logger.debug(`QR code saved, accessible at: ${qrCodeUrl}`);

      return qrCodeUrl;
    } catch (error) {
      this.logger.debug(`Failed to save QR code: ${error.message}`);
      throw new InternalServerErrorException("Failed to save QR code");
    }
  }
}
