// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateGalleryDto,
  UpdateGalleryDto,
  GalleryQueryDto,
  GalleryStatus,
  GalleryConfigDto,
} from "./dto/gallery.dto";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: GalleryQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "gallery_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { gallery_id: { contains: keyword } },
        { name: { contains: keyword } },
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
      this.prisma.gallery.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.gallery.count({ where }),
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
    const item = await this.prisma.gallery.findUnique({
      where: { gallery_id: id },
    });

    if (!item) {
      throw new NotFoundException("图库不存在");
    }

    return item;
  }

  async create(createDto: CreateGalleryDto) {
    const item = await this.prisma.gallery.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        cover_image: createDto.coverImage,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateGalleryDto) {
    const item = await this.prisma.gallery.findUnique({
      where: { gallery_id: id },
    });

    if (!item) {
      throw new NotFoundException("图库不存在");
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }
    if (updateDto.coverImage !== undefined) {
      updateData.cover_image = updateDto.coverImage;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.gallery.update({
      where: { gallery_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.gallery.findUnique({
      where: { gallery_id: id },
    });

    if (!item) {
      throw new NotFoundException("图库不存在");
    }

    await this.prisma.gallery.delete({
      where: { gallery_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.gallery.deleteMany({
      where: { gallery_id: { in: ids } },
    });
  }

  async getConfig(): Promise<GalleryConfigDto> {
    return {
      statusConfig: {
        [GalleryStatus.DISABLED]: "禁用",
        [GalleryStatus.ENABLED]: "启用",
      },
    };
  }
}
