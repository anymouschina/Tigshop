// @ts-nocheck
import { Module } from '@nestjs/common';
import { AccountPanelModule } from './account-panel/account-panel.module';
import { OrderInvoiceModule } from './order-invoice/order-invoice.module';
import { PaylogModule } from './paylog/paylog.module';
import { UserInvoiceModule } from './user-invoice/user-invoice.module';
import { UserRechargeOrderModule } from './user-recharge-order/user-recharge-order.module';
import { UserWithdrawApplyModule } from './user-withdraw-apply/user-withdraw-apply.module';
import { RefundApplyModule } from './refund-apply/refund-apply.module';
import { RefundLogModule } from './refund-log/refund-log.module';
import { UserBalanceLogModule } from './user-balance-log/user-balance-log.module';
import { StatementModule } from './statement/statement.module';

@Module({
  imports: [
    AccountPanelModule,
    OrderInvoiceModule,
    PaylogModule,
    UserInvoiceModule,
    UserRechargeOrderModule,
    UserWithdrawApplyModule,
    RefundApplyModule,
    RefundLogModule,
    UserBalanceLogModule,
    StatementModule,
  ],
  exports: [
    AccountPanelModule,
    OrderInvoiceModule,
    PaylogModule,
    UserInvoiceModule,
    UserRechargeOrderModule,
    UserWithdrawApplyModule,
    RefundApplyModule,
    RefundLogModule,
    UserBalanceLogModule,
    StatementModule,
  ],
})
export class FinanceModule {}
