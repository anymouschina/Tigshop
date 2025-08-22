export default {
    path: "/product",
    name: "product",
    component: () => import("@/layouts/base/index.vue"),
    meta: { title: "商品" },
    children: [
        {
            path: "",
            name: "commodityManage",
            meta: { title: "商品管理" },
            redirect: "/product/list",
            children: [
                {
                    path: "list",
                    name: "productManage",
                    meta: { title: "商品列表" },
                    component: () => import("@/views/product/product/List.vue")
                },
                {
                    path: "category/list",
                    name: "categoryManage",
                    meta: { title: "商品类目" },
                    component: () => import("@/views/product/category/List.vue")
                },
                {
                    path: "shop-product-category/list",
                    name: "shopProductCategoryManage",
                    meta: { title: "商品类目" }, //商户端
                    component: () => import("@/views/product/shopProductCategory/List.vue")
                },
                {
                    path: "brand/list",
                    name: "brandManage",
                    meta: { title: "商品品牌" },
                    component: () => import("@/views/product/brand/List.vue")
                },
                {
                    path: "product-group/list",
                    name: "productGroupManage",
                    meta: { title: "商品分组" },
                    component: () => import("@/views/product/productGroup/List.vue")
                },
                {
                    path: "comment/list",
                    name: "commentManage",
                    meta: { title: "商品评价" },
                    component: () => import("@/views/product/comment/List.vue")
                },
                {
                    path: "product-attributes-tpl/list",
                    name: "productAttributesTplManage",
                    meta: { title: "属性模板" },
                    component: () => import("@/views/product/productAttributesTpl/List.vue")
                },
                {
                    path: "product-services/list",
                    name: "productServicesManage",
                    meta: { title: "商品服务" },
                    component: () => import("@/views/product/productServices/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "productBatch",
            meta: { title: "批量操作" },
            redirect: "/product/export/list",
            children: [
                {
                    path: "export/list",
                    name: "productBatchExportManage",
                    meta: { title: "批量导出" },
                    component: () => import("@/views/product/productBatch/export/List.vue")
                },
                {
                    path: "add/list",
                    name: "productBatchAddManage",
                    meta: { title: " 批量上传" },
                    component: () => import("@/views/product/productBatch/add/List.vue")
                },
                {
                    path: "edit/list",
                    name: "productBatchEditManage",
                    meta: { title: "批量修改" },
                    component: () => import("@/views/product/productBatch/edit/List.vue")
                }
            ]
        },
        {
            path: "",
            name: "stockControl",
            meta: { title: "库存管理" },
            redirect: "/product/product-inventory-log/list",
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
            name: "quotationManage",
            meta: { title: "询价管理" },
            redirect: "/product/enquiry/list",
            children: [
                {
                    path: "enquiry/list",
                    name: "enquiryManage",
                    meta: { title: "商品询价" },
                    component: () => import("@/views/product/enquiry/List.vue")
                }
            ]
        }
    ]
};
