import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { DatabaseService } from 'src/database/database.service';
import { OrderModule } from 'src/order/order.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, DatabaseService],
  imports: [OrderModule],
  exports: [PaymentService],
})
export class PaymentModule {}