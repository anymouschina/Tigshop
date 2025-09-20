// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class CsrfService {
  private readonly tokens = new Map<string, { expires: number }>();
  private readonly TOKEN_TTL = 3600; // 1 hour

  generateToken(): string {
    const token = randomBytes(32).toString("hex");
    const expires = Date.now() + this.TOKEN_TTL * 1000;

    this.tokens.set(token, { expires });

    // Clean expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  validateToken(token: string): boolean {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return false;
    }

    if (Date.now() > tokenData.expires) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  deleteToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(token);
      }
    }
  }
}
