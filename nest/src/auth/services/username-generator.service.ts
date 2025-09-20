// @ts-nocheck
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UsernameGeneratorService {
  private readonly USERNAME_PREFIX = 'USER_';
  private readonly USERNAME_LENGTH = 8;
  private readonly MAX_ATTEMPTS = 100;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate a unique username
   * Matches PHP implementation: {prefix}{8_character_alphanumeric_code}
   */
  async generateUsername(): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
      const randomCode = this.generateRandomCode(this.USERNAME_LENGTH);
      const username = this.USERNAME_PREFIX + randomCode;

      // Check if username is unique
      const existingUser = await this.databaseService.user.findUnique({
        where: { username },
      });

      if (!existingUser) {
        return username;
      }
    }

    throw new BadRequestException('无法生成唯一的用户名，请稍后重试');
  }

  /**
   * Generate a unique nickname if not provided
   */
  async generateNickname(): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
      const randomCode = this.generateRandomCode(this.USERNAME_LENGTH);
      const nickname = 'USER_' + randomCode;

      // Check if nickname is unique (optional, depending on requirements)
      const existingUser = await this.databaseService.user.findFirst({
        where: { nickname },
      });

      if (!existingUser) {
        return nickname;
      }
    }

    throw new BadRequestException('无法生成唯一的昵称，请稍后重试');
  }

  /**
   * Generate random alphanumeric code
   * Matches PHP RandomUtils::getRandomCode(8, 3) implementation
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Validate username format
   */
  validateUsername(username: string): boolean {
    // Username should be 3-50 characters, alphanumeric with underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const existingUser = await this.databaseService.user.findUnique({
      where: { username },
    });

    return !existingUser;
  }
}
