import request from "@/utils/request";
import type { ApplyFilterParams, ApplyFilterResult, ApplyFormState } from "@/types/adminMerchant/apply";

// 获取商品分类列表
export const getApplyList = (params: ApplyFilterParams) => {
    return request<ApplyFilterResult>({
        url: "merchant/apply/list",
        method: "get",
        params
    });
};

// 获取商品分类列表
export const getApplyConfig = () => {
    return request<any[]>({
        url: "merchant/apply/config",
        method: "get"
    });
};

// 删除
export const delApply = (data: object) => {
    return request({
        url: "merchant/apply/del",
        method: "post",
        data
    });
};
//获取分类详情
export const getApply = (action: string, params: object) => {
    return request<ApplyFormState>({
        url: "merchant/apply/" + action,
        method: "get",
        params
    });
};

// 更新分类
export const auditApply = ( data: object) => {
    return request({
        url: "merchant/apply/audit",
        method: "post",
        data
    });
};

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "merchant/apply/batch",
        method: "post",
        data: {type, ...data}
    });
};

