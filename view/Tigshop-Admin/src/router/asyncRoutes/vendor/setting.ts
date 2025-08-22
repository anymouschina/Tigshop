export default {
    path: "/setting",
    name: "setting",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "设置" },
    children: [
        {
            path: "",
            name: "vendorSetting",
            meta: { title: "供应商设置" },
            redirect: "/setting/vendor-info",
            children: [
                {
                    path: "vendor-info",
                    name: "vendorInfoManage",
                    meta: { title: "供应商信息" },
                    component: () => import("@/views/vendor/setting/vendorInfo/Index.vue")
                },
                {
                    path: "vendor-setting",
                    name: "vendorSettingManage",
                    meta: { title: "供应商设置" },
                    component: () => import("@/views/vendor/setting/vendorSetting/Index.vue")
                },
            ]
        },
        {
            path: "",
            name: "accountManagement",
            meta: { title: "账号管理" },
            redirect: "/setting/account-editing/index",
            children: [
                {
                    path: "account-editing/index",
                    name: "accountEditingManage",
                    meta: { title: "账号设置" },
                    component: () => import("@/views/authority/accountEditing/Index.vue")
                },
                {
                    path: "shop-role/list",
                    name: "vendorRoleManage",
                    meta: { title: "角色管理" },
                    component: () => import("@/views/authority/adminRole/List.vue")
                },
                {
                    path: "employee/list",
                    name: "EmployeeManagement",
                    meta: { title: "员工管理" },
                    component: () => import("@/views/vendor/setting/adminUser/List.vue")
                },
                {
                    path: "employee-log/list",
                    name: "EmployeeLogManagement",
                    meta: { title: "操作日志" },
                    component: () => import("@/views/merchant/setting/employeeLog/List.vue")
                }
            ]
        }
    ]
};
