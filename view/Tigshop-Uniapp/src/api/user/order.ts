import request from "@/utils/request";
import type { OrderNumResponse, OrderListResponse, OrderInfoResponse, ShippingInfoResponse } from "@/types/user/order";
// 获取商品订单列表
export const getOrderList = (params: any) => {
    return request<OrderListResponse>({
        url: "user/order/list",
        method: "get",
        params
    });
};

export const getOrderNum = () => {
    return request<OrderNumResponse>({
        url: "user/order/orderNum",
        method: "get"
    });
};

// 删除
export const delOrder = (data: object) => {
    return request({
        url: "user/order/delOrder",
        method: "post",
        data
    });
};
// 取消订单
export const cancelOrder = (data: object) => {
    return request({
        url: "user/order/cancelOrder",
        method: "post",
        data
    });
};
//获取订单详情
export const getOrder = (params: object) => {
    return request<OrderInfoResponse>({
        url: "user/order/detail",
        method: "get",
        params
    });
};

// 再次购买
export const orderBuyAgain = (data: object) => {
    return request({
        url: "user/order/buyAgain",
        method: "post",
        data
    });
};

export const confirmReceipt = (data: object) => {
    return request({
        url: "user/order/confirmReceipt",
        method: "post",
        data
    });
};

export const getShippingInfo = (params: object) => {
    return request<ShippingInfoResponse>({
        url: "user/order/shippingInfo",
        method: "get",
        params
    });
};
