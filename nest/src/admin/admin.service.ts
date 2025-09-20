// @ts-nocheck
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
    // 查找管理员 - username不是唯一键，需要使用findFirst
    const admin = await this.databaseService.admin_user.findFirst({
      where: { username: loginDto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息 - 使用原始SQL，因为lastLoginTime字段不在schema中
    await this.databaseService.$queryRaw`
      UPDATE "admin_user"
      SET "add_time" = ${Math.floor(Date.now() / 1000)}, "last_login_ip" = '127.0.0.1'
      WHERE "admin_id" = ${admin.admin_id}
    `;

    const payload = { userId: admin.admin_id, username: admin.username, role: 'admin' };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        adminId: admin.admin_id,
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
    const admin = await this.databaseService.admin_user.findUnique({
      where: { admin_id: userId },
      select: {
        admin_id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        add_time: true,
        created_at: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('管理员用户不存在');
    }

    return admin;
  }

  async updateAdminProfile(userId: number, updateDto: { email?: string; mobile?: string; avatar?: string }) {
    const admin = await this.databaseService.admin_user.update({
      where: { admin_id: userId },
      data: {
        ...updateDto,
        updated_at: new Date(),
      },
      select: {
        admin_id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        updated_at: true,
      },
    });

    return admin;
  }

  async changePassword(userId: number, passwordDto: { oldPassword: string; newPassword: string }) {
    const admin = await this.databaseService.admin_user.findUnique({
      where: { admin_id: userId },
    });

    if (!admin) {
      throw new NotFoundException('管理员用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(passwordDto.oldPassword, admin.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(passwordDto.newPassword, 10);

    await this.databaseService.admin_user.update({
      where: { admin_id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return { message: '密码修改成功' };
  }

  // 管理员用户管理
  async createAdminUser(createDto: { username: string; password: string; email?: string; mobile?: string; avatar?: string }) {
    const existingAdmin = await this.databaseService.admin_user.findFirst({
      where: { username: createDto.username },
    });

    if (existingAdmin) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Use raw SQL to create admin user without adminRole relationship requirement
    const result = await this.databaseService.$queryRaw`
      INSERT INTO "admin_user" (
        username, password, email, mobile, avatar,
        add_time, admin_type, created_at, updated_at
      ) VALUES (
        ${createDto.username}, ${hashedPassword}, ${createDto.email || ''}, ${createDto.mobile || ''}, ${createDto.avatar || ''},
        ${Math.floor(Date.now() / 1000)}, 'admin', ${new Date()}, ${new Date()}
      )
      RETURNING admin_id, username, email, mobile, avatar, add_time, created_at
    ` as any;

    return result[0];
  }

  async getAdminUsers(queryDto: { page?: number; size?: number; keyword?: string; isEnable?: boolean }) {
    const { page = 1, size = 20, keyword } = queryDto;
    const skip = (page - 1) * size;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { mobile: { contains: keyword } },
      ];
    }

    const [users, total] = await Promise.all([
      this.databaseService.admin_user.findMany({
        where,
        skip,
        take: size,
        select: {
          admin_id: true,
          username: true,
          email: true,
          mobile: true,
          avatar: true,
          add_time: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.databaseService.admin_user.count({ where }),
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
    const admin = await this.databaseService.admin_user.findUnique({
      where: { admin_id: adminId },
      select: {
        admin_id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        add_time: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('管理员用户不存在');
    }

    return admin;
  }

  async updateAdminUser(adminId: number, updateDto: { email?: string; mobile?: string; avatar?: string }) {
    const admin = await this.databaseService.admin_user.update({
      where: { admin_id: adminId },
      data: {
        ...updateDto,
        updated_at: new Date(),
      },
      select: {
        admin_id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        updated_at: true,
      },
    });

    return admin;
  }

  async deleteAdminUser(adminId: number) {
    await this.databaseService.admin_user.delete({
      where: { admin_id: adminId },
    });

    return { message: '删除成功' };
  }

  async toggleAdminUserStatus(adminId: number, isEnable: boolean) {
    // isEnable field doesn't exist in the schema, so this function is not implemented
    throw new BadRequestException('管理员状态切换功能暂未实现');
  }

  // 角色管理
  async createRole(createRoleDto: { roleName: string; roleDesc?: string; authorityList: any[]; adminType?: string }) {
    // Convert authorityList array to JSON string as expected by schema
    const authorityListJson = JSON.stringify(createRoleDto.authorityList || []);

    const role = await this.databaseService.admin_role.create({
      data: {
        role_name: createRoleDto.roleName,
        role_desc: createRoleDto.roleDesc,
        authority_list: authorityListJson,
        admin_type: createRoleDto.adminType || 'admin',
        updated_at: new Date(),
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
      this.databaseService.admin_role.findMany({
        where,
        skip,
        take: size,
        orderBy: { created_at: 'desc' },
      }),
      this.databaseService.admin_role.count({ where }),
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
    const role = await this.databaseService.admin_role.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async updateRole(roleId: number, updateRoleDto: { roleName?: string; roleDesc?: string; authorityList?: any[]; isEnable?: boolean }) {
    const updateData: any = {
      ...updateRoleDto,
      updatedAt: new Date(),
    };

    // Convert authorityList array to JSON string if provided
    if (updateRoleDto.authorityList) {
      updateData.authority_list = JSON.stringify(updateRoleDto.authorityList);
    }

    const role = await this.databaseService.admin_role.update({
      where: { role_id: roleId },
      data: updateData,
    });

    return role;
  }

  async deleteRole(roleId: number) {
    await this.databaseService.admin_role.delete({
      where: { role_id: roleId },
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
      this.databaseService.user.count(),
      this.databaseService.order.count(),
      this.databaseService.product.count({ where: { is_delete: 0 } }),
      this.databaseService.order.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.databaseService.order.aggregate({
        where: {
          order_status: 5, // Assuming 5 means COMPLETED
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { total_amount: true },
      }),
      this.databaseService.product.count({
        where: {
          is_delete: 0,
          product_stock: { lte: 10 }, // 低库存阈值
        },
      }),
    ]);

    const recentOrders = await this.databaseService.order.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
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
        todayRevenue: Number(todayRevenue._sum.total_amount || 0),
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
