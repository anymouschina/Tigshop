import { Module } from '@nestjs/common';
import { UserInvoiceService } from './user-invoice.service';
import { UserInvoiceController } from './user-invoice.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserInvoiceController],
  providers: [UserInvoiceService],
  exports: [UserInvoiceService],
})
export class UserInvoiceModule {}