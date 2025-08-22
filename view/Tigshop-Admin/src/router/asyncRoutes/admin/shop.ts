export default {
    path: "/shop",
    name: "shop",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "店铺" },
    children: [
        {
            path: "",
            name: "shopManagement",
            meta: { title: "店铺管理" },
            redirect: "/shop/list",
            children: [
                {
                    path: "list",
                    name: "shopManage",
                    meta: { title: "店铺列表" },
                    component: () => import("@/views/shop/shop/List.vue")
                },
                {
                    path: "shop-settings/info",
                    name: "shopSettingsManage",
                    meta: { title: "店铺设置" },
                    component: () => import("@/views/shop/shopSettings/Info.vue")
                }
            ]
        },

        {
            path: "",
            name: "fundsManagement",
            meta: { title: "资金管理" },
            redirect: "/shop/shop-account/list",
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
                    path: "financial-log/list",
                    name: "financialLogManage",
                    meta: { title: "资金日志" },
                    component: () => import("@/views/shop/financialLog/List.vue")
                }
            ]
        },

        {
            path: "",
            name: "adminMerchant",
            meta: { title: "商家管理" },
            redirect: "/shop/apply/list",
            children: [
                {
                    path: "apply/list",
                    name: "applyManage",
                    meta: { title: "入驻申请" },
                    component: () => import("@/views/adminMerchant/apply/List.vue")
                },
                {
                    path: "merchant-list",
                    name: "adminMerchantManage",
                    meta: { title: "商户管理" },
                    component: () => import("@/views/adminMerchant/merchant/List.vue")
                },
                {
                    path: "merchant-settings/info",
                    name: "adminMerchantSettingsManage",
                    meta: { title: "商户设置" },
                    component: () => import("@/views/adminMerchant/merchantSettings/Info.vue")
                },
                {
                    path: "investment",
                    name: "investmentManage",
                    meta: { title: "招商内容" },
                    component: () => import("@/views/adminMerchant/investment/Info.vue")
                }
            ]
        }
    ]
};
