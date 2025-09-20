// @ts-nocheck
import { Module } from "@nestjs/common";
import { LogisticsCompanyController } from "./logistics-company.controller";
import { LogisticsCompanyService } from "./logistics-company.service";
import { MessageTemplateController } from "./message-template.controller";
import { MessageTemplateService } from "./message-template.service";
import { MailTemplateController } from "./mail-template.controller";
import { MailTemplateService } from "./mail-template.service";
import { MessageTypeController } from "./message-type.controller";
import { MessageTypeService } from "./message-type.service";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";
import { PrismaService } from "../prisma.service";
import { RegionModule } from "./region/region.module";
import { AppVersionModule } from "./app-version/appVersion.module";
import { ShippingTplModule } from "./shipping-tpl/shippingTpl.module";
import { ShippingTypeModule } from "./shipping-type/shippingType.module";
import { GalleryModule } from "./gallery/gallery.module";
import { FriendLinksModule } from "./friend-links/friendLinks.module";
import { LicensedModule } from "./licensed/licensed.module";

@Module({
  imports: [
    RegionModule,
    AppVersionModule,
    ShippingTplModule,
    ShippingTypeModule,
    GalleryModule,
    FriendLinksModule,
    LicensedModule,
  ],
  controllers: [
    LogisticsCompanyController,
    MessageTemplateController,
    MailTemplateController,
    MessageTypeController,
    ConfigController,
  ],
  providers: [
    LogisticsCompanyService,
    MessageTemplateService,
    MailTemplateService,
    MessageTypeService,
    ConfigService,
    PrismaService,
  ],
  exports: [
    LogisticsCompanyService,
    MessageTemplateService,
    MailTemplateService,
    MessageTypeService,
    ConfigService,
    RegionModule,
    AppVersionModule,
    ShippingTplModule,
    ShippingTypeModule,
    GalleryModule,
    FriendLinksModule,
    LicensedModule,
  ],
})
export class SettingModule {}
