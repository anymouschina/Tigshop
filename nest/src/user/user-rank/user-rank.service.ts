// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { CreateUserRankDto, UpdateUserRankDto } from "./dto/user-rank.dto";

@Injectable()
export class UserRankService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(
    filter: any,
    includes: string[] = [],
    appends: string[] = [],
  ) {
    const { page, size, sort_field, sort_order, ...where } = filter;

    const skip = (page - 1) * size;
    const orderBy = { [sort_field]: sort_order };

    const include = {};
    if (includes.includes("user_rights")) {
      include["user_rights"] = true;
    }
    if (includes.includes("user_count")) {
      include["user_count"] = true;
    }

    const records = await this.prisma.userRank.findMany({
      where,
      include,
      skip,
      take: size,
      orderBy,
    });

    return records;
  }

  async getFilterCount(filter: any): Promise<number> {
    const { page, size, sort_field, sort_order, ...where } = filter;
    return this.prisma.userRank.count({ where });
  }

  async getDetail(rankType: number) {
    const item = await this.prisma.userRank.findFirst({
      where: { rank_type: rankType },
      include: {
        user_rights: true,
      },
    });

    if (!item) {
      throw new Error("会员等级不存在");
    }

    return item;
  }

  async updateUserRank(updateData: UpdateUserRankDto) {
    return this.prisma.userRank.update({
      where: { rank_id: updateData.rank_type },
      data: {
        rank_name: updateData.data?.rank_name,
        rank_logo: updateData.data?.rank_logo,
        rank_level: updateData.data?.rank_level,
        min_points: updateData.data?.min_points,
        max_points: updateData.data?.max_points,
        discount: updateData.data?.discount,
        description: updateData.data?.description,
        update_time: new Date(),
      },
    });
  }

  async createUserRank(createData: CreateUserRankDto) {
    return this.prisma.userRank.create({
      data: {
        rank_name: createData.rank_name,
        rank_type: createData.rank_type,
        rank_logo: createData.rank_logo,
        rank_level: createData.rank_level,
        min_points: createData.min_points,
        max_points: createData.max_points,
        discount: createData.discount,
        description: createData.description,
        create_time: new Date(),
        update_time: new Date(),
      },
    });
  }

  async deleteUserRank(id: number) {
    return this.prisma.userRank.delete({
      where: { rank_id: id },
    });
  }

  async getRankConfig() {
    const config = await this.prisma.systemConfig.findFirst({
      where: { config_key: "user_rank_config" },
    });

    return config ? JSON.parse(config.config_value) : {};
  }

  async defaultRankData() {
    return {
      user_rank_list: [
        {
          rank_id: 1,
          rank_name: "普通会员",
          rank_type: 1,
          rank_logo: "",
          rank_level: 1,
          min_points: 0,
          max_points: 999,
          discount: 100,
          description: "普通会员",
        },
        {
          rank_id: 2,
          rank_name: "铜牌会员",
          rank_type: 2,
          rank_logo: "",
          rank_level: 2,
          min_points: 1000,
          max_points: 4999,
          discount: 95,
          description: "铜牌会员",
        },
      ],
      user_rank_list_not_pro: [
        {
          rank_id: 1,
          rank_name: "普通会员",
          rank_type: 1,
          rank_logo: "",
          rank_level: 1,
          min_points: 0,
          max_points: 999,
          discount: 100,
          description: "普通会员",
        },
      ],
      rank_config: {
        rank_type: 1,
        grow_up_setting: {
          points_rules: [
            { action: "register", points: 10 },
            { action: "order", points: 1 },
          ],
        },
      },
    };
  }
}
