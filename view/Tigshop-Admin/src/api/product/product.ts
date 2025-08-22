import request from "@/utils/request";
import type {
    ProductFilterParams,
    ProductFilterResult,
    ProductFormState,
    ProductParticipleFormResult,
    ProductFormResult
} from "@/types/product/product.d";

// 获取商品列表
export const getProductList = (params: any) => {
    return request<ProductFilterResult>({
        url: "product/product/list",
        method: "get",
        params,
    });
};

// 待审核商品数量
export const getProductWaitingCheckedCount = () => {
    return request<any>({
        url: "product/product/getWaitingCheckedCount",
        method: "get"
    });
};
// 获取商品配置项
export const getProductConfig = (params: any) => {
    return request<ProductFormResult>({
        url: "product/product/config",
        method: "get",
        params
    });
};
// 商品列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "product/product/batch",
        method: "post",
        data: {type, ...data}
    });
};

// 商品列表页面批量导入
export const batchImport = (data: object) => {
    return request({
        url: "product/product/vendorProductImport",
        method: "post",
        data
    });
};

// 商品列表移至回收站
export const recycleProduct = (data: object) => {
    return request({
        url: "product/product/recycle",
        method: "post",
        data,
    });
};
// 商品列表页面删除项
export const delProduct = (data: object) => {
    return request({
        url: "product/product/del",
        method: "post",
        data,
    });
};
// 商品列表页面更新项
export const updateProductFiled = (data: object) => {
    return request({
        url: "product/product/updateField",
        method: "post",
        data,
    });
};
// 获取商品详情
export const getProduct = (action: string, params: object) => {
    return request<ProductFormState>({
        url: "product/product/" + action,
        method: "get",
        params,
    });
};
// 获取商品搜索关键词
export const getParticiple = (data: object) => {
    return request<string>({
        url: "product/product/getParticiple",
        method: "post",
        data,
    });
};
// 更新商品
export const updateProduct = (operation: string, data: object) => {
    return request({
        url: "product/product/" + operation,
        method: "post",
        data,
    });
};
// 复制商品
export const copyProduct = (data: object) => {
    return request({
        url: "product/product/copy",
        method: "post",
        data,
    });
};

// 获取运费模板
export const getShippingTplList = () => {
    return request<any>({
        url: "product/product/shippingTplList",
        method: "get"
    });
};

// 批量修改商品
export const BatchProduct = (data: object) => {
    return request({
        url: "product/productBatch/productBatchEdit",
        method: "post",
        data,
    });
};

// 审核商品
export const AuditProduct = (data: any) => {
    return request({
        url: "product/product/audit",
        method: "post",
        data,
    });
};

// 重新提交审核
export const AuditAgainProduct = (data: any) => {
    return request({
        url: "product/product/auditAgain",
        method: "post",
        data,
    });
};
