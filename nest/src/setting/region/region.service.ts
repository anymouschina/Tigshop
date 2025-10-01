// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateRegionDto, UpdateRegionDto } from "../dto/region.dto";

@Injectable()
export class RegionService {
  constructor(private prisma: PrismaService) {}

  async getFilterList(filter: any): Promise<any[]> {
    const { keyword = "", parent_id = 0, level = "" } = filter;

    const where: any = {};

    if (keyword) {
      where.name = {
        contains: keyword,
      };
    }

    if (parent_id !== undefined) {
      where.parent_id = parent_id;
    }

    if (level) {
      where.level = level;
    }

    return this.prisma.region.findMany({
      where,
      orderBy: [{ region_id: "asc" }],
    });
  }

  async getRegionTree(): Promise<any[]> {
    const regions = await this.prisma.region.findMany({
      orderBy: [{ region_id: "asc" }],
    });

    return this.buildTree(regions, 0);
  }

  // 兼容 Admin 列表接口：按父级、关键字、分页返回
  async getRegionListCompat(params: {
    parentId: number;
    page: number;
    size: number;
    keyword?: string;
  }) {
    const { parentId, page, size, keyword } = params;
    const where: any = { parent_id: parentId };
    if (keyword && keyword.length > 0) {
      where.region_name = { contains: keyword };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.region.count({ where }),
      this.prisma.region.findMany({
        where,
        orderBy: { region_id: "asc" },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      records: items.map((it) => ({
        regionId: it.region_id,
        regionName: it.region_name,
        level: it.level,
        parentId: it.parent_id,
        isHot: it.is_hot,
        firstWord: it.first_word,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size) || 1,
    };
  }

  private buildTree(regions: any[], parentId: number): any[] {
    return regions
      .filter((region) => region.parent_id === parentId)
      .map((region) => ({
        ...region,
        children: this.buildTree(regions, region.region_id),
      }));
  }

  async getDetail(id: number): Promise<any> {
    return this.prisma.region.findUnique({
      where: { region_id: id },
    });
  }

  async createRegion(createData: CreateRegionDto): Promise<any> {
    return this.prisma.region.create({
      data: {
        name: createData.name,
        parent_id: createData.parent_id,
        level: createData.level,
        code: createData.code,
        zip_code: createData.zip_code || "",
        first_letter: createData.first_letter || "",
        pinyin: createData.pinyin || "",
        lng: createData.lng || "",
        lat: createData.lat || "",
        sort: createData.sort || 0,
        is_using: createData.is_using || 1,
      },
    });
  }

  async updateRegion(id: number, updateData: UpdateRegionDto): Promise<any> {
    return this.prisma.region.update({
      where: { region_id: id },
      data: updateData,
    });
  }

  async deleteRegion(id: number): Promise<void> {
    // 检查是否有子地区
    const childrenCount = await this.prisma.region.count({
      where: { parent_id: id },
    });

    if (childrenCount > 0) {
      throw new Error("请先删除子地区");
    }

    await this.prisma.region.delete({
      where: { region_id: id },
    });
  }

  async getChildren(parentId: number): Promise<any[]> {
    return this.prisma.region.findMany({
      where: {
        parent_id: parentId,
      },
      orderBy: [{ region_id: "asc" }],
    });
  }

  async searchRegions(keyword: string): Promise<any[]> {
    return this.prisma.region.findMany({
      where: {
        OR: [
          {
            name: {
              contains: keyword,
            },
          },
          {
            pinyin: {
              contains: keyword,
            },
          },
          {
            first_letter: {
              contains: keyword,
            },
          },
        ],
        is_using: 1,
      },
      orderBy: {
        sort: "asc",
        region_id: "asc",
      },
      take: 50, // 限制返回数量
    });
  }
}
