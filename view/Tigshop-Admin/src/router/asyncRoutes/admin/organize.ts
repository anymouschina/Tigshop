export default {
    path: "/organize",
    name: "organize",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "组织" },
    children: [
        {
            path: "",
            name: "shopManagement",
            meta: { title: "店铺管理" },
            redirect: "/shop/list",
            children: [
                {
                    path: "shop/list",
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
            name: "vendorManage",
            meta: { title: "供应商管理" },
            redirect: "/suppliers/list",
            children: [
                {
                    path: "suppliers/list",
                    name: "suppliersManage",
                    meta: { title: "供应商列表" },
                    component: () => import("@/views/vendor/supplier/suppliers/List.vue")
                },
                {
                    path: "setting",
                    name: "vendorSettingManage",
                    meta: { title: "供应商设置" },
                    component: () => import("@/views/vendor/setting/adminSetting/Index.vue")
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
                },
                // {
                //     path: "admin-user/list",
                //     name: "vendorUserManage",
                //     meta: { title: "管理员列表" },
                //     component: () => import("@/views/vendor/setting/adminUser/List.vue")
                // },
            ]
        },
        {
            path: "",
            name: "adminMerchant",
            meta: { title: "商户管理" },
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
                    meta: { title: "商户列表" },
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
