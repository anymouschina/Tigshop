import request from "@/utils/request";
import { LimitdiscountFilterResult, LimitdiscountFormResult } from "@/types/promotion/limitdiscount.d";
// 获取限时折扣列表
export const getLimitdiscountList = (params: object) => {
    return request<LimitdiscountFilterResult>({
        url: "promotion/timeDiscount/list",
        method: "get",
        params,
    });
}
// 限时折扣列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "promotion/timeDiscount/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 限时折扣列表页面删除项
export const delLimitdiscount = (data: object) => {
    return request({
        url: "promotion/timeDiscount/del",
        method: "post",
        data,
    });
}
// 限时折扣列表页面更新项
export const updateLimitdiscountFiled = (data: object) => {
    return request({
        url: "promotion/timeDiscount/updateField",
        method: "post",
        data,
    });
}
// 获取限时折扣详情
export const getLimitdiscount = (action: string, params: object) => {
    return request<LimitdiscountFormResult>({
        url: "promotion/timeDiscount/" + action,
        method: "get",
        params
    });
}
// 更新限时折扣
export const updateLimitdiscount = (operation: string, data: object) => {
    return request({
        url: "promotion/timeDiscount/" + operation,
        method: "post",
        data
    });
}
