// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthorityService {
  constructor(private prisma: PrismaService) {}

  async getAuthorityList(keyword: string, adminType: number) {
    // authority 表实际字段: authority_id, authority_sn, authority_name, parent_id, sort_order, is_show, child_auth, route_link, authority_ico, is_system, admin_type
    // 之前使用的 is_delete / name / type 字段在当前 schema 中不存在，导致 Prisma ValidationError。
    // 调整：
    // 1) 仅保留 is_show = 1 作为可见过滤。
    // 2) 关键词同时在 authority_name / authority_sn / route_link 中模糊匹配。
    // 3) adminType 暂不额外限制（若将来有区分，再依据 admin_type 或自定义关系实现）。
    const where: any = { is_show: 1 };

    if (keyword) {
      where.OR = [
        { authority_name: { contains: keyword } },
        { authority_sn: { contains: keyword } },
        { route_link: { contains: keyword } },
      ];
    }

    // 如果未来需要区分普通管理员，可在此添加条件，例如: if (adminType !== 1) { where.is_system = 0 }

    return this.prisma.authority.findMany({
      where,
      orderBy: { sort_order: "asc" },
    });
  }
}
