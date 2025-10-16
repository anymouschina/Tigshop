// @ts-nocheck
import { Module } from "@nestjs/common";
import { LogisticsCompanyController } from "./logistics-company.controller";
import { AdminLogisticsCompanyCompatController } from "./admin-logistics-company-compat.controller";
import { LogisticsCompanyService } from "./logistics-company.service";
import { MessageTemplateController } from "./message-template.controller";
import { MessageTemplateService } from "./message-template.service";
import { MailTemplateController } from "./mail-template.controller";
import { MailTemplateService } from "./mail-template.service";
import { MessageTypeController } from "./message-type.controller";
import { MessageTypeService } from "./message-type.service";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";

import { RegionModule } from "./region/region.module";
import { AppVersionModule } from "./app-version/appVersion.module";
import { ShippingTplModule } from "./shipping-tpl/shippingTpl.module";
import { ShippingTypeModule } from "./shipping-type/shippingType.module";
import { GalleryModule } from "./gallery/gallery.module";
import { FriendLinksModule } from "./friend-links/friendLinks.module";
import { LicensedModule } from "./licensed/licensed.module";
import { AdminPrintCompatController } from "src/print/admin-print-compat.controller";
import { AdminShippingTplCompatController } from "./shipping-tpl/admin-shipping-tpl-compat.controller";
import { AdminFriendLinksCompatController } from "./friend-links/admin-friendLinks-compat.controller";
import { AdminAppVersionCompatController } from "./app-version/admin-appVersion-compat.controller";
import { AdminMessageTypeCompatController } from "./message-type/admin-message-type-compat.controller";
import { AdminMailTemplatesCompatController } from "./mail-templates/admin-mailTemplates-compat.controller";

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
    AdminLogisticsCompanyCompatController,
    AdminPrintCompatController,
    AdminShippingTplCompatController,
    AdminFriendLinksCompatController,
    AdminAppVersionCompatController,
    AdminMessageTypeCompatController,
    AdminMailTemplatesCompatController,
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
