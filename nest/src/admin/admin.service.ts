import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  // 管理员认证
  async login(loginDto: { username: string; password: string }) {
    const admin = await this.databaseService.adminUser.findUnique({
      where: { username: loginDto.username },
    });

    if (!admin || !admin.isEnable) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息
    await this.databaseService.adminUser.update({
      where: { adminId: admin.adminId },
      data: {
        lastLoginTime: new Date(),
        lastLoginIp: '127.0.0.1', // 实际应用中应该从请求中获取
      },
    });

    const payload = { userId: admin.adminId, username: admin.username, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        adminId: admin.adminId,
        username: admin.username,
        email: admin.email,
        avatar: admin.avatar,
      },
    };
  }

  async logout(userId: number) {
    // 在实际应用中，这里可以将token加入黑名单
    return { message: '登出成功' };
  }

  async getAdminProfile(userId: number) {
    const admin = await this.databaseService.adminUser.findUnique({
      where: { adminId: userId },
      select: {
        adminId: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        lastLoginTime: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('管理员用户不存在');
    }

    return admin;
  }

  async updateAdminProfile(userId: number, updateDto: { email?: string; mobile?: string; avatar?: string }) {
    const admin = await this.databaseService.adminUser.update({
      where: { adminId: userId },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
      select: {
        adminId: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  async changePassword(userId: number, passwordDto: { oldPassword: string; newPassword: string }) {
    const admin = await this.databaseService.adminUser.findUnique({
      where: { adminId: userId },
    });

    if (!admin) {
      throw new NotFoundException('管理员用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(passwordDto.oldPassword, admin.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(passwordDto.newPassword, 10);

    await this.databaseService.adminUser.update({
      where: { adminId: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return { message: '密码修改成功' };
  }

  // 管理员用户管理
  async createAdminUser(createDto: { username: string; password: string; email?: string; mobile?: string; avatar?: string }) {
    const existingAdmin = await this.databaseService.adminUser.findUnique({
      where: { username: createDto.username },
    });

    if (existingAdmin) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    const admin = await this.databaseService.adminUser.create({
      data: {
        username: createDto.username,
        password: hashedPassword,
        email: createDto.email,
        mobile: createDto.mobile,
        avatar: createDto.avatar,
        updatedAt: new Date(),
      },
      select: {
        adminId: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        isEnable: true,
        createdAt: true,
      },
    });

    return admin;
  }

  async getAdminUsers(queryDto: { page?: number; size?: number; keyword?: string; isEnable?: boolean }) {
    const { page = 1, size = 20, keyword, isEnable } = queryDto;
    const skip = (page - 1) * size;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { mobile: { contains: keyword } },
      ];
    }
    if (isEnable !== undefined) {
      where.isEnable = isEnable;
    }

    const [users, total] = await Promise.all([
      this.databaseService.adminUser.findMany({
        where,
        skip,
        take: size,
        select: {
          adminId: true,
          username: true,
          email: true,
          mobile: true,
          avatar: true,
          isEnable: true,
          lastLoginTime: true,
          lastLoginIp: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.adminUser.count({ where }),
    ]);

    return {
      list: users,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async getAdminUser(adminId: number) {
    const admin = await this.databaseService.adminUser.findUnique({
      where: { adminId },
      select: {
        adminId: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        isEnable: true,
        lastLoginTime: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('管理员用户不存在');
    }

    return admin;
  }

  async updateAdminUser(adminId: number, updateDto: { email?: string; mobile?: string; avatar?: string }) {
    const admin = await this.databaseService.adminUser.update({
      where: { adminId },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
      select: {
        adminId: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  async deleteAdminUser(adminId: number) {
    await this.databaseService.adminUser.delete({
      where: { adminId },
    });

    return { message: '删除成功' };
  }

  async toggleAdminUserStatus(adminId: number, isEnable: boolean) {
    const admin = await this.databaseService.adminUser.update({
      where: { adminId },
      data: {
        isEnable,
        updatedAt: new Date(),
      },
      select: {
        adminId: true,
        username: true,
        isEnable: true,
        updatedAt: true,
      },
    });

    return admin;
  }

  // 角色管理
  async createRole(createRoleDto: { roleName: string; roleDesc?: string; authorityList: any[]; adminType?: string }) {
    const role = await this.databaseService.adminRole.create({
      data: {
        roleName: createRoleDto.roleName,
        roleDesc: createRoleDto.roleDesc,
        authorityList: createRoleDto.authorityList,
        adminType: createRoleDto.adminType || 'admin',
        updatedAt: new Date(),
      },
    });

    return role;
  }

  async getRoles(queryDto: { page?: number; size?: number; keyword?: string }) {
    const { page = 1, size = 20, keyword } = queryDto;
    const skip = (page - 1) * size;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { roleName: { contains: keyword } },
        { roleDesc: { contains: keyword } },
      ];
    }

    const [roles, total] = await Promise.all([
      this.databaseService.adminRole.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.adminRole.count({ where }),
    ]);

    return {
      list: roles,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async getRole(roleId: number) {
    const role = await this.databaseService.adminRole.findUnique({
      where: { roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async updateRole(roleId: number, updateRoleDto: { roleName?: string; roleDesc?: string; authorityList?: any[]; isEnable?: boolean }) {
    const role = await this.databaseService.adminRole.update({
      where: { roleId },
      data: {
        ...updateRoleDto,
        updatedAt: new Date(),
      },
    });

    return role;
  }

  async deleteRole(roleId: number) {
    await this.databaseService.adminRole.delete({
      where: { roleId },
    });

    return { message: '删除成功' };
  }

  async assignRolesToUser(adminId: number, roleIds: number[]) {
    // 这里需要实现用户角色关联表，目前返回模拟数据
    return {
      message: '角色分配成功',
      adminId,
      roleIds,
    };
  }

  // 系统统计
  async getDashboardStatistics() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      todayOrders,
      todayRevenue,
      lowStockProducts,
    ] = await Promise.all([
      this.databaseService.user.count({ where: { isDeleted: false, isEnable: true } }),
      this.databaseService.order.count(),
      this.databaseService.product.count({ where: { isDeleted: false, isEnable: true } }),
      this.databaseService.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.databaseService.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { totalAmount: true },
      }),
      this.databaseService.product.count({
        where: {
          isDeleted: false,
          isEnable: true,
          stock: { lte: 10 }, // 低库存阈值
        },
      }),
    ]);

    const recentOrders = await this.databaseService.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: { nickname: true, email: true },
        },
      },
    });

    return {
      overview: {
        totalUsers,
        totalOrders,
        totalProducts,
        todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
        lowStockProducts,
      },
      recentOrders,
    };
  }

  // 系统日志
  async getSystemLogs(queryDto: { page?: number; size?: number; level?: string; startDate?: string; endDate?: string }) {
    const { page = 1, size = 20, level, startDate, endDate } = queryDto;
    const skip = (page - 1) * size;

    // 这里需要实现系统日志表，目前返回模拟数据
    return {
      list: [],
      pagination: {
        page,
        size,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // 系统设置
  async getSystemSettings() {
    // 这里需要实现系统设置表，目前返回模拟数据
    return {
      siteName: 'Tigshop 管理系统',
      siteLogo: '',
      siteDescription: '专业的电商管理平台',
      contactEmail: 'admin@tigshop.com',
      contactPhone: '',
      currency: 'CNY',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
    };
  }

  async updateSystemSettings(settings: any) {
    // 这里需要实现系统设置表的更新，目前返回模拟数据
    return {
      message: '系统设置更新成功',
      settings,
    };
  }
}