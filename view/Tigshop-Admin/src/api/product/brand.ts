import request from "@/utils/request";
import type { BrandFilterParams, BrandFilterResult, BrandFormState, BrandSearchFilterResult } from "@/types/product/brand.d";

// 获取商品品牌列表
export const getBrandList = (params: BrandFilterParams) => {
    return request<BrandFilterResult>({
        url: "product/brand/list",
        method: "get",
        params
    });
};
// 获取商品品牌审核列表
export const getAuditBrandList = (params: BrandFilterParams) => {
    return request<BrandFilterResult>({
        url: "product/brand/auditList",
        method: "get",
        params
    });
};

export const getBrandSearch = () => {
    return request<BrandSearchFilterResult>({
        url: "product/brand/search",
        method: "get"
    });
};
export const getBrandAuditWaitNum = () => {
    return request<any>({
        url: "product/brand/auditWaitNum",
        method: "get"
    });
};

// 删除
export const delBrand = (data: object) => {
    return request({
        url: "product/brand/del",
        method: "post",
        data
    });
};
//获取分类详情
export const getBrand = (action: string, params: object) => {
    return request<BrandFormState>({
        url: "product/brand/" + action,
        method: "get",
        params
    });
};

// 更新分类
export const updateBrand = (operation: string, data: object) => {
    return request({
        url: "product/brand/" + operation,
        method: "post",
        data
    });
};

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "product/brand/batch",
        method: "post",
        data: {type, ...data}
    });
};
//更新首字母
export const updateFirstWorld = () => {
    return request({
        url: "product/brand/updateFirstWord",
        method: "post"
    });
};
// 列表更新项
export const updateBrandField = (data: object) => {
    return request({
        url: "product/brand/updateField",
        method: "post",
        data
    });
};
// 审核品牌
export const auditBrand = (data: object) => {
    return request({
        url: "product/brand/audit",
        method: "post",
        data
    });
};
