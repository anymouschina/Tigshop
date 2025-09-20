import { Module } from '@nestjs/common';
import { PriceInquiryController } from './price-inquiry.controller';
import { PriceInquiryService } from './price-inquiry.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PriceInquiryController],
  providers: [PriceInquiryService],
  exports: [PriceInquiryService],
})
export class PriceInquiryModule {}