// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateWechatLiveDto,
  UpdateWechatLiveDto,
  WechatLiveQueryDto,
  WechatLiveStatus,
  WechatLiveConfigDto,
} from "./dto/wechatLive.dto";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class WechatLiveService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: WechatLiveQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "live_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { live_id: { contains: keyword } },
        { title: { contains: keyword } },
        { room_id: { contains: keyword } },
        { status: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.wechat_live.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.wechat_live.count({ where }),
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
    const item = await this.prisma.wechat_live.findUnique({
      where: { live_id: id },
    });

    if (!item) {
      throw new NotFoundException("微信直播不存在");
    }

    return item;
  }

  async create(createDto: CreateWechatLiveDto) {
    const item = await this.prisma.wechat_live.create({
      data: {
        title: createDto.title,
        start_time: Math.floor(new Date(createDto.startTime).getTime() / 1000),
        end_time: Math.floor(new Date(createDto.endTime).getTime() / 1000),
        status: createDto.status,
        cover_image: createDto.coverImage,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateWechatLiveDto) {
    const item = await this.prisma.wechat_live.findUnique({
      where: { live_id: id },
    });

    if (!item) {
      throw new NotFoundException("微信直播不存在");
    }

    const updateData: any = {};
    if (updateDto.title !== undefined) {
      updateData.title = updateDto.title;
    }
    if (updateDto.startTime !== undefined) {
      updateData.start_time = Math.floor(
        new Date(updateDto.startTime).getTime() / 1000,
      );
    }
    if (updateDto.endTime !== undefined) {
      updateData.end_time = Math.floor(
        new Date(updateDto.endTime).getTime() / 1000,
      );
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }
    if (updateDto.coverImage !== undefined) {
      updateData.cover_image = updateDto.coverImage;
    }

    const updatedItem = await this.prisma.wechat_live.update({
      where: { live_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.wechat_live.findUnique({
      where: { live_id: id },
    });

    if (!item) {
      throw new NotFoundException("微信直播不存在");
    }

    await this.prisma.wechat_live.delete({
      where: { live_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.wechat_live.deleteMany({
      where: { live_id: { in: ids } },
    });
  }

  async getConfig(): Promise<WechatLiveConfigDto> {
    return {
      statusConfig: {
        [WechatLiveStatus.PENDING]: "待审核",
        [WechatLiveStatus.LIVE]: "直播中",
        [WechatLiveStatus.ENDED]: "已结束",
      },
    };
  }
}
