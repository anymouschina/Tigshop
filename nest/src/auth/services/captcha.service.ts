import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CaptchaService {
  private readonly attempts = new Map<string, { count: number; expires: number }>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly ATTEMPT_TTL = 120; // 2 minutes

  async verify(
    tag: string,
    token?: string,
    allowNoCheckTimes: number = this.MAX_ATTEMPTS,
  ): Promise<boolean> {
    const attemptKey = `accessTimes:${tag}`;
    const attempts = this.getAttempts(attemptKey);

    if (attempts <= allowNoCheckTimes) {
      await this.incrementAttempts(attemptKey);
      return true;
    }

    if (!token) {
      throw new BadRequestException('需要行为验证');
    }

    // Here you would validate the captcha token against a real captcha service
    // For now, we'll simulate it
    return this.validateCaptchaToken(token);
  }

  private getAttempts(tag: string): number {
    const attemptData = this.attempts.get(tag);

    if (!attemptData) {
      return 0;
    }

    if (Date.now() > attemptData.expires) {
      this.attempts.delete(tag);
      return 0;
    }

    return attemptData.count;
  }

  private async incrementAttempts(tag: string): Promise<void> {
    const currentAttempts = this.getAttempts(tag);
    const expires = Date.now() + (this.ATTEMPT_TTL * 1000);

    this.attempts.set(tag, {
      count: currentAttempts + 1,
      expires,
    });
  }

  private validateCaptchaToken(token: string): boolean {
    // In a real implementation, you would validate against a captcha service
    // For now, accept any non-empty token as valid
    return token && token.length > 0;
  }

  async trackFailedLogin(username: string): Promise<number> {
    const tag = `userSignin:${username}`;
    return this.getAttempts(tag);
  }

  async requiresCaptcha(username: string): Promise<boolean> {
    const tag = `userSignin:${username}`;
    return this.getAttempts(tag) > this.MAX_ATTEMPTS;
  }
}