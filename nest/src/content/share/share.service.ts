// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateShareDto,
  UpdateShareDto,
  ShareQueryDto,
  ShareStatus,
  ShareConfigDto,
} from "./dto/share.dto";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: ShareQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "share_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { share_id: { contains: keyword } },
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { status: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.share.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.share.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: number) {
    const item = await this.prisma.share.findUnique({
      where: { share_id: id },
    });

    if (!item) {
      throw new NotFoundException("分享不存在");
    }

    return item;
  }

  async create(createDto: CreateShareDto) {
    const item = await this.prisma.share.create({
      data: {
        title: createDto.title,
        description: createDto.description,
        image: createDto.image,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateShareDto) {
    const item = await this.prisma.share.findUnique({
      where: { share_id: id },
    });

    if (!item) {
      throw new NotFoundException("分享不存在");
    }

    const updateData: any = {};
    if (updateDto.title !== undefined) {
      updateData.title = updateDto.title;
    }
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }
    if (updateDto.image !== undefined) {
      updateData.image = updateDto.image;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.share.update({
      where: { share_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.share.findUnique({
      where: { share_id: id },
    });

    if (!item) {
      throw new NotFoundException("分享不存在");
    }

    await this.prisma.share.delete({
      where: { share_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.share.deleteMany({
      where: { share_id: { in: ids } },
    });
  }

  async getConfig(): Promise<ShareConfigDto> {
    return {
      statusConfig: {
        [ShareStatus.DISABLED]: "禁用",
        [ShareStatus.ENABLED]: "启用",
      },
    };
  }
}
