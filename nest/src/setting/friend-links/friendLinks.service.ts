// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import {
  CreateFriendLinksDto,
  UpdateFriendLinksDto,
  FriendLinksQueryDto,
  FriendLinksStatus,
  FriendLinksConfigDto,
} from "./dto/friendLinks.dto";

@Injectable()
export class FriendLinksService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: FriendLinksQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "link_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { link_id: { contains: keyword } },
        { name: { contains: keyword } },
        { url: { contains: keyword } },
        { logo: { contains: keyword } },
        { sort: { contains: keyword } },
        { status: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.friend_links.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.friend_links.count({ where }),
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
    const item = await this.prisma.friend_links.findUnique({
      where: { link_id: id },
    });

    if (!item) {
      throw new NotFoundException("友情链接不存在");
    }

    return item;
  }

  async create(createDto: CreateFriendLinksDto) {
    const item = await this.prisma.friend_links.create({
      data: {
        name: createDto.name,
        url: createDto.url,
        logo: createDto.logo,
        sort: createDto.sort,
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateFriendLinksDto) {
    const item = await this.prisma.friend_links.findUnique({
      where: { link_id: id },
    });

    if (!item) {
      throw new NotFoundException("友情链接不存在");
    }

    const updateData: any = {};
    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name;
    }
    if (updateDto.url !== undefined) {
      updateData.url = updateDto.url;
    }
    if (updateDto.logo !== undefined) {
      updateData.logo = updateDto.logo;
    }
    if (updateDto.sort !== undefined) {
      updateData.sort = updateDto.sort;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.friend_links.update({
      where: { link_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.friend_links.findUnique({
      where: { link_id: id },
    });

    if (!item) {
      throw new NotFoundException("友情链接不存在");
    }

    await this.prisma.friend_links.delete({
      where: { link_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.friend_links.deleteMany({
      where: { link_id: { in: ids } },
    });
  }

  async getConfig(): Promise<FriendLinksConfigDto> {
    return {
      statusConfig: {
        [FriendLinksStatus.DISABLED]: "禁用",
        [FriendLinksStatus.ENABLED]: "启用",
      },
    };
  }
}
