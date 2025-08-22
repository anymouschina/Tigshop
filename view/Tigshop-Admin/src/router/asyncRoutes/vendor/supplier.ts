import NotFound from "@/layouts/blank/blank.vue";
export default {
    path: "/",
    name: "vendor",
    redirect: "/",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "供应商" },
    children: [
        {
            path: "/",
            name: "consoleManage",
            meta: { title: "概览" },
            component: () => import("@/views/vendor/panel/Index.vue")
        },
        {
            path: "",
            name: "orderManagement",
            meta: { title: "订单管理" },
            children: [
                {
                    path: "order/list",
                    name: "orderManage",
                    meta: { title: "全部订单" },
                    component: () => import("@/views/order/order/List.vue")
                },
                {
                    path: "order/deliverlist",
                    name: "deliverManage",
                    meta: { title: "发货管理" },
                    component: () => import("@/views/order/order/Deliverlist.vue")
                },
                {
                    path: "order-export/list",
                    name: "orderExportManage",
                    meta: { title: "订单导出" },
                    component: () => import("@/views/order/orderExport/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "aftersaleManagement",
            meta: { title: "售后管理" },
            children: [
                {
                    path: "order/aftersales/list",
                    name: "aftersalesManage",
                    meta: { title: "售后订单" },
                    component: () => import("@/views/order/aftersales/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "commodityManage",
            meta: { title: "商品管理" },
            children: [
                {
                    path: "product/list",
                    name: "productManage",
                    meta: { title: "商品列表" },
                    component: () => import("@/views/vendor/supplier/product/List.vue")
                },
                {
                    path: "bind-shop/list",
                    name: "bindShopManager",
                    meta: { title: "关联店铺" },
                    component: () => import("@/views/vendor/supplier/bindShop/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "capitalfund",
            meta: { title: "财务中心" },
            children: [
                {
                    path: "dashboard/index",
                    name: "dashboardManage",
                    meta: { title: "资金概览" },
                    component: () => import("@/views/vendor/finance/dashboard/Index.vue")
                },
                {
                    path: "balance/list",
                    name: "balanceManage",
                    meta: { title: "供应商资金" },
                    component: () => import("@/views/vendor/finance/balance/List.vue")
                },
                {
                    path: "withdraw/index",
                    name: "withdrawManage",
                    meta: { title: "提现管理" },
                    component: () => import("@/views/vendor/finance/withdraw/Index.vue")
                },
                {
                    path: "account/list",
                    name: "accountListManage",
                    meta: { title: "账户管理" },
                    component: () => import("@/views/vendor/finance/account/List.vue")
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
                    path: "financial-log/list",
                    name: "financialLogManage",
                    meta: { title: "资金明细" },
                    component: () => import("@/views/vendor/finance/financialLog/List.vue")
                }
            ]
        },
        {
            path: "/:pathMatch(.*)",
            name: "notFound",
            meta: { is404: true },
            component: NotFound
        }
    ]
};
