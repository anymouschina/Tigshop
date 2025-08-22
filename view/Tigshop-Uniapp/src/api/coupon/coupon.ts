import request from "@/utils/request";
import type { CouponResponse, CouponFilterParams, CouponDetailResponse, CouponInfoParams, DiscountAmountResponse } from "@/types/coupon/coupon";

export const getCouponList = (params: CouponFilterParams) => {
    return request<CouponResponse>({
        url: "user/coupon/getList",
        method: "get",
        params
    });
};
// 获取我的优惠券列表
export const getMyCouponList = (params: CouponFilterParams) => {
    return request<CouponResponse>({
        url: "user/coupon/list",
        method: "get",
        params
    });
};
//领取优惠券
export const addCoupon = (data: object) => {
    return request({
        url: "user/coupon/claim",
        method: "post",
        data
    });
};
//删除我的优惠券
export const delCoupon = (data: object) => {
    return request({
        url: "user/coupon/del",
        method: "post",
        data
    });
};

// 获取我的优惠券详情
export const getMyCouponInfo = (params: CouponInfoParams) => {
    return request<CouponDetailResponse>({
        url: "user/coupon/detail",
        method: "get",
        params
    });
};

// 是否满足优惠券及详情
export const getCouponDiscount = (id: number) => {
    return request<DiscountAmountResponse>({
        url: "cart/cart/getCouponDiscount?couponId=" + id,
        method: "get"
    });
};
