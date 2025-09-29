import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AdminGalleryCompatService } from "./admin-gallery-compat.service";

@Controller("adminapi/setting/gallery")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminGalleryController {
  constructor(private readonly svc: AdminGalleryCompatService) {}

  // 列表，支持传 galleryId 查看子级
  @Get("list")
  @Authorities("galleryManage")
  async list(@Query("galleryId") galleryId?: string, @Query("page") page?: string, @Query("size") size?: string) {
    const data = await this.svc.getGalleryList({ gallery_id: Number(galleryId || 0), page: Number(page || 1), size: Number(size || 15) });
    return { code: 0, message: "success", data };
  }

  @Get("detail")
  @Authorities("galleryManage")
  async detail(@Query("id") id: string) {
    const data = await this.svc.getGalleryDetail(Number(id));
    return { code: 0, message: "success", data };
  }

  @Post("create")
  @Authorities("galleryManage")
  async create(@Body() body: any) {
    const { parentId, galleryName, gallerySort } = body || {};
    const res = await this.svc.createGallery({ parentId: Number(parentId || 0), galleryName, gallerySort: gallerySort != null ? Number(gallerySort) : undefined });
    return { code: 0, message: "success", data: res };
  }

  @Post("update")
  @Authorities("galleryManage")
  async update(@Body() body: any) {
    const { id, galleryName, gallerySort } = body || {};
    await this.svc.updateGallery(Number(id), { galleryName, gallerySort: gallerySort != null ? Number(gallerySort) : undefined });
    return { code: 0, message: "success" };
  }

  @Post("updateField")
  @Authorities("galleryManage")
  async updateField(@Body() body: any) {
    const { id, field, value } = body || {};
    await this.svc.updateGalleryField(Number(id), field, value);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @Authorities("galleryManage")
  async del(@Body("id") id: number) {
    await this.svc.deleteGallery(Number(id));
    return { code: 0, message: "success" };
  }
}
