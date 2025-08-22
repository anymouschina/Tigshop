import request from "@/utils/request";
import type {CouponFilterResult, CouponFormState} from "@/types/promotion/coupon";

// 获取优惠券列表
export const getCouponList = (params: object) => {
    return request<CouponFilterResult>({
        url: "promotion/coupon/list",
        method: "get",
        params,
    });
}
// 获取优惠券配置
export const getCouponConfig = () => {
    return request<any>({
        url: "promotion/coupon/config",
        method: "get"
    });
}
// 示例模板列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "promotion/coupon/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 优惠券列表页面删除项
export const delCoupon = (data: object) => {
    return request({
        url: "promotion/coupon/del",
        method: "post",
        data,
    });
}
// 优惠券列表页面更新项
export const updateCouponFiled = (data: object) => {
    return request({
        url: "promotion/coupon/updateField",
        method: "post",
        data,
    });
}
// 获取优惠券详情
export const getCoupon = (action: string, params: object) => {
    return request<CouponFormState>({
        url: "promotion/coupon/" + action,
        method: "get",
        params
    });
}
// 更新优惠券
export const updateCoupon = (operation: string, data: object) => {
    return request({
        url: "promotion/coupon/" + operation,
        method: "post",
        data
    });
}
