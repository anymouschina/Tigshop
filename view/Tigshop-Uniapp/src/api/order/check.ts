import request from "@/utils/request";
import type { CheckResponse, PaymentTypeResponse, ShippingTypeResponse } from "@/types/order/check";

//  获取订单数据
export const getOrderCheckData = (data: AnyObject) => {
    return request<CheckResponse>({
        url: "order/check/index",
        method: "post",
        data
    });
};
export const updateOrderCheckData = (data: AnyObject) => {
    return request({
        url: "order/check/update",
        method: "post",
        data
    });
};
export const updateCouponData = (data: any) => {
    return request({
        url: "order/check/updateCoupon",
        method: "post",
        data: data
    });
};
export const orderSubmit = (data: any) => {
    return request({
        url: "order/check/submit",
        method: "post",
        data: data
    });
};

export const getPaymentType = () => {
    return request<PaymentTypeResponse>({
        url: "order/check/getAvailablePaymentType",
        method: "GET"
    });
};

export const getShippingType = (params: object) => {
    return request<ShippingTypeResponse>({
        url: "order/check/getStoreShippingType",
        method: "GET",
        params
    });
};
