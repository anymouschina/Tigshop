import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
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
  constructor(private databaseService: DatabaseService) {}

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
      this.databaseService.admin_role.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.databaseService.admin_role.count({ where }),
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
    const admin_role = await this.databaseService.admin_role.findUnique({
      where: { role_id: id },
    });

    if (!admin_role) {
      throw new Error('角色不存在');
    }

    return admin_role;
  }

  async create(data: CreateAdminRoleDto) {
    const existingRole = await this.databaseService.admin_role.findFirst({
      where: { role_name: data.name },
    });

    if (existingRole) {
      throw new Error('角色名称已存在');
    }

    const admin_role = await this.databaseService.admin_role.create({
      data: {
        role_name: data.name,
        role_desc: data.description,
        authority_list: JSON.stringify(data.permissions || []),
        status: data.status ?? 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return admin_role;
  }

  async update(data: UpdateAdminRoleDto) {
    const admin_role = await this.databaseService.admin_role.findUnique({
      where: { role_id: data.id },
    });

    if (!admin_role) {
      throw new Error('角色不存在');
    }

    if (data.name && data.name !== admin_role.role_name) {
      const existingRole = await this.databaseService.admin_role.findFirst({
        where: { role_name: data.name },
      });

      if (existingRole) {
        throw new Error('角色名称已存在');
      }
    }

    const updateData: any = {
      role_name: data.name,
      role_desc: data.description,
      status: data.status,
      updated_at: new Date(),
    };

    const updatedAdminRole = await this.databaseService.admin_role.update({
      where: { role_id: data.id },
      data: updateData,
    });

    return updatedAdminRole;
  }

  async remove(id: number) {
    const admin_role = await this.databaseService.admin_role.findUnique({
      where: { role_id: id },
    });

    if (!admin_role) {
      throw new Error('角色不存在');
    }

    const adminCount = await this.databaseService.admin_user.count({
      where: { role_id: id },
    });

    if (adminCount > 0) {
      throw new Error('该角色下还有管理员，无法删除');
    }

    await this.databaseService.admin_role.delete({
      where: { role_id: id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    for (const id of ids) {
      const adminCount = await this.databaseService.admin_user.count({
        where: { role_id: id },
      });

      if (adminCount > 0) {
        throw new Error(`角色ID ${id} 下还有管理员，无法删除`);
      }
    }

    await this.databaseService.admin_role.deleteMany({
      where: {
        role_id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async updateStatus(id: number, status: number) {
    const admin_role = await this.databaseService.admin_role.findUnique({
      where: { role_id: id },
    });

    if (!admin_role) {
      throw new Error('角色不存在');
    }

    if (!Object.keys(ROLE_STATUS).includes(status.toString())) {
      throw new Error('无效的状态值');
    }

    const updatedAdminRole = await this.databaseService.admin_role.update({
      where: { role_id: id },
      data: { status, updated_at: new Date() },
    });

    return updatedAdminRole;
  }

  async getAllRoles() {
    return await this.databaseService.admin_role.findMany({
      where: { status: 1 },
      select: {
        role_id: true,
        role_name: true,
        role_desc: true,
        authority_list: true,
      },
      orderBy: { role_id: 'asc' },
    });
  }

  async getRoleStats() {
    const result = await this.databaseService.admin_role.groupBy({
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