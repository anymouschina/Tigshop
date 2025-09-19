import { Module } from '@nestjs/common';
import { LogisticsCompanyController } from './logistics-company.controller';
import { LogisticsCompanyService } from './logistics-company.service';
import { MessageTemplateController } from './message-template.controller';
import { MessageTemplateService } from './message-template.service';
import { MailTemplateController } from './mail-template.controller';
import { MailTemplateService } from './mail-template.service';
import { MessageTypeController } from './message-type.controller';
import { MessageTypeService } from './message-type.service';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma.service';
import { RegionModule } from './region/region.module';

@Module({
  imports: [
    RegionModule,
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
  ],
})
export class SettingModule {}