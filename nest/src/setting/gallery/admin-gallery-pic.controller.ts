import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { AdminGalleryCompatService } from "./admin-gallery-compat.service";
import { UploadService } from "src/upload/upload.service";
import { UploadType } from "src/upload/dto/upload.dto";

@Controller("adminapi/setting/galleryPic")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminGalleryPicController {
  constructor(
    private readonly svc: AdminGalleryCompatService,
    private readonly uploadService: UploadService,
  ) {}

  @Get("list")
  @Authorities("galleryPicManage")
  async list(
    @Query("galleryId") galleryId?: string,
    @Query("page") page?: string,
    @Query("size") size?: string,
  ) {
    const data = await this.svc.getGalleryPicList({
      gallery_id: Number(galleryId || 0),
      page: Number(page || 1),
      size: Number(size || 15),
    });
    return { code: 0, message: "success", data };
  }

  @Post("updateField")
  @Authorities("galleryPicManage")
  async updateField(@Body() body: any) {
    const { id, field, value } = body || {};
    await this.svc.updateGalleryPicField(Number(id), field, value);
    return { code: 0, message: "success" };
  }

  @Post("del")
  @Authorities("galleryPicManage")
  async del(@Body("id") id: number) {
    await this.svc.deleteGalleryPic(Number(id));
    return { code: 0, message: "success" };
  }

  @Post("uploadImg")
  @UseInterceptors(FileInterceptor("file"))
  @Authorities("galleryPicManage")
  async uploadImg(
    @UploadedFile() file: Express.Multer.File,
    @Query("galleryId") galleryId?: string,
  ) {
    const gid = Number(galleryId || 0);
    if (!gid) return { code: 1, message: "缺少相册ID" };

    // 借用系统上传服务进行保存，拿到URL等信息
    const uploaded = await this.uploadService.uploadFile(
      file,
      { type: UploadType.OTHER, relatedId: gid, description: "gallery_pic" },
      undefined,
    );
    // uploaded 包含 fileUrl/thumbnailUrl/fileName
    const url = uploaded?.fileUrl || uploaded?.filePath || uploaded?.file_url;
    const thumb = uploaded?.thumbnailUrl || url;
    const name = uploaded?.fileName || file?.originalname || "image";

    // 落库到 gallery_pic
    // 需要 PrismaService，这里通过 svc 内的 prisma
    // @ts-ignore accessing internal prisma
    const prisma = (this.svc as any).prisma;
    const created = await prisma.gallery_pic.create({
      data: {
        gallery_id: gid,
        pic_url: url,
        pic_thumb: thumb,
        pic_name: name,
      },
    });

    return {
      code: 0,
      message: "success",
      data: {
        picId: created.pic_id,
        picUrl: created.pic_url,
        picThumb: created.pic_thumb,
        picName: created.pic_name,
      },
    };
  }
}
