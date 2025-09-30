// @ts-nocheck
import { Module } from "@nestjs/common";
import { AccountPanelModule } from "./account-panel/account-panel.module";
import { OrderInvoiceModule } from "./order-invoice/order-invoice.module";
import { PaylogModule } from "./paylog/paylog.module";
import { UserInvoiceModule } from "./user-invoice/user-invoice.module";
import { UserRechargeOrderModule } from "./user-recharge-order/user-recharge-order.module";
import { UserWithdrawApplyModule } from "./user-withdraw-apply/user-withdraw-apply.module";
import { RefundApplyModule } from "./refund-apply/refund-apply.module";
import { RefundLogModule } from "./refund-log/refund-log.module";
import { RefundModule } from "./refund/refund.module";
import { UserBalanceLogModule } from "./user-balance-log/user-balance-log.module";
import { StatementModule } from "./statement/statement.module";
import { BalanceModule } from "./balance/balance.module";
import { AdminPayLogCompatController } from "./admin-paylog-compat.controller";
import { AdminRefundApplyCompatController } from "./admin-refund-apply-compat.controller";
import { AdminUserWithdrawApplyCompatController } from "./admin-user-withdraw-apply-compat.controller";
import { AdminAccountPanelCompatController } from "./admin-account-panel-compat.controller";
import { AdminOrderInvoiceCompatController } from "./admin-order-invoice-compat.controller";
import { AdminUserBalanceLogCompatController } from "./admin-user-balance-log-compat.controller";
import { AdminUserInvoiceCompatController } from "./admin-user-invoice-compat.controller";
import { AdminUserRechargeOrderCompatController } from "./admin-user-recharge-order-compat.controller";
import { AdminStatementCompatController } from "./admin-statement-compat.controller";
import { AdminRefundLogCompatController } from "./admin-refund-log-compat.controller";

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
    RefundModule,
    UserBalanceLogModule,
    StatementModule,
    BalanceModule,
  ],
  controllers: [
    AdminPayLogCompatController,
    AdminRefundApplyCompatController,
    AdminRefundLogCompatController,
    AdminUserWithdrawApplyCompatController,
    AdminAccountPanelCompatController,
    AdminOrderInvoiceCompatController,
    AdminUserBalanceLogCompatController,
    AdminUserInvoiceCompatController,
    AdminUserRechargeOrderCompatController,
    AdminStatementCompatController,
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
    RefundModule,
    UserBalanceLogModule,
    StatementModule,
    BalanceModule,
  ],
})
export class FinanceModule {}
