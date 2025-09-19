import { Module } from '@nestjs/common';
import { ShippingTplService } from './shippingTpl.service';
import { ShippingTplController } from './shippingTpl.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShippingTplController],
  providers: [ShippingTplService],
  exports: [ShippingTplService],
})
export class ShippingTplModule {}
