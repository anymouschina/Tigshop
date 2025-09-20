// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
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
      orderBy: {
        sort: "asc",
        region_id: "asc",
      },
    });
  }

  async getRegionTree(): Promise<any[]> {
    const regions = await this.prisma.region.findMany({
      where: {
        is_using: 1,
      },
      orderBy: {
        sort: "asc",
        region_id: "asc",
      },
    });

    return this.buildTree(regions, 0);
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
        is_using: 1,
      },
      orderBy: {
        sort: "asc",
        region_id: "asc",
      },
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
