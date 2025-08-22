import request from "@/utils/request";
import type {LogisticsCompanyFilterParams, LogisticsCompanyFilterResult, LogisticsCompanyFormState} from "@/types/setting/logisticsCompany";


export const getLogisticsCompanyList = (params: LogisticsCompanyFilterParams) => {
    return request<LogisticsCompanyFilterResult>({
        url: "setting/logisticsCompany/list",
        method: "get",
        params,
    });
}
export const getLogisticsCompanyAll = (params: object) => {
    return request<LogisticsCompanyFilterResult>({
        url: "setting/logisticsCompany/list",
        method: "get",
        params,
    });
}

// 商品分类页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "setting/logisticsCompany/batch",
        method: "post",
        data: {type, ...data},
    });
}

// 商品分类页面更新项
export const updateLogisticsCompanyFiled = (data: object) => {
    return request({
        url: "setting/logisticsCompany/updateField",
        method: "post",
        data,
    });
}

export const delLogisticsCompany = (data: object) => {
    return request({
        url: "setting/logisticsCompany/del",
        method: "post",
        data,
    });
}

export const getLogisticsCompany = (action: string, params: object) => {
    return request<LogisticsCompanyFormState[]>({
        url: "setting/logisticsCompany/" + action,
        method: "get",
        params
    });
}

export const updateLogisticsCompany = (operation: string, data: object) => {
    return request({
        url: "setting/logisticsCompany/" + operation,
        method: "post",
        data
    });
}
export const updateLogisticsCompanyField = (data: object) => {
    return request({
        url: "setting/logisticsCompany/updateField",
        method: "post",
        data
    });
}
