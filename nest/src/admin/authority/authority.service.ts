import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  AuthorityQueryDto,
  AuthorityDetailDto,
  CreateAuthorityDto,
  UpdateAuthorityDto,
  DeleteAuthorityDto,
  BatchDeleteAuthorityDto,
  AUTHORITY_TYPE,
  AUTHORITY_STATUS
} from './authority.dto';

@Injectable()
export class AuthorityService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AuthorityQueryDto) {
    const {
      keyword = '',
      parent_id = -1,
      type = -1,
      status = -1,
      page = 1,
      size = 15,
      sort_field = 'id',
      sort_order = 'asc',
    } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (parent_id >= 0) {
      where.parent_id = parent_id;
    }

    if (type >= 0) {
      where.type = type;
    }

    if (status >= 0) {
      where.status = status;
    }

    const orderBy = {};
    orderBy[sort_field] = sort_order;

    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      this.prisma.authority.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      this.prisma.authority.count({ where }),
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
    const authority = await this.prisma.authority.findUnique({
      where: { id },
    });

    if (!authority) {
      throw new Error('权限不存在');
    }

    return authority;
  }

  async create(data: CreateAuthorityDto) {
    const existingAuthority = await this.prisma.authority.findFirst({
      where: { code: data.code },
    });

    if (existingAuthority) {
      throw new Error('权限代码已存在');
    }

    if (data.parent_id > 0) {
      const parentAuthority = await this.prisma.authority.findUnique({
        where: { id: data.parent_id },
      });

      if (!parentAuthority) {
        throw new Error('父级权限不存在');
      }
    }

    const authority = await this.prisma.authority.create({
      data: {
        ...data,
        create_time: new Date(),
        update_time: new Date(),
      },
    });

    return authority;
  }

  async update(data: UpdateAuthorityDto) {
    const authority = await this.prisma.authority.findUnique({
      where: { id: data.id },
    });

    if (!authority) {
      throw new Error('权限不存在');
    }

    if (data.code && data.code !== authority.code) {
      const existingAuthority = await this.prisma.authority.findFirst({
        where: { code: data.code },
      });

      if (existingAuthority) {
        throw new Error('权限代码已存在');
      }
    }

    if (data.parent_id && data.parent_id !== authority.parent_id) {
      if (data.parent_id > 0) {
        const parentAuthority = await this.prisma.authority.findUnique({
          where: { id: data.parent_id },
        });

        if (!parentAuthority) {
          throw new Error('父级权限不存在');
        }

        if (data.parent_id === data.id) {
          throw new Error('不能将权限设置为自己的子级');
        }
      }
    }

    const updateData: any = {
      ...data,
      update_time: new Date(),
    };

    delete updateData.id;

    const updatedAuthority = await this.prisma.authority.update({
      where: { id: data.id },
      data: updateData,
    });

    return updatedAuthority;
  }

  async remove(id: number) {
    const authority = await this.prisma.authority.findUnique({
      where: { id },
    });

    if (!authority) {
      throw new Error('权限不存在');
    }

    const childCount = await this.prisma.authority.count({
      where: { parent_id: id },
    });

    if (childCount > 0) {
      throw new Error('该权限下还有子权限，无法删除');
    }

    await this.prisma.authority.delete({
      where: { id },
    });

    return true;
  }

  async batchRemove(ids: number[]) {
    for (const id of ids) {
      const childCount = await this.prisma.authority.count({
        where: { parent_id: id },
      });

      if (childCount > 0) {
        throw new Error(`权限ID ${id} 下还有子权限，无法删除`);
      }
    }

    await this.prisma.authority.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return true;
  }

  async getAuthorityTree(type?: number, status?: number) {
    const where: any = {};
    if (type !== undefined && type >= 0) {
      where.type = type;
    }
    if (status !== undefined && status >= 0) {
      where.status = status;
    }

    const authorities = await this.prisma.authority.findMany({
      where,
      orderBy: [
        { parent_id: 'asc' },
        { sort: 'asc' },
        { id: 'asc' },
      ],
    });

    return this.buildTree(authorities);
  }

  private buildTree(authorities: any[], parentId: number = 0) {
    const tree = [];

    for (const authority of authorities) {
      if (authority.parent_id === parentId) {
        const children = this.buildTree(authorities, authority.id);
        if (children.length > 0) {
          authority.children = children;
        }
        tree.push(authority);
      }
    }

    return tree;
  }

  async updateStatus(id: number, status: number) {
    const authority = await this.prisma.authority.findUnique({
      where: { id },
    });

    if (!authority) {
      throw new Error('权限不存在');
    }

    if (!Object.values(AUTHORITY_STATUS).includes(status)) {
      throw new Error('无效的状态值');
    }

    const updatedAuthority = await this.prisma.authority.update({
      where: { id },
      data: { status, update_time: new Date() },
    });

    return updatedAuthority;
  }

  async getMenuPermissions(roleId?: number) {
    const where: any = { type: 0, status: 1 };

    const authorities = await this.prisma.authority.findMany({
      where,
      orderBy: [
        { parent_id: 'asc' },
        { sort: 'asc' },
        { id: 'asc' },
      ],
    });

    return this.buildTree(authorities);
  }

  async getActionPermissions(roleId?: number) {
    const where: any = { type: 1, status: 1 };

    const authorities = await this.prisma.authority.findMany({
      where,
      orderBy: [
        { parent_id: 'asc' },
        { sort: 'asc' },
        { id: 'asc' },
      ],
    });

    return authorities;
  }
}