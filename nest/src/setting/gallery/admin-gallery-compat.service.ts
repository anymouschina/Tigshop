// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminGalleryCompatService {
  constructor(private readonly prisma: PrismaService) {}

  async getGalleryList(filter: { gallery_id?: number; page?: number; size?: number; sort_field?: string; sort_order?: "asc" | "desc" }) {
    const page = Number(filter.page || 1);
    const size = Number(filter.size || 15);
    const parentId = Number(filter.gallery_id || 0);
    const sortField = filter.sort_field || "gallery_id";
    const sortOrder = filter.sort_order || "desc";

    const [records, total] = await Promise.all([
      this.prisma.gallery.findMany({
        where: { parent_id: parentId },
        orderBy: { [sortField]: sortOrder },
      }),
      this.prisma.gallery.count({ where: { parent_id: parentId } }),
    ]);

    // 附带每个相册下的前4张图片（与 PHP 行为一致）
    const galleryIds = records.map((g) => g.gallery_id);
    let picsMap: Record<number, any[]> = {};
    if (galleryIds.length) {
      const pics = await this.prisma.gallery_pic.findMany({
        where: { gallery_id: { in: galleryIds as any } },
        orderBy: { pic_id: "desc" },
        take: 4, // 注意：Prisma 的 take 会应用到整个查询，这里简单策略是后续分组时截取
      });
      // 由于 take 应用于整体，这里重新按相册单独查询保证每个相册最多4张
      const perGalleryPromises = galleryIds.map((gid) =>
        this.prisma.gallery_pic.findMany({ where: { gallery_id: gid }, orderBy: { pic_id: "desc" }, take: 4 })
      );
      const perGallery = await Promise.all(perGalleryPromises);
      perGallery.forEach((arr, idx) => {
        picsMap[galleryIds[idx]] = arr.map((p) => ({
          picId: p.pic_id,
          picUrl: p.pic_url,
          picName: p.pic_name,
          picThumb: p.pic_thumb,
        }));
      });
    }

    return {
      records: records.map((g) => ({
        galleryId: g.gallery_id,
        parentId: g.parent_id,
        galleryAdminId: g.gallery_admin_id,
        galleryName: g.gallery_name,
        gallerySort: g.gallery_sort,
        galleryThumb: g.gallery_thumb,
        shopId: g.shop_id,
        galleryPics: picsMap[g.gallery_id] || [],
      })),
      total,
      page,
      size,
    };
  }

  async getGalleryDetail(id: number) {
    const g = await this.prisma.gallery.findUnique({ where: { gallery_id: id } });
    if (!g) throw new NotFoundException("相册不存在");
    return {
      galleryId: g.gallery_id,
      parentId: g.parent_id,
      galleryAdminId: g.gallery_admin_id,
      galleryName: g.gallery_name,
      gallerySort: g.gallery_sort,
      galleryThumb: g.gallery_thumb,
      shopId: g.shop_id,
    };
  }

  async createGallery(data: { parentId?: number; galleryName: string; gallerySort?: number }) {
    if (!data.galleryName) throw new BadRequestException("相册名称不能为空");
    const created = await this.prisma.gallery.create({
      data: {
        parent_id: data.parentId || 0,
        gallery_name: data.galleryName,
        gallery_sort: data.gallerySort ?? 50,
      },
    });
    return { id: created.gallery_id };
  }

  async updateGallery(id: number, data: { galleryName?: string; gallerySort?: number }) {
    const exists = await this.prisma.gallery.findUnique({ where: { gallery_id: id } });
    if (!exists) throw new NotFoundException("相册不存在");
    await this.prisma.gallery.update({
      where: { gallery_id: id },
      data: {
        gallery_name: data.galleryName ?? undefined,
        gallery_sort: data.gallerySort ?? undefined,
      },
    });
    return true;
  }

  async updateGalleryField(id: number, field: string, val: any) {
    const allowed: Record<string, string> = { galleryName: "gallery_name", gallerySort: "gallery_sort" };
    const column = allowed[field];
    if (!column) throw new BadRequestException("不支持的字段");
    await this.prisma.gallery.update({ where: { gallery_id: id }, data: { [column]: val } as any });
    return true;
  }

  async deleteGallery(id: number) {
    await this.prisma.gallery.delete({ where: { gallery_id: id } });
    return true;
  }

  async getGalleryPicList(filter: { gallery_id?: number; page?: number; size?: number; sort_order?: "asc" | "desc" }) {
    const page = Number(filter.page || 1);
    const size = Number(filter.size || 15);
    const sortOrder = filter.sort_order || "desc";
    const galleryId = Number(filter.gallery_id || 0);
    const skip = (page - 1) * size;

    const [pics, total] = await Promise.all([
      this.prisma.gallery_pic.findMany({
        where: galleryId > 0 ? { gallery_id: galleryId } : undefined,
        orderBy: { pic_id: sortOrder },
        skip,
        take: size,
      }),
      this.prisma.gallery_pic.count({ where: galleryId > 0 ? { gallery_id: galleryId } : undefined }),
    ]);

    const childGalleryList = await this.prisma.gallery.findMany({ where: { parent_id: galleryId } });
    const childWithThumbs = await Promise.all(
      childGalleryList.map(async (g) => {
        const four = await this.prisma.gallery_pic.findMany({ where: { gallery_id: g.gallery_id }, orderBy: { pic_id: "desc" }, take: 4 });
        return {
          galleryId: g.gallery_id,
          parentId: g.parent_id,
          galleryAdminId: g.gallery_admin_id,
          galleryName: g.gallery_name,
          gallerySort: g.gallery_sort,
          galleryThumb: g.gallery_thumb,
          shopId: g.shop_id,
          galleryPics: four.map((p) => ({ picId: p.pic_id, picUrl: p.pic_url, picName: p.pic_name, picThumb: p.pic_thumb })),
        };
      })
    );

    return {
      galleryInfo: galleryId > 0 ? await this.getGalleryDetail(galleryId) : { galleryId: 0, parentId: 0 },
      galleryPicPage: {
        records: pics.map((p) => ({
          picId: p.pic_id,
          galleryId: p.gallery_id,
          picUrl: p.pic_url,
          picName: p.pic_name,
          picThumb: p.pic_thumb,
        })),
        total,
        page,
        size,
      },
      childGalleryList: childWithThumbs,
    };
  }

  async updateGalleryPicField(id: number, field: string, val: any) {
    const allowed: Record<string, string> = { picName: "pic_name" };
    const column = allowed[field];
    if (!column) throw new BadRequestException("不支持的字段");
    await this.prisma.gallery_pic.update({ where: { pic_id: id }, data: { [column]: val } as any });
    return true;
  }

  async deleteGalleryPic(id: number) {
    await this.prisma.gallery_pic.delete({ where: { pic_id: id } });
    return true;
  }
}
