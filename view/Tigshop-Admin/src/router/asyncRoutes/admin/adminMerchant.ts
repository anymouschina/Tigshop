export default {
    path: "adminMerchant",
    name: "adminMerchant",
    redirect: "/adminMerchant/apply/list",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "商户" },
    children: [
        {
            path: "apply/list",
            name: "applyManage",
            meta: { title: "入驻申请" },
            component: () => import("@/views/adminMerchant/apply/List.vue")
        },
        {
            path: "list",
            name: "adminMerchantManage",
            meta: { title: "商户管理" },
            component: () => import("@/views/adminMerchant/merchant/List.vue")
        },
        {
            path: "merchantSettings/info",
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
};
