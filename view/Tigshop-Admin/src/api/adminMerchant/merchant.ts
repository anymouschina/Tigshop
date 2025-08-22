import request from "@/utils/request";
import type { MerchantFilterParams, MerchantFilterResult, MerchantFormState, MerchantSearchFilterResult } from "@/types/adminMerchant/merchant";

// 获取商品分类列表
export const getMerchantList = (params: MerchantFilterParams) => {
    return request<MerchantFilterResult>({
        url: "merchant/merchant/list",
        method: "get",
        params
    });
};

export const getMerchantSearch = () => {
    return request<MerchantSearchFilterResult>({
        url: "merchant/merchant/search",
        method: "get"
    });
};

// 删除
export const delMerchant = (data: object) => {
    return request({
        url: "merchant/merchant/del",
        method: "post",
        data
    });
};
//获取分类详情
export const getMerchant = (action: string, params: object) => {
    return request<MerchantFormState>({
        url: "merchant/merchant/" + action,
        method: "get",
        params
    });
};

// 更新分类
export const updateMerchant = (operation: string, data: object) => {
    return request({
        url: "merchant/merchant/" + operation,
        method: "post",
        data
    });
};

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "merchant/merchant/batch",
        method: "post",
        data: {type, ...data}
    });
};

// 列表更新项
export const updateMerchantField = (data: object) => {
    return request({
        url: "merchant/merchant/updateField",
        method: "post",
        data
    });
};
