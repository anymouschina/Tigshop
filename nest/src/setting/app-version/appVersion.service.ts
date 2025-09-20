// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateAppVersionDto,
  UpdateAppVersionDto,
  AppVersionQueryDto,
  AppVersionStatus,
  AppVersionConfigDto
} from './dto/appVersion.dto';

@Injectable()
export class AppVersionService {
  constructor(private readonly prisma: DatabaseService) {}

  async findAll(queryDto: AppVersionQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = 'version_id',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { version_id: { contains: keyword } },
        { version: { contains: keyword } },
        { build_number: { contains: keyword } },
        { download_url: { contains: keyword } },
        { update_log: { contains: keyword } },
        { status: { contains: keyword } },
        { force_update: { contains: keyword } }
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.app_version.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.app_version.count({ where }),
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
    const item = await this.prisma.app_version.findUnique({
      where: { version_id: id },
    });

    if (!item) {
      throw new NotFoundException('应用版本不存在');
    }

    return item;
  }

  async create(createDto: CreateAppVersionDto) {
    

    const item = await this.prisma.app_version.create({
      data: {
        version: createDto.version,
        build_number: createDto.buildNumber,
        download_url: createDto.downloadUrl,
        update_log: createDto.updateLog,
        status: createDto.status,
        force_update: createDto.forceUpdate,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateAppVersionDto) {
    const item = await this.prisma.app_version.findUnique({
      where: { version_id: id },
    });

    if (!item) {
      throw new NotFoundException('应用版本不存在');
    }

    const updateData: any = {};
    if (updateDto.version !== undefined) {
      updateData.version = updateDto.version;
    }
    if (updateDto.buildNumber !== undefined) {
      updateData.build_number = updateDto.buildNumber;
    }
    if (updateDto.downloadUrl !== undefined) {
      updateData.download_url = updateDto.downloadUrl;
    }
    if (updateDto.updateLog !== undefined) {
      updateData.update_log = updateDto.updateLog;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }
    if (updateDto.forceUpdate !== undefined) {
      updateData.force_update = updateDto.forceUpdate;
    }

    const updatedItem = await this.prisma.app_version.update({
      where: { version_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.app_version.findUnique({
      where: { version_id: id },
    });

    if (!item) {
      throw new NotFoundException('应用版本不存在');
    }

    await this.prisma.app_version.delete({
      where: { version_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.app_version.deleteMany({
      where: { version_id: { in: ids } },
    });
  }

  async getConfig(): Promise<AppVersionConfigDto> {
    return {
      statusConfig: {
        [AppVersionStatus.DRAFT]: '草稿',
        [AppVersionStatus.PUBLISHED]: '已发布'
      },
    };
  }
}
