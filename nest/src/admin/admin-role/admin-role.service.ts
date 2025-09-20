import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  AdminRoleQueryDto,
  AdminRoleDetailDto,
  CreateAdminRoleDto,
  UpdateAdminRoleDto,
  DeleteAdminRoleDto,
  BatchDeleteAdminRoleDto,
  ROLE_STATUS
} from './admin-role.dto';

@Injectable()
export class AdminRoleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AdminRoleQueryDto) {
    const {
      keyword = '',
      status = -1,
      page = 1,
      size = 15,
      sort_field = 'id',
      sort_order = 'desc',
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (status >= 0) {
      where.status = status;
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.adminRole.findMany({
        where,
        include: {
          admins: {
            select: {
              admin_id: true,
              username: true,
              nickname: true,
            },
          },
        },
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.adminRole.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const adminRole = await this.prisma.adminRole.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            admin_id: true,
            username: true,
            nickname: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    if (!adminRole) {
      throw new Error('角色不存在');
    }

    return adminRole;
  }

  async create(data: CreateAdminRoleDto) {
    const existingRole = await this.prisma.adminRole.findFirst({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new Error('角色名称已存在');
    }

    const adminRole = await this.prisma.adminRole.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return adminRole;
  }

  async update(data: UpdateAdminRoleDto) {
    const adminRole = await this.prisma.adminRole.findUnique({
      where: { id: data.id },
    });

    if (!adminRole) {
      throw new Error('角色不存在');
    }

    if (data.name && data.name !== adminRole.name) {
      const existingRole = await this.prisma.adminRole.findFirst({
        where: { name: data.name },
      });

      if (existingRole) {
        throw new Error('角色名称已存在');
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    delete updateData.id;

    const updatedAdminRole = await this.prisma.adminRole.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedAdminRole;
  }

  async remove(id: number) {
    const adminRole = await this.prisma.adminRole.findUnique({
      where: { id },
    });

    if (!adminRole) {
      throw new Error('角色不存在');
    }

    const adminCount = await this.prisma.admin.count({
      where: { role_id: id },
    });

    if (adminCount > 0) {
      throw new Error('该角色下还有管理员，无法删除');
    }

    await this.prisma.adminRole.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    for (const id of ids) {
      const adminCount = await this.prisma.admin.count({
        where: { role_id: id },
      });

      if (adminCount > 0) {
        throw new Error(`角色ID ${id} 下还有管理员，无法删除`);
      }
    }

    await this.prisma.adminRole.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async updateStatus(id: number, status: number) {
    const adminRole = await this.prisma.adminRole.findUnique({
      where: { id },
    });

    if (!adminRole) {
      throw new Error('角色不存在');
    }

    if (!Object.values(ROLE_STATUS).includes(status)) {
      throw new Error('无效的状态值');
    }

    const updatedAdminRole = await this.prisma.adminRole.update({
      where: { id },
      data: { status, update_time: new Date() },
    });

    return updatedAdminRole;
  }

  async getAllRoles() {
    return await this.prisma.adminRole.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async getRoleStats() {
    const result = await this.prisma.adminRole.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
    };

    result.forEach(stat => {
      stats.total += stat._count._all;
      if (stat.status === 1) {
        stats.active = stat._count._all;
      } else {
        stats.inactive = stat._count._all;
      }
    });

    return stats;
  }
}