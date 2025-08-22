import request from "@/utils/request";
import {AftersalesFilterParams, AftersalesFilterResult, FormState} from "@/types/order/aftersales"
// 获取售后申请列表
export const getAftersalesList = (params: AftersalesFilterParams) => {
    return request<AftersalesFilterResult>({
        url: "order/aftersales/list",
        method: "get",
        params,
    });
}
// 获取售后申请类型
export const getAftersalesApplyType = () => {
    return request<any>({
        url: "order/aftersales/applyType",
        method: "get"
    });
}
// 获取退换货状态
export const getAftersalesReturnStatus = () => {
    return request<any>({
        url: "order/aftersales/returnGoodsStatus",
        method: "get"
    });
}

//获取售后详情
export const getAftersales  = (action: string, params: object) => {
    return request<FormState>({
        url: "order/aftersales/" + action,
        method: "get",
        params
    });
}
// 更新售后操作
export const updateAftersales = ( data: object) => {
    return request({
        url: "order/aftersales/update",
        method: "post",
        data
    });
}
// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "order/aftersales/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 列表更新项
export const updateAftersalesField = (data:object) => {
    return request({
        url: "order/aftersales/updateField",
        method: "post",
        data
    });
}

//发布留言
export const addMessage = (data:object) => {
    return request({
        url: "order/aftersales/record",
        method: "post",
        data
    });
}

//确认收货
export const updataConfirmReceipt = (data:object) => {
    return request({
        url: "order/aftersales/receive",
        method: "post",
        data
    });
}

//关闭售后
export const completeAftersales = (data:object) => {
    return request({
        url: "order/aftersales/complete",
        method: "post",
        data
    });
}