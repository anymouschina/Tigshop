/**
 * AES加密解密工具
 * 用于处理前端发送的加密pointJson数据
 */

import * as crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * AES加密
 */
export function aesEncrypt(text: string, secretKey: string): string {
  try {
    // 如果secretKey长度不足32字节，进行填充
    const key = Buffer.from(secretKey.padEnd(32, "0").substring(0, 32));

    // 生成随机IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // 创建加密器
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // 加密
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // 返回 IV + 加密数据
    return iv.toString("base64") + encrypted;
  } catch (error) {
    // // console.error("AES加密失败:", error);
    throw new Error("加密失败");
  }
}

/**
 * AES解密 - 兼容前端crypto-js的ECB模式
 */
export function aesDecrypt(encryptedText: string, secretKey: string): string {
  try {
    // // console.log("🔍 AES解密调试:");
    // // console.log("  - 加密文本长度:", encryptedText.length);
    // // console.log("  - 密钥:", secretKey);

    // 方法1: 尝试ECB模式（前端crypto-js使用的方式）
    try {
      // 前端crypto-js使用的是UTF8编码的密钥，直接使用不填充
      const key = Buffer.from(secretKey, "utf8");

      // 如果密钥不足16字节，填充到16字节（AES-128）
      // 如果密钥超过16字节但不足32字节，填充到32字节（AES-256）
      let finalKey;
      if (key.length < 16) {
        finalKey = Buffer.concat([key, Buffer.alloc(16 - key.length)]);
      } else if (key.length < 32) {
        finalKey = Buffer.concat([key, Buffer.alloc(32 - key.length)]);
      } else {
        finalKey = key.slice(0, 32);
      }

      const algorithm = finalKey.length === 16 ? "aes-128-ecb" : "aes-256-ecb";
      const decipher = crypto.createDecipheriv(
        algorithm,
        finalKey,
        Buffer.alloc(0),
      );

      let decrypted = decipher.update(encryptedText, "base64", "utf8");
      decrypted += decipher.final("utf8");

      // // console.log(`  - ${algorithm}解密成功:`, decrypted);
      return decrypted;
    } catch (error1) {
      // // console.log("  - ECB模式解密失败:", error1.message);
    }

    // 方法2: 尝试标准AES-256-CBC解密 (IV + encrypted data)
    if (encryptedText.length > 24) {
      try {
        const key = Buffer.from(secretKey.padEnd(32, "0").substring(0, 32));
        const iv = Buffer.from(encryptedText.substring(0, 24), "base64");
        const encrypted = encryptedText.substring(24);

        console.log(
          "  - CBC模式 - IV长度:",
          iv.length,
          "加密数据长度:",
          encrypted.length,
        );

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, "base64", "utf8");
        decrypted += decipher.final("utf8");

        // // console.log("  - CBC解密成功:", decrypted);
        return decrypted;
      } catch (error) {
        // // console.log("  - CBC解密失败:", error.message);
      }
    }

    // 方法3: 尝试不带IV的CBC模式
    try {
      const key = Buffer.from(secretKey.padEnd(32, "0").substring(0, 32));
      const iv = Buffer.alloc(16, 0); // 使用零IV
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

      let decrypted = decipher.update(encryptedText, "base64", "utf8");
      decrypted += decipher.final("utf8");

      // // console.log("  - 零IV CBC解密成功:", decrypted);
      return decrypted;
    } catch (error3) {
      // // console.log("  - 零IV CBC解密失败:", error3.message);
    }

    // 方法4: 尝试直接解析（可能是未加密的JSON）
    try {
      const parsed = JSON.parse(encryptedText);
      // // console.log("  - 直接解析成功:", parsed);
      return JSON.stringify(parsed);
    } catch (parseError) {
      // // console.log("  - 直接解析失败:", parseError.message);
    }

    throw new Error("所有解密方法都失败");
  } catch (error) {
    // // console.log("  - AES解密总失败:", error.message);
    throw error;
  }
}

/**
 * 尝试解析pointJson（支持加密和未加密格式）
 */
export function parsePointJson(pointJson: string, secretKey?: string): any {
  try {
    // 方法1: 首先尝试直接解析JSON
    return JSON.parse(pointJson);
  } catch (error) {
    // 如果直接解析失败，尝试其他格式

    // 方法2: 尝试解析简化JSON格式 {x:101,y:50}
    if (!secretKey) {
      try {
        // 尝试解析类似 "{x:101,y:50}" 这样的格式
        const simplifiedJson = pointJson
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // 添加引号到属性名
          .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2'); // 处理未加引号的字符串值

        return JSON.parse(simplifiedJson);
      } catch (e) {
        // 继续尝试其他方法
      }
    }

    // 方法3: 如果提供了secretKey，尝试解密
    if (secretKey) {
      try {
        const decrypted = aesDecrypt(pointJson, secretKey);
        return JSON.parse(decrypted);
      } catch (decryptError) {
        throw new Error("pointJson格式错误或解密失败");
      }
    } else {
      throw new Error("pointJson格式错误");
    }
  }
}
