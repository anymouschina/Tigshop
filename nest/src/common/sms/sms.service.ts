// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /**
   * 发送短信验证码
   * @param mobile 手机号
   * @param event 事件类型（register, login, forget等）
   * @returns 发送结果
   */
  async sendCode(mobile: string, event: string): Promise<boolean> {
    try {
      // TODO: 实现实际的短信发送逻辑
      // 这里可以集成第三方短信服务如阿里云、腾讯云等

      this.logger.log(`SMS code sent to ${mobile} for event: ${event}`);

      // 模拟发送成功
      return true;
    } catch (error) {
      this.logger.error('Failed to send SMS code:', error);
      return false;
    }
  }

  /**
   * 验证短信验证码
   * @param mobile 手机号
   * @param code 验证码
   * @param event 事件类型
   * @returns 验证结果
   */
  async verifyCode(mobile: string, code: string, event: string): Promise<boolean> {
    try {
      // TODO: 实现验证码验证逻辑
      // 这里应该检查缓存中的验证码是否匹配

      this.logger.log(`SMS code verified for ${mobile}, code: ${code}, event: ${event}`);

      // 模拟验证成功
      return true;
    } catch (error) {
      this.logger.error('Failed to verify SMS code:', error);
      return false;
    }
  }
}