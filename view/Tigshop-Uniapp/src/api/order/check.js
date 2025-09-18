import request from "../../utils/request";
//  获取订单数据
export const getOrderCheckData = (data) => {
    return request({
        url: "order/check/index",
        method: "post",
        data
    });
};
export const updateOrderCheckData = (data) => {
    return request({
        url: "order/check/update",
        method: "post",
        data
    });
};
export const updateCouponData = (data) => {
    return request({
        url: "order/check/updateCoupon",
        method: "post",
        data: data
    });
};
export const orderSubmit = (data) => {
    return request({
        url: "order/check/submit",
        method: "post",
        data: data
    });
};
export const getPaymentType = () => {
    return request({
        url: "order/check/getAvailablePaymentType",
        method: "GET"
    });
};
export const getShippingType = (params) => {
    return request({
        url: "order/check/getStoreShippingType",
        method: "GET",
        params
    });
};
//# sourceMappingURL=check.js.map