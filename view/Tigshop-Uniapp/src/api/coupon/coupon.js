import request from "../../utils/request";
export const getCouponList = (params) => {
    return request({
        url: "user/coupon/getList",
        method: "get",
        params
    });
};
// 获取我的优惠券列表
export const getMyCouponList = (params) => {
    return request({
        url: "user/coupon/list",
        method: "get",
        params
    });
};
//领取优惠券
export const addCoupon = (data) => {
    return request({
        url: "user/coupon/claim",
        method: "post",
        data
    });
};
//删除我的优惠券
export const delCoupon = (data) => {
    return request({
        url: "user/coupon/del",
        method: "post",
        data
    });
};
// 获取我的优惠券详情
export const getMyCouponInfo = (params) => {
    return request({
        url: "user/coupon/detail",
        method: "get",
        params
    });
};
// 是否满足优惠券及详情
export const getCouponDiscount = (id) => {
    return request({
        url: "cart/cart/getCouponDiscount?couponId=" + id,
        method: "get"
    });
};
//# sourceMappingURL=coupon.js.map