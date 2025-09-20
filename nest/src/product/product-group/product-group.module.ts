import { Module } from '@nestjs/common';
import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from './product-group.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductGroupController],
  providers: [ProductGroupService],
  exports: [ProductGroupService],
})
export class ProductGroupModule {}