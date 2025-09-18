import request from "../../utils/request";
// 获取商品详情
export const getProductDetail = (id) => {
    return request({
        url: "product/product/detail",
        method: "get",
        params: { id }
    });
};
export const getComment = (id) => {
    return request({
        url: "product/product/getComment",
        method: "get",
        params: { id }
    });
};
export const getCommentList = (id, params) => {
    return request({
        url: "product/product/getCommentList",
        method: "get",
        params: { id, ...params }
    });
};
export const getProductSkuDetail = (params) => {
    return request({
        url: "product/product/getProductAvailability",
        method: "get",
        params
    });
};
export const addToCart = (params) => {
    return request({
        url: "cart/cart/addToCart",
        method: "post",
        data: params
    });
};
//商品咨询列表
export const getProductConsultationList = (params) => {
    return request({
        url: "user/feedback/list",
        method: "get",
        params,
        noSkipLogin: true
    });
};
//提交商品咨询
export const addConsultation = (data) => {
    return request({
        url: "user/feedback/submit",
        method: "post",
        data
    });
};
//售后服务内容
export const getAfterSaleService = (id) => {
    return request({
        url: "common/config/afterSalesService",
        method: "get"
    });
};
//收藏商品
export const getCollectProduct = (params) => {
    return request({
        url: "product/product/isCollect",
        method: "get",
        params,
        noSkipLogin: true
    });
};
// 取消收藏商品
export const delCollectProduct = (data) => {
    return request({
        url: "user/collectProduct/cancel",
        method: "post",
        data
    });
};
// 收藏商品
export const updateCollectProduct = (data) => {
    return request({
        url: "user/collectProduct/save",
        method: "post",
        data
    });
};
//优惠券列表
export const getProductCouponList = (id) => {
    return request({
        url: "product/product/getCoupon",
        method: "get",
        params: { id }
    });
};
// 获取商品活动信息
export const getPromotion = (data) => {
    return request({
        url: "product/product/promotion",
        method: "post",
        data
    });
};
export const getProductAmount = (data) => {
    return request({
        url: "product/product/getProductAmount",
        method: "post",
        data
    });
};
export const getBatchProductAvailability = (params) => {
    return request({
        url: "product/product/getBatchProductAvailability",
        method: "get",
        params
    });
};
//# sourceMappingURL=product.js.map