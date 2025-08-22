import request from "@/utils/request";
import type { afterSaleEditResponse, afterSaleEditParams, afterSaleInfoResponse, NegotiateResponse, AfterSaleListResponse } from "@/types/user/afterSale";

// 申请数据
export const getAftersalesEdit = (params: afterSaleEditParams) => {
    return request<afterSaleEditResponse>({
        url: "user/aftersales/applyData",
        method: "get",
        params
    });
};

// 售后选项
export const getAftersalesConfig = () => {
    return request<any>({
        url: "user/aftersales/config",
        method: "get"
    });
};

export const updateAfterSales = (data: object) => {
    return request({
        url: "user/aftersales/create",
        method: "post",
        data
    });
};

// 修改售后详情
export const aftersalesUpdate = (data: object) => {
    return request({
        url: "user/aftersales/update",
        method: "post",
        data
    });
};

// 售后记录详情
export const aftersalesViewRecord = (id: number) => {
    return request<afterSaleInfoResponse>({
        url: "user/aftersales/detail?id=" + id,
        method: "get"
    });
};

// 售后申请撤销
export const aftersalesCancel = (data: object) => {
    return request({
        url: "user/aftersales/cancel",
        method: "post",
        data
    });
};

// 售后log
export const viewRecordLog = (id: number) => {
    return request<NegotiateResponse>({
        url: "user/aftersales/detailLog?id=" + id,
        method: "get"
    });
};

//  提交售后反馈记录
export const aftersalesFeedback = (data: object) => {
    return request({
        url: "user/aftersales/feedback",
        method: "post",
        data
    });
};

// 售后申请记录
export const aftersalesRecord = (params: object) => {
    return request<AfterSaleListResponse>({
        url: "user/aftersales/getRecord",
        method: "get",
        params
    });
};
