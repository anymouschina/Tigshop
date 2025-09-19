import { Module } from '@nestjs/common';
import { OrderInvoiceService } from './order-invoice.service';
import { OrderInvoiceController } from './order-invoice.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [OrderInvoiceController],
  providers: [OrderInvoiceService, PrismaService],
  exports: [OrderInvoiceService],
})
export class OrderInvoiceModule {}