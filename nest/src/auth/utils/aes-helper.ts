/**
 * AES加密解密工具
 * 用于处理前端发送的加密pointJson数据
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * AES加密
 */
export function aesEncrypt(text: string, secretKey: string): string {
  try {
    // 如果secretKey长度不足32字节，进行填充
    const key = Buffer.from(secretKey.padEnd(32, '0').substring(0, 32));

    // 生成随机IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // 创建加密器
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // 加密
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // 返回 IV + 加密数据
    return iv.toString('base64') + encrypted;
  } catch (error) {
    console.error('AES加密失败:', error);
    throw new Error('加密失败');
  }
}

/**
 * AES解密
 */
export function aesDecrypt(encryptedText: string, secretKey: string): string {
  try {
    console.log('🔍 AES解密调试:');
    console.log('  - 加密文本长度:', encryptedText.length);
    console.log('  - 密钥:', secretKey);

    // 首先尝试标准的AES-256-CBC解密
    const key = Buffer.from(secretKey.padEnd(32, '0').substring(0, 32));
    const iv = Buffer.from(encryptedText.substring(0, 24), 'base64');
    const encrypted = encryptedText.substring(24);

    console.log('  - IV长度:', iv.length, 'IV:', iv.toString('base64'));
    console.log('  - 加密数据长度:', encrypted.length);
    console.log('  - Key:', key.toString('hex'));

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    console.log('  - 解密成功:', decrypted);

    return decrypted;
  } catch (error) {
    console.log('  - CBC解密失败:', error.message);

    // 如果标准解密失败，尝试其他方法
    try {
      // 尝试ECB模式（有些实现使用ECB）
      const key = Buffer.from(secretKey.padEnd(32, '0').substring(0, 32));
      const decipher = crypto.createDecipheriv('aes-256-ecb', key, Buffer.alloc(0));

      let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      console.log('  - ECB解密成功:', decrypted);
      return decrypted;
    } catch (error2) {
      console.log('  - ECB解密失败:', error2.message);

      // 如果解密失败，尝试直接解析（可能是未加密的）
      try {
        const parsed = JSON.parse(encryptedText);
        console.log('  - 直接解析成功:', parsed);
        return JSON.stringify(parsed);
      } catch (parseError) {
        console.log('  - 所有解密方法都失败');
        throw new Error('解密失败');
      }
    }
  }
}

/**
 * 尝试解析pointJson（支持加密和未加密格式）
 */
export function parsePointJson(pointJson: string, secretKey?: string): any {
  try {
    // 首先尝试直接解析JSON
    return JSON.parse(pointJson);
  } catch (error) {
    // 如果直接解析失败，且提供了secretKey，尝试解密
    if (secretKey) {
      try {
        const decrypted = aesDecrypt(pointJson, secretKey);
        return JSON.parse(decrypted);
      } catch (decryptError) {
        throw new Error('pointJson格式错误或解密失败');
      }
    } else {
      throw new Error('pointJson格式错误');
    }
  }
}