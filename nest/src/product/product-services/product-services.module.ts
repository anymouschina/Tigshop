// @ts-nocheck
import { Module } from '@nestjs/common';
import { ProductServicesController } from './product-services.controller';
import { ProductServicesService } from './product-services.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductServicesController],
  providers: [ProductServicesService],
  exports: [ProductServicesService],
})
export class ProductServicesModule {}
