import request from "@/utils/request";
import { ModulesType, EditResult } from "@/types/decorate/decorate.d";
// 获取未完成编辑
export const loadDraftData = (id: number) => {
    return request<any>({
        url: "decorate/decorate/loadDraftData",
        method: "get",
        params: {
            id,
        },
    });
};

export const saveDraft = (data: object) => {
    return request({
        url: "decorate/decorate/saveDraft",
        method: "post",
        data,
    });
};

// 获取装修详情
export const decorateDetail = (params: object) => {
    return request<EditResult>({
        url: "decorate/decorate/detail",
        method: "get",
        params,
    });
};
