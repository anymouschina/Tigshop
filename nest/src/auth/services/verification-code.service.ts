// @ts-nocheck
import { Injectable, BadRequestException, Logger } from "@nestjs/common";

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);
  // In-memory storage for verification codes (use Redis in production)
  private readonly mobileCodes = new Map<
    string,
    { code: string; expires: number }
  >();
  private readonly emailCodes = new Map<
    string,
    { code: string; expires: number }
  >();
  private readonly MOBILE_CODE_EXPIRY = 120; // 2 minutes
  private readonly EMAIL_CODE_EXPIRY = 300; // 5 minutes

  /**
   * Generate and store mobile verification code
   */
  async generateMobileCode(mobile: string): Promise<string> {
    const code = this.generateCode();
    const expires = Date.now() + this.MOBILE_CODE_EXPIRY * 1000;

    this.mobileCodes.set(mobile, { code, expires });

    // TODO: Send SMS with verification code
    this.logger.debug(`Mobile verification code for ${mobile}: ${code}`);

    return code;
  }

  /**
   * Generate and store email verification code
   */
  async generateEmailCode(email: string): Promise<string> {
    const code = this.generateCode();
    const expires = Date.now() + this.EMAIL_CODE_EXPIRY * 1000;

    this.emailCodes.set(email, { code, expires });

    // TODO: Send email with verification code
    this.logger.debug(`Email verification code for ${email}: ${code}`);

    return code;
  }

  /**
   * Validate mobile verification code
   */
  async validateMobileCode(mobile: string, code: string): Promise<boolean> {
    const stored = this.mobileCodes.get(mobile);

    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expires) {
      this.mobileCodes.delete(mobile);
      return false;
    }

    const isValid = stored.code === code;
    if (isValid) {
      this.mobileCodes.delete(mobile); // Remove after validation
    }

    return isValid;
  }

  /**
   * Validate email verification code
   */
  async validateEmailCode(email: string, code: string): Promise<boolean> {
    const stored = this.emailCodes.get(email);

    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expires) {
      this.emailCodes.delete(email);
      return false;
    }

    const isValid = stored.code === code;
    if (isValid) {
      this.emailCodes.delete(email); // Remove after validation
    }

    return isValid;
  }

  /**
   * Generate 6-digit verification code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired codes
   */
  cleanupExpiredCodes(): void {
    const now = Date.now();

    // Clean mobile codes
    for (const [mobile, stored] of this.mobileCodes.entries()) {
      if (now > stored.expires) {
        this.mobileCodes.delete(mobile);
      }
    }

    // Clean email codes
    for (const [email, stored] of this.emailCodes.entries()) {
      if (now > stored.expires) {
        this.emailCodes.delete(email);
      }
    }
  }
}
