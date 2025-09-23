import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  DecorateQueryDto,
  CreateDecorateDto,
  UpdateDecorateDto,
  DECORATE_TYPE,
  DECORATE_STATUS,
  DECORATE_PLATFORM,
} from "./decorate.dto";

@Injectable()
export class DecorateService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DecorateQueryDto) {
    const {
      keyword,
      type,
      platform,
      status,
      page = 1,
      size = 10,
      sort_field = "update_time",
      sort_order = "desc",
    } = query;

    const where: any = {};

    if (keyword) {
      where.decorate_title = {
        contains: keyword,
      };
    }

    if (type !== undefined) {
      where.decorate_type = type;
    }

    if (status !== undefined) {
      where.status = status === DECORATE_STATUS.ENABLED;
    }

    const skip = (page - 1) * size;
    const orderBy: any = {
      [sort_field]: sort_order,
    };

    const [data, total] = await Promise.all([
      this.prisma.decorate.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.decorate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      size,
      total_pages: Math.ceil(total / size),
    };
  }

  async findOne(id: number) {
    const decorate = await this.prisma.decorate.findUnique({
      where: { decorate_id: id },
    });

    if (!decorate) {
      throw new Error("装修页面不存在");
    }

    return decorate;
  }

  async create(createDecorateDto: CreateDecorateDto) {
    const {
      decorate_title,
      data,
      draft_data,
      decorate_type,
      is_home,
      shop_id,
      status,
      locale_id,
      parent_id,
    } = createDecorateDto;

    const decorate = await this.prisma.decorate.create({
      data: {
        decorate_title,
        data,
        draft_data,
        decorate_type,
        is_home,
        shop_id,
        status,
        locale_id,
        parent_id,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return decorate;
  }

  async update(updateDecorateDto: UpdateDecorateDto) {
    const { id, ...updateData } = updateDecorateDto;

    const existingDecorate = await this.prisma.decorate.findUnique({
      where: { decorate_id: id },
    });

    if (!existingDecorate) {
      throw new Error("装修页面不存在");
    }

    const updatePayload: any = { ...updateData };

    if (updateData.data !== undefined || updateData.draft_data !== undefined) {
      updatePayload.update_time = Math.floor(Date.now() / 1000);
    }

    const decorate = await this.prisma.decorate.update({
      where: { decorate_id: id },
      data: updatePayload,
    });

    return decorate;
  }

  async remove(id: number) {
    const existingDecorate = await this.prisma.decorate.findUnique({
      where: { decorate_id: id },
    });

    if (!existingDecorate) {
      throw new Error("装修页面不存在");
    }

    await this.prisma.decorate.delete({
      where: { decorate_id: id },
    });

    return { message: "删除成功" };
  }

  async batchRemove(ids: number[]) {
    const existingDecorates = await this.prisma.decorate.findMany({
      where: { decorate_id: { in: ids } },
    });

    if (existingDecorates.length !== ids.length) {
      throw new Error("部分装修页面不存在");
    }

    await this.prisma.decorate.deleteMany({
      where: { decorate_id: { in: ids } },
    });

    return { message: `成功删除 ${ids.length} 个装修页面` };
  }

  async updateStatus(id: number, status: number) {
    const existingDecorate = await this.prisma.decorate.findUnique({
      where: { decorate_id: id },
    });

    if (!existingDecorate) {
      throw new Error("装修页面不存在");
    }

    const decorate = await this.prisma.decorate.update({
      where: { decorate_id: id },
      data: {
        status: status === DECORATE_STATUS.ENABLED,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return decorate;
  }

  async getDecorateStats() {
    const [total, enabled, disabled] = await Promise.all([
      this.prisma.decorate.count(),
      this.prisma.decorate.count({ where: { status: true } }),
      this.prisma.decorate.count({ where: { status: false } }),
    ]);

    const typeStats = await this.prisma.decorate.groupBy({
      by: ["decorate_type"],
      _count: {
        decorate_type: true,
      },
    });

    return {
      total,
      enabled,
      disabled,
      type_stats: typeStats.map((stat) => ({
        type: stat.decorate_type,
        count: stat._count.decorate_type,
      })),
    };
  }

  async previewDecorate(id: number) {
    const decorate = await this.prisma.decorate.findUnique({
      where: { decorate_id: id },
      select: {
        decorate_id: true,
        decorate_title: true,
        data: true,
        decorate_type: true,
        is_home: true,
        shop_id: true,
        status: true,
      },
    });

    if (!decorate) {
      throw new Error("装修页面不存在");
    }

    return {
      ...decorate,
      preview_data: JSON.parse(decorate.data || "{}"),
    };
  }

  async copyDecorate(
    id: number,
    copyData: { name?: string; description?: string },
  ) {
    const sourceDecorate = await this.prisma.decorate.findUnique({
      where: { decorate_id: id },
    });

    if (!sourceDecorate) {
      throw new Error("源装修页面不存在");
    }

    const decorate = await this.prisma.decorate.create({
      data: {
        decorate_title:
          copyData.name || `${sourceDecorate.decorate_title}_副本`,
        data: sourceDecorate.data,
        draft_data: sourceDecorate.draft_data,
        decorate_type: sourceDecorate.decorate_type,
        is_home: 0, // 复制的不是首页
        shop_id: sourceDecorate.shop_id,
        status: false, // 复制的默认禁用
        locale_id: sourceDecorate.locale_id,
        parent_id: sourceDecorate.parent_id,
        update_time: Math.floor(Date.now() / 1000),
      },
    });

    return decorate;
  }
}
