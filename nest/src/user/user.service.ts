import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 根据ID查找用户
   */
  async findById(id: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string) {
    return this.databaseService.user.findUnique({
      where: { email },
    });
  }

  /**
   * 根据手机号查找用户
   */
  async findByMobile(mobile: string) {
    return this.databaseService.user.findUnique({
      where: { mobile },
    });
  }

  /**
   * 创建用户
   */
  async create(userData: {
    email?: string;
    mobile?: string;
    password?: string;
    name?: string;
    openId?: string;
  }) {
    // 检查邮箱是否已存在
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new BadRequestException('邮箱已被注册');
      }
    }

    // 检查手机号是否已存在
    if (userData.mobile) {
      const existingUser = await this.findByMobile(userData.mobile);
      if (existingUser) {
        throw new BadRequestException('手机号已被注册');
      }
    }

    return this.databaseService.user.create({
      data: userData,
    });
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updateData: {
    name?: string;
    email?: string;
    mobile?: string;
    avatarUrl?: string;
    nickname?: string;
  }) {
    await this.findById(id);

    return this.databaseService.user.update({
      where: { userId: id },
      data: updateData,
    });
  }

  /**
   * 更新用户密码
   */
  async updatePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.findById(id);

    // 这里应该添加密码验证逻辑
    // if (!await bcrypt.compare(oldPassword, user.password)) {
    //   throw new BadRequestException('原密码错误');
    // }

    return this.databaseService.user.update({
      where: { userId: id },
      data: { password: newPassword }, // 实际应该加密
    });
  }

  /**
   * 更新最后登录信息
   */
  async updateLoginInfo(id: number, ip: string) {
    return this.databaseService.user.update({
      where: { userId: id },
      data: {
        lastLoginTime: new Date(),
        lastLoginIp: ip,
      },
    });
  }
}