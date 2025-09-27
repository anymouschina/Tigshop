// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class CommonCsrfService {
  private readonly tokens = new Map<string, { expires: number; userId?: number }>();
  private readonly TOKEN_TTL = 3600; // 1 hour

  generateToken(userId?: number): string {
    const token = randomBytes(32).toString("hex");
    const expires = Date.now() + this.TOKEN_TTL * 1000;

    this.tokens.set(token, { expires, userId });

    // Clean expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  validateToken(token: string, userId?: number): boolean {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return false;
    }

    if (Date.now() > tokenData.expires) {
      this.tokens.delete(token);
      return false;
    }

    // If userId is provided, verify it matches
    if (userId !== undefined && tokenData.userId !== undefined && tokenData.userId !== userId) {
      return false;
    }

    return true;
  }

  deleteToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  refreshToken(oldToken: string, userId?: number): string | null {
    if (this.validateToken(oldToken, userId)) {
      this.tokens.delete(oldToken);
      return this.generateToken(userId);
    }
    return null;
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