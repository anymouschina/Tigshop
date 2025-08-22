export default {
    path: "/suppliers",
    name: "vendor",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "供应商" },
    children: [
        {
            path: "",
            name: "vendorManage",
            meta: { title: "供应商管理" },
            redirect: "/suppliers/list",
            children: [
                {
                    path: "list",
                    name: "suppliersManage",
                    meta: { title: "供应商列表" },
                    component: () => import("@/views/vendor/supplier/suppliers/List.vue")
                },
                {
                    path: "product/list",
                    name: "vendorProductManage",
                    meta: { title: "供应商商品" },
                    component: () => import("@/views/vendor/supplier/product/List.vue")
                },
                {
                    path: "order/list",
                    name: "vendorOrderManage",
                    meta: { title: "供应商订单" },
                    component: () => import("@/views/vendor/supplier/order/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "vendorSetting",
            meta: { title: "供应商设置" },
            redirect: "/suppliers/admin-user/list",
            children: [
                {
                    path: "admin-user/list",
                    name: "vendorUserManage",
                    meta: { title: "管理员列表" },
                    component: () => import("@/views/vendor/setting/adminUser/List.vue")
                },
                {
                    path: "setting",
                    name: "vendorSettingManage",
                    meta: { title: "供应商设置" },
                    component: () => import("@/views/vendor/setting/adminSetting/Index.vue")
                }
            ]
        },
        {
            path: "",
            name: "vendorFundsManagement",
            meta: { title: "资金管理" },
            children: [
                {
                    path: "account/list",
                    name: "vendorAccountManage",
                    meta: { title: "资金概览" },
                    component: () => import("@/views/vendor/adminFunds/account/List.vue")
                },
                {
                    path: "funds/list",
                    name: "vendorFundsManage",
                    meta: { title: "供应商资金" },
                    component: () => import("@/views/vendor/adminFunds/shopFunds/List.vue")
                },
                {
                    path: "account-raply/list",
                    name: "vendorAccountRaplyManage",
                    meta: { title: "提现管理" },
                    component: () => import("@/views/vendor/adminFunds/shopAccountRaply/List.vue")
                },
                {
                    path: "financial-log/list",
                    name: "vendorFinancialLogManage",
                    meta: { title: "资金日志" },
                    component: () => import("@/views/vendor/adminFunds/financialLog/List.vue")
                }
            ]
        },

    ]
};
