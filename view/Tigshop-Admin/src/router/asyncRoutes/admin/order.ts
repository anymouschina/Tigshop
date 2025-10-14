export default {
    path: "/order",
    name: "order",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "订单" },
    children: [
        {
            path: "",
            name: "orderManagement",
            meta: { title: "订单管理" },
            redirect: "/order/list",
            children: [
                {
                    path: "list",
                    name: "orderManage",
                    meta: { title: "全部订单" },
                    component: () => import("@/views/order/order/List.vue")
                },
                {
                    path: "deliverlist",
                    name: "deliverManage",
                    meta: { title: "发货管理" },
                    component: () => import("@/views/order/order/Deliverlist.vue")
                },
                {
                    path: "exchange-order/list",
                    name: "exchangeOrderManage",
                    meta: { title: "积分订单" },
                    component: () => import("@/views/order/orderExchange/List.vue")
                },
                {
                    path: "order-export/list",
                    name: "orderExportManage",
                    meta: { title: "订单导出" },
                    component: () => import("@/views/order/orderExport/List.vue")
                }
                ,
             
            ]
        },
           // 点餐管理分组（堂食/外带）
                {
                    path: "",
                    name: "dineManagement",
                    meta: { title: "点餐管理" },
                    redirect: "/order/dine/queue",
                    children: [
                        {
                            path: "queue",
                            name: "dineQueue",
                            meta: { title: "堂食/外带叫号" },
                            component: () => import("@/views/order/dine/Queue.vue")
                        },
                        {
                            path: "monitor",
                            name: "dineMonitor",
                            meta: { title: "堂食生产看板" },
                            component: () => import("@/views/order/dine/Monitor.vue")
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
                    path: "aftersales/list",
                    name: "aftersalesManage",
                    meta: { title: "售后申请" },
                    component: () => import("@/views/order/aftersales/List.vue")
                }
            ]
        }
    ]
};
