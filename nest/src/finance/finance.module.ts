import { Module } from '@nestjs/common';
import { AccountPanelModule } from './account-panel/account-panel.module';
import { OrderInvoiceModule } from './order-invoice/order-invoice.module';
import { PaylogModule } from './paylog/paylog.module';

@Module({
  imports: [
    AccountPanelModule,
    OrderInvoiceModule,
    PaylogModule,
  ],
  exports: [
    AccountPanelModule,
    OrderInvoiceModule,
    PaylogModule,
  ],
})
export class FinanceModule {}