import { Injectable } from "@nestjs/common";
import {
  AdminRoleQueryDto,
  AdminRoleDetailDto,
  CreateAdminRoleDto,
  UpdateAdminRoleDto,
  DeleteAdminRoleDto,
  BatchDeleteAdminRoleDto,
  ROLE_STATUS,
} from "./admin-role.dto";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class AdminRoleService {
  constructor(private databaseService: PrismaService) {}

  async findAll(query: AdminRoleQueryDto) {
    const {
      keyword = "",
      status = -1,
      page = 1,
      size = 15,
      sort_field = "id",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { role_name: { contains: keyword } },
        { role_desc: { contains: keyword } },
      ];
    }

    // admin_role has no status field in schema; ignore status filter

    const orderBy: any = {};
    orderBy[sort_field === "id" ? "role_id" : sort_field] = sort_order;

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
      throw new Error("角色不存在");
    }

    return admin_role;
  }

  async create(data: CreateAdminRoleDto) {
    const existingRole = await this.databaseService.admin_role.findFirst({
      where: { role_name: data.name },
    });

    if (existingRole) {
      throw new Error("角色名称已存在");
    }

    const admin_role = await this.databaseService.admin_role.create({
      data: {
        role_name: data.name,
        role_desc: data.description,
        authority_list: JSON.stringify(data.permissions || []),
      },
    });

    return admin_role;
  }

  async update(data: UpdateAdminRoleDto) {
    const admin_role = await this.databaseService.admin_role.findUnique({
      where: { role_id: data.id },
    });

    if (!admin_role) {
      throw new Error("角色不存在");
    }

    if (data.name && data.name !== admin_role.role_name) {
      const existingRole = await this.databaseService.admin_role.findFirst({
        where: { role_name: data.name },
      });

      if (existingRole) {
        throw new Error("角色名称已存在");
      }
    }

    const updateData: any = {
      role_name: data.name,
      role_desc: data.description,
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
      throw new Error("角色不存在");
    }

    const adminCount = await this.databaseService.admin_user.count({
      where: { role_id: id },
    });

    if (adminCount > 0) {
      throw new Error("该角色下还有管理员，无法删除");
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
      throw new Error("角色不存在");
    }

    // admin_role has no status field; treat as no-op and return current record
    return this.findOne(id);
  }

  async getAllRoles() {
    return await this.databaseService.admin_role.findMany({
      select: {
        role_id: true,
        role_name: true,
        role_desc: true,
        authority_list: true,
      },
      orderBy: { role_id: "asc" },
    });
  }

  async getRoleStats() {
    const total = await this.databaseService.admin_role.count();
    return { total, active: 0, inactive: 0 };
  }
}
