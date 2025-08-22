export default {
    path: "/finance",
    name: "finance",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "财务" },
    children: [
        {
            path: "",
            name: "userfundsManagement",
            meta: { title: "会员资金管理" },
            redirect: "/finance/account-panel/list",
            children: [
                {
                    path: "account-panel/list",
                    name: "accountPanelManage",
                    meta: { title: "资金总览" },
                    component: () => import("@/views/finance/accountPanel/List.vue")
                },
                {
                    path: "user-withdraw-apply/list",
                    name: "userWithdrawApplyManage",
                    meta: { title: "提现管理" },
                    component: () => import("@/views/finance/userWithdrawApply/List.vue")
                },
                {
                    path: "user-recharge-order/list",
                    name: "userRechargeOrderManage",
                    meta: { title: "充值管理" },
                    component: () => import("@/views/finance/userRechargeOrder/List.vue")
                },
                {
                    path: "distribution-commission/list",
                    name: "distributionCommissionManage",
                    meta: { title: "分销佣金" },
                    component: () => import("@/views/salesman/performanceSettlement/performanceSettlement/List.vue")
                },
                {
                    path: "integral-log/list",
                    name: "integralLogManage",
                    meta: { title: "积分日志" },
                    component: () => import("@/views/user/integralLog/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "profitsharingManage",
            meta: { title: "分账管理" },
            redirect: "/finance/profitsharing-setting",
            children: [
                {
                    path: "profitsharing-setting",
                    name: "profitsharingSettingManage",
                    meta: { title: "分账设置" },
                    component: () => import("@/views/finance/profitsharingSetting/Index.vue")
                },
                {
                    path: "withdrawal-setting",
                    name: "withdrawalSettingManage",
                    meta: { title: "提现设置" },
                    component: () => import("@/views/finance/withdrawalSetting/Index.vue")
                }
            ]
        },
        {
            path: "",
            name: "shopUserfundsManagement",
            meta: { title: "店铺资金管理" },
            redirect: "/finance/statement-download/list",
            children: [
                {
                    path: "shop-account/list",
                    name: "shopAccountManage",
                    meta: { title: "资金概览" },
                    component: () => import("@/views/shop/account/List.vue")
                },
                {
                    path: "shop-funds/list",
                    name: "shopFundsManage",
                    meta: { title: "店铺资金" },
                    component: () => import("@/views/shop/shopFunds/List.vue")
                },
                {
                    path: "statement-download/list",
                    name: "statementDownload",
                    meta: { title: "对账单下载" },
                    component: () => import("@/views/finance/shopFunds/statementDownload/List.vue")
                },
                {
                    path: "statement-details/list",
                    name: "statementDetails",
                    meta: { title: "对账单明细" },
                    component: () => import("@/views/finance/shopFunds/statementDetails/List.vue")
                },
                {
                    path: "shop-withdraw-apply/list",
                    name: "shopWithdrawApplyManage",
                    meta: { title: "提现管理" },
                    component: () => import("@/views/finance/shopFunds/shopAccountRaply/List.vue")
                },
                {
                    path: "shop-financial-log/list",
                    name: "financialLogManage",
                    meta: { title: "资金日志" },
                    component: () => import("@/views/shop/financialLog/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "vendorUserfundsManagement",
            meta: { title: "供应商资金管理" },
            redirect: "/finance/vendor-statement-download/list",
            children: [
                {
                    path: "vendor-account/list",
                    name: "vendorAccountManage",
                    meta: { title: "资金概览" },
                    component: () => import("@/views/vendor/adminFunds/account/List.vue")
                },
                {
                    path: "vendor-funds/list",
                    name: "vendorFundsManage",
                    meta: { title: "供应商资金" },
                    component: () => import("@/views/vendor/adminFunds/shopFunds/List.vue")
                },
                {
                    path: "vendor-statement-download/list",
                    name: "vendorStatementDownload",
                    meta: { title: "对账单下载" },
                    component: () => import("@/views/finance/vendorFunds/statementDownload/List.vue")
                },
                {
                    path: "vendor-statement-details/list",
                    name: "vendorStatementDetails",
                    meta: { title: "对账单明细" },
                    component: () => import("@/views/finance/vendorFunds/statementDetails/List.vue")
                },
                {
                    path: "vendor-withdraw-apply/list",
                    name: "vendorWithdrawApplyManage",
                    meta: { title: "提现管理" },
                    component: () => import("@/views/vendor/adminFunds/shopAccountRaply/List.vue")
                },
                {
                    path: "vendor-financial-log/list",
                    name: "vendorFinancialLogManage",
                    meta: { title: "资金日志" },
                    component: () => import("@/views/vendor/adminFunds/financialLog/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "userInvoice",
            meta: { title: "发票管理" },
            redirect: "/finance/user-invoice/list",
            children: [
                {
                    path: "user-invoice/list",
                    name: "userInvoiceManage",
                    meta: { title: "资质审核" },
                    component: () => import("@/views/finance/userInvoice/List.vue")
                },
                {
                    path: "order-invoice/list",
                    name: "orderInvoiceManage",
                    meta: { title: "发票申请" },
                    component: () => import("@/views/finance/orderInvoice/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "refundManagement",
            meta: { title: "退款管理" },
            redirect: "/finance/refund-apply/list",
            children: [
                {
                    path: "refund-apply/list",
                    name: "refundApplyManage",
                    meta: { title: "退款申请" },
                    component: () => import("@/views/finance/refundApply/List.vue")
                },
                {
                    path: "refund-log/list",
                    name: "refundLogManage",
                    meta: { title: "退款日志" },
                    component: () => import("@/views/finance/refundLog/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "transactionManagement",
            meta: { title: "交易管理" },
            redirect: "/finance/paylog/list",
            children: [
                {
                    path: "paylog/list",
                    name: "payLogManage",
                    meta: { title: "交易日志" },
                    component: () => import("@/views/finance/payLog/List.vue")
                },
                {
                    path: "user-balance-log/list",
                    name: "userBalanceLogManage",
                    meta: { title: "余额日志" },
                    component: () => import("@/views/finance/userBalanceLog/List.vue")
                }
            ]
        }
    ]
};

/**
 *  {
            path: "account_panel/list",
            name: "accountPanelManage",
            meta: { title: "账户总览" },
            component: () => import("@/views/finance/accountPanel/List.vue")
        },
        {
            path: "user_withdraw_apply/list",
            name: "userWithdrawApplyManage",
            meta: { title: "提现申请" },
            component: () => import("@/views/finance/userWithdrawApply/List.vue")
        },
        {
            path: "user_recharge_order/list",
            name: "userRechargeOrderManage",
            meta: { title: "充值记录" },
            component: () => import("@/views/finance/userRechargeOrder/List.vue")
        },
        {
            path: "user_balance_log/list",
            name: "userBalanceLogManage",
            meta: { title: "余额日志" },
            component: () => import("@/views/finance/userBalanceLog/List.vue")
        },
        {
            path: "",
            name: "userInvoice",
            meta: { title: "发票管理" },
            redirect: "/finance/user_invoice/list/",
            children: [
                {
                    path: "user_invoice/list/",
                    name: "userInvoiceManage",
                    meta: { title: "发票资质管理" },
                    component: () => import("@/views/finance/userInvoice/List.vue")
                },
                {
                    path: "order_invoice/list/",
                    name: "orderInvoiceManage",
                    meta: { title: "发票申请" },
                    component: () => import("@/views/finance/orderInvoice/List.vue")
                }
            ]
        },
        {
            path: "refund_apply/list",
            name: "refundApplyManage",
            meta: { title: "退款申请" },
            component: () => import("@/views/finance/refundApply/List.vue")
        },
        {
            path: "refund_log/list",
            name: "refundLogManage",
            meta: { title: "退款记录" },
            component: () => import("@/views/finance/refundLog/List.vue")
        },
        {
            path: "paylog/list",
            name: "payLogManage",
            meta: { title: "交易日志" },
            component: () => import("@/views/finance/payLog/List.vue")
        }
 * 
 */
