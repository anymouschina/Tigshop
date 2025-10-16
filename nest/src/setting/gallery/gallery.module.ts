// @ts-nocheck
import { Module } from "@nestjs/common";
import { GalleryService } from "./gallery.service";
import { GalleryController } from "./gallery.controller";
import { AdminGalleryController } from "./admin-gallery.controller";
import { AdminGalleryPicController } from "./admin-gallery-pic.controller";
import { AdminGalleryCompatService } from "./admin-gallery-compat.service";
import { UploadModule } from "src/upload/upload.module";

@Module({
  imports: [UploadModule],
  controllers: [
    GalleryController,
    AdminGalleryController,
    AdminGalleryPicController,
  ],
  providers: [GalleryService, AdminGalleryCompatService],
  exports: [GalleryService, AdminGalleryCompatService],
})
export class GalleryModule {}
