// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  CreateLicensedDto,
  UpdateLicensedDto,
  LicensedQueryDto,
  LicensedStatus,
  LicensedConfigDto,
} from "./dto/licensed.dto";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class LicensedService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(queryDto: LicensedQueryDto) {
    const {
      keyword,
      page = 1,
      size = 15,
      status,
      sortField = "licensed_id",
      sortOrder = "desc",
    } = queryDto;

    const skip = (page - 1) * size;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { licensed_id: { contains: keyword } },
        { domain: { contains: keyword } },
        { license_key: { contains: keyword } },
        { status: { contains: keyword } },
      ];
    }

    if (status !== undefined) {
      where.status = status;
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [records, total] = await Promise.all([
      this.prisma.licensed.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.licensed.count({ where }),
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
    const item = await this.prisma.licensed.findUnique({
      where: { licensed_id: id },
    });

    if (!item) {
      throw new NotFoundException("授权不存在");
    }

    return item;
  }

  async create(createDto: CreateLicensedDto) {
    const item = await this.prisma.licensed.create({
      data: {
        domain: createDto.domain,
        license_key: createDto.licenseKey,
        expire_time: Math.floor(
          new Date(createDto.expireTime).getTime() / 1000,
        ),
        status: createDto.status,
        add_time: Math.floor(Date.now() / 1000),
      },
    });

    return item;
  }

  async update(id: number, updateDto: UpdateLicensedDto) {
    const item = await this.prisma.licensed.findUnique({
      where: { licensed_id: id },
    });

    if (!item) {
      throw new NotFoundException("授权不存在");
    }

    const updateData: any = {};
    if (updateDto.domain !== undefined) {
      updateData.domain = updateDto.domain;
    }
    if (updateDto.licenseKey !== undefined) {
      updateData.license_key = updateDto.licenseKey;
    }
    if (updateDto.expireTime !== undefined) {
      updateData.expire_time = Math.floor(
        new Date(updateDto.expireTime).getTime() / 1000,
      );
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const updatedItem = await this.prisma.licensed.update({
      where: { licensed_id: id },
      data: updateData,
    });

    return updatedItem;
  }

  async delete(id: number) {
    const item = await this.prisma.licensed.findUnique({
      where: { licensed_id: id },
    });

    if (!item) {
      throw new NotFoundException("授权不存在");
    }

    await this.prisma.licensed.delete({
      where: { licensed_id: id },
    });
  }

  async batchDelete(ids: number[]) {
    await this.prisma.licensed.deleteMany({
      where: { licensed_id: { in: ids } },
    });
  }

  async getConfig(): Promise<LicensedConfigDto> {
    return {
      statusConfig: {
        [LicensedStatus.INVALID]: "无效",
        [LicensedStatus.VALID]: "有效",
        [LicensedStatus.EXPIRED]: "已过期",
      },
    };
  }
}
