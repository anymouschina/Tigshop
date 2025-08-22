import request from "@/utils/request";
import type { payResponse, creatPayParams } from "@/types/order/pay";
import type { PayLogResponse } from "@/types/order/payStatus";

export const orderPayInfo = (id: number) => {
    return request<payResponse>({
        url: "order/pay/index?id=" + id,
        method: "get"
    });
};

// 创建订单支付
export const creatPay = (params: creatPayParams) => {
    return request({
        url: "order/pay/create",
        method: "get",
        params
    });
};

export const checkPayStatus = (params: {}) => {
    return request({
        url: "order/pay/checkStatus",
        method: "get",
        params
    });
};

export const getPayLog = (params: {}) => {
    return request<PayLogResponse>({
        url: "order/pay/getPayLog",
        method: "get",
        params
    });
};

export const checkRechargePayStatus = (params: {}) => {
    return request({
        url: "user/rechargeOrder/checkStatus",
        method: "get",
        params
    });
};

export const rechargeOrderPay = (data: object) => {
    return request({
        url: "user/rechargeOrder/pay",
        method: "post",
        data
    });
};

// 创建充值支付
export const rechargeOrderCreate = (data: creatPayParams) => {
    return request({
        url: "user/rechargeOrder/create",
        method: "post",
        data
    });
};
