// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthorityService {
  constructor(private prisma: PrismaService) {}

  async getAuthorityList(keyword: string, adminType: number) {
    const where: any = {
      is_show: 1,
      is_delete: 0,
    };

    if (keyword) {
      where.name = {
        contains: keyword,
      };
    }

    // 根据管理员类型过滤权限
    if (adminType === 1) {
      // 超级管理员
    } else {
      // 普通管理员
      where.type = 1; // 只显示普通权限
    }

    return this.prisma.authority.findMany({
      where,
      orderBy: {
        sort_order: 'asc',
      },
    });
  }
}
