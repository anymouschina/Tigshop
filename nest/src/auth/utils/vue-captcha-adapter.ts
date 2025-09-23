/**
 * Vue前端滑块验证码适配器
 * 将后端验证码转换为前端Vue组件需要的格式
 */

export interface VueCaptchaRequest {
  captchaType?: string;
}

export interface VueCaptchaResponse {
  originalImageBase64: string;
  jigsawImageBase64: string;
  token: string;
  secretKey: string;
  captchaType: string;
  repCode: string;
  repMsg: string;
  resultData: {
    originalImageBase64: string;
    jigsawImageBase64: string;
    token: string;
    secretKey: string;
    backToken: string;
  };
}

export interface VueVerifyRequest {
  captchaType?: string;
  pointJson: string;
  token: string;
}

export interface VueVerifyResponse {
  repCode: string;
  repMsg: string;
  resultData: {
    token: string;
    captchaType: string;
  } | null;
}

export class VueCaptchaAdapter {
  /**
   * 获取验证码
   */
  static async getCaptcha(
    params: VueCaptchaRequest = {},
  ): Promise<VueCaptchaResponse> {
    try {
      const response = await fetch("/common/verification/captcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      // 转换为Vue组件需要的格式
      return {
        originalImageBase64: data.originalImageBase64,
        jigsawImageBase64: data.jigsawImageBase64,
        token: data.token,
        secretKey: data.secretKey,
        captchaType: params.captchaType || "blockPuzzle",
        repCode: "0000",
        repMsg: "操作成功",
        resultData: {
          originalImageBase64: data.originalImageBase64,
          jigsawImageBase64: data.jigsawImageBase64,
          token: data.token,
          secretKey: data.secretKey,
          backToken: data.token,
        },
      };
    } catch (error) {
      throw new Error(`获取验证码失败: ${error.message}`);
    }
  }

  /**
   * 验证滑块
   */
  static async verifyCaptcha(
    params: VueVerifyRequest,
  ): Promise<VueVerifyResponse> {
    try {
      const response = await fetch("/common/verification/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      return {
        repCode: data.repCode || "0001",
        repMsg: data.repMsg || "验证失败",
        resultData: data.resultData,
      };
    } catch (error) {
      return {
        repCode: "0001",
        repMsg: "网络错误",
        resultData: null,
      };
    }
  }

  /**
   * 创建加密的pointJson
   */
  static createPointJson(
    x: number,
    y: number = 5.0,
    secretKey?: string,
  ): string {
    const point = { x, y };
    const pointStr = JSON.stringify(point);

    // 如果提供了secretKey，进行AES加密
    if (secretKey) {
      return this.aesEncrypt(pointStr, secretKey);
    }

    return pointStr;
  }

  /**
   * AES加密（与后端实现匹配）
   */
  static aesEncrypt(text: string, secretKey: string): string {
    try {
      // 在Node.js环境中使用crypto模块
      if (typeof require !== "undefined") {
        const crypto = require("crypto");
        return this.aesEncryptNode(text, secretKey, crypto);
      }

      // 在浏览器环境中使用简化版本
      if (typeof window !== "undefined") {
        return this.aesEncryptBrowser(text, secretKey);
      }

      throw new Error("不支持的加密环境");
    } catch (error) {
      console.error("AES加密失败:", error);
      // 降级为Base64编码
      return btoa(text);
    }
  }

  /**
   * 使用Node.js crypto模块进行AES加密
   */
  static aesEncryptNode(text: string, secretKey: string, crypto: any): string {
    const key = Buffer.from(secretKey.padEnd(32, "0").substring(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // 返回 IV + 加密数据
    return iv.toString("base64") + encrypted;
  }

  /**
   * 浏览器环境的简化AES加密（用于测试）
   */
  static aesEncryptBrowser(text: string, secretKey: string): string {
    // 为了简单起见，使用一个固定的IV（实际应该随机生成）
    const iv = "ABCDEFGHIJKLMNOP";
    const ivBase64 = btoa(iv);

    // 模拟加密过程（实际应该使用Web Crypto API）
    // 这里使用一个简单的XOR加密作为演示
    let encrypted = "";
    const key = secretKey.padEnd(32, "0").substring(0, 32);

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }

    const encryptedBase64 = btoa(encrypted);

    return ivBase64 + encryptedBase64;
  }

  /**
   * 计算滑块距离
   */
  static calculateDistance(
    moveLeftDistance: number,
    imgWidth: number = 310,
  ): number {
    const STD_WIDTH = 310;
    return (moveLeftDistance * STD_WIDTH) / imgWidth;
  }

  /**
   * 生成验证令牌
   */
  static generateVerifyToken(
    token: string,
    pointStr: string,
    secretKey?: string,
  ): string {
    const combined = `${token}---${pointStr}`;

    if (secretKey) {
      // 这里应该实现AES加密，暂时返回Base64编码
      return btoa(combined);
    }

    return combined;
  }
}

/**
 * Vue组件使用的验证码API封装
 */
export class VueCaptchaAPI {
  private captchaType: string = "blockPuzzle";
  private token: string = "";
  private secretKey: string = "";

  /**
   * 设置验证码类型
   */
  setCaptchaType(type: string): void {
    this.captchaType = type;
  }

  /**
   * 获取验证码
   */
  async getCaptcha(): Promise<VueCaptchaResponse> {
    const result = await VueCaptchaAdapter.getCaptcha({
      captchaType: this.captchaType,
    });

    this.token = result.token;
    this.secretKey = result.secretKey;

    return result;
  }

  /**
   * 验证滑块
   */
  async verify(
    moveLeftDistance: number,
    imgWidth: number = 310,
  ): Promise<VueVerifyResponse> {
    const distance = VueCaptchaAdapter.calculateDistance(
      moveLeftDistance,
      imgWidth,
    );
    const pointJson = VueCaptchaAdapter.createPointJson(
      distance,
      5.0,
      this.secretKey,
    );

    return VueCaptchaAdapter.verifyCaptcha({
      captchaType: this.captchaType,
      pointJson,
      token: this.token,
    });
  }

  /**
   * 生成验证令牌（用于后端验证）
   */
  generateVerifyToken(
    moveLeftDistance: number,
    imgWidth: number = 310,
  ): string {
    const distance = VueCaptchaAdapter.calculateDistance(
      moveLeftDistance,
      imgWidth,
    );
    const pointStr = JSON.stringify({ x: distance, y: 5.0 });

    return VueCaptchaAdapter.generateVerifyToken(
      this.token,
      pointStr,
      this.secretKey,
    );
  }
}
