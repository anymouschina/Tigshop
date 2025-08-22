import NotFound from "@/layouts/blank/blank.vue";

export default {
    path: "/",
    name: "panel",
    redirect: "/",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "店铺" },
    children: [
        {
            path: "/",
            name: "consoleManage",
            meta: { title: "概览" },
            component: () => import("@/views/panel/Index.vue")
        },
        {
            path: "",
            name: "orderManagement",
            meta: { title: "订单管理" },
            redirect: "/order/list",
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
            redirect: "/order/aftersales/list",
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
            redirect: "/order/product/list",
            children: [
                {
                    path: "product/list",
                    name: "productManage",
                    meta: { title: "商品列表" },
                    component: () => import("@/views/product/product/List.vue")
                },
                {
                    path: "shop-product-category/list",
                    name: "shopProductCategoryManage",
                    meta: { title: "分类管理" },
                    component: () => import("@/views/product/shopProductCategory/List.vue")
                },
                {
                    path: "product-group/list",
                    name: "productGroupManage",
                    meta: { title: "商品分组" },
                    component: () => import("@/views/product/productGroup/List.vue")
                },
                {
                    path: "brand/list",
                    name: "brandManage",
                    meta: { title: "品牌管理" },
                    component: () => import("@/views/product/brand/List.vue")
                },
                {
                    path: "comment/list",
                    name: "commentManage",
                    meta: { title: "评价管理" },
                    component: () => import("@/views/product/comment/List.vue")
                },
                {
                    path: "product-attributes-tpl/list",
                    name: "productAttributesTplManage",
                    meta: { title: "属性模板" },
                    component: () => import("@/views/product/productAttributesTpl/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "salesOverview",
            meta: { title: " 销售统计" },
            redirect: "/order/statistics-order/list",
            children: [
                {
                    path: "statistics-order/list/",
                    name: "statisticsOrder",
                    meta: { title: "销售概览" },
                    component: () => import("@/views/panel/statisticsOrder/List.vue")
                },
                {
                    path: "statistics-sale/list/",
                    name: "statisticsSale",
                    meta: { title: "销售明细" },
                    component: () => import("@/views/panel/statisticsSale/List.vue")
                },
                {
                    path: "statistics-goods/list/",
                    name: "statisticsGoods",
                    meta: { title: "销售排行" },
                    component: () => import("@/views/panel/statisticsGoods/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "stockControl",
            meta: { title: "库存管理" },
            redirect: "/order/product-inventory-lo/list",
            children: [
                {
                    path: "product-inventory-log/list",
                    name: "productInventoryLogManage",
                    meta: { title: "库存日志" },
                    component: () => import("@/views/product/productInventoryLog/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "capitalfund",
            meta: { title: "财务中心" },
            redirect: "/order/dashboard/index",
            children: [
                {
                    path: "dashboard/index",
                    name: "dashboardManage",
                    meta: { title: "资金概览" },
                    component: () => import("@/views/merchant/capitalfund/dashboard/Index.vue")
                },
                {
                    path: "balance/list",
                    name: "balanceManage",
                    meta: { title: "店铺资金" },
                    component: () => import("@/views/merchant/capitalfund/balance/List.vue")
                },
                {
                    path: "withdraw/index",
                    name: "withdrawManage",
                    meta: { title: "提现管理" },
                    component: () => import("@/views/merchant/capitalfund/withdraw/Index.vue")
                },
                {
                    path: "account/list",
                    name: "accountListManage",
                    meta: { title: "账户管理" },
                    component: () => import("@/views/merchant/capitalfund/account/List.vue")
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
                    path: "financial-log/list",
                    name: "financialLogManage",
                    meta: { title: "资金明细" },
                    component: () => import("@/views/shop/financialLog/List.vue")
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
