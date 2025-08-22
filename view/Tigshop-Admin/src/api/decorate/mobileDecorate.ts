import request from "@/utils/request";
import { FilterResult } from "@/types/decorate/mobileDecorate.d";
// 获取装修页面列表
export const getDecorateList = (params: object) => {
    return request<FilterResult>({
        url: "decorate/decorate/list",
        method: "get",
        params,
    });
};
// 装修页面列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "decorate/decorate/batch",
        method: "post",
        data: {type, ...data},
    });
};
// 装修页面列表页面删除项
export const delDecorate = (data: object) => {
    return request({
        url: "decorate/decorate/del",
        method: "post",
        data,
    });
};
// 装修页面列表页面更新项
export const updateDecorateFiled = (data: object) => {
    return request({
        url: "decorate/decorate/updateField",
        method: "post",
        data,
    });
};
// 获取装修页面详情
export const getDecorate = (action: string, params: object) => {
    return request<any>({
        url: "decorate/decorate/" + action,
        method: "get",
        params,
    });
};
// 更新装修页面
export const updateDecorate = (operation: string, data: object) => {
    return request({
        url: "decorate/decorate/" + operation,
        method: "post",
        data,
    });
};

// 装修分享接口
export const decorateShare = (params: object) => {
    return request<any>({
        url: "decorate/decorateShare/share",
        method: "get",
        params,
    });
};

// 装修链接导入接口
export const importDecorateLink = (params: object) => {
    return request({
        url: "decorate/decorateShare/import" ,
        method: "get",
        params,
    });
};