import request from "@/utils/request";
import { PointsExchangeFilterResult, PointsExchangeFormState } from "@/types/promotion/pointsExchange.d";
// 获取示例模板列表
export const getPointsExchangeList = (params: object) => {
    return request<PointsExchangeFilterResult>({
        url: "promotion/pointsExchange/list",
        method: "get",
        params,
    });
}
// 示例模板列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "promotion/pointsExchange/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 示例模板列表页面删除项
export const delPointsExchange = (data: object) => {
    return request({
        url: "promotion/pointsExchange/del",
        method: "post",
        data,
    });
}
// 示例模板列表页面更新项
export const updatePointsExchangeFiled = (data: object) => {
    return request({
        url: "promotion/pointsExchange/updateField",
        method: "post",
        data,
    });
}
// 获取示例模板详情
export const getPointsExchange = (action: string, params: object) => {
    return request<PointsExchangeFormState>({
        url: "promotion/pointsExchange/" + action,
        method: "get",
        params
    });
}
// 更新示例模板
export const updatePointsExchange = (operation: string, data: object) => {
    return request({
        url: "promotion/pointsExchange/" + operation,
        method: "post",
        data
    });
}
