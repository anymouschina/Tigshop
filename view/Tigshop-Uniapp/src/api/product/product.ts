import request from "@/utils/request";
import type {
    ProductFilterResult,
    SkuResponse,
    ProductCouponList,
    CommentFilterResult,
    CommentDetailResult,
    ProductConsultationFormState,
    ProductConsultationList,
    PromotionResponse,
    AddCartResponse,
    ProductAmountResponse,
    SkuAvailabilitysResponse
} from "@/types/product/product.d";

// 获取商品详情
export const getProductDetail = (id: any) => {
    return request<ProductFilterResult>({
        url: "product/product/detail",
        method: "get",
        params: { id }
    });
};

export const getComment = (id: number) => {
    return request<CommentDetailResult>({
        url: "product/product/getComment",
        method: "get",
        params: { id }
    });
};
export const getCommentList = (id: number, params: object) => {
    return request<CommentFilterResult>({
        url: "product/product/getCommentList",
        method: "get",
        params: { id, ...params }
    });
};

export const getProductSkuDetail = (params: object) => {
    return request<SkuResponse>({
        url: "product/product/getProductAvailability",
        method: "get",
        params
    });
};
export const addToCart = (params: AnyObject) => {
    return request<AddCartResponse>({
        url: "cart/cart/addToCart",
        method: "post",
        data: params
    });
};
//商品咨询列表
export const getProductConsultationList = (params: object) => {
    return request<ProductConsultationList>({
        url: "user/feedback/list",
        method: "get",
        params,
        noSkipLogin: true
    });
};
//提交商品咨询
export const addConsultation = (data: ProductConsultationFormState) => {
    return request({
        url: "user/feedback/submit",
        method: "post",
        data
    });
};

//售后服务内容
export const getAfterSaleService = (id: number) => {
    return request<any>({
        url: "common/config/afterSalesService",
        method: "get"
    });
};

//收藏商品
export const getCollectProduct = (params: object) => {
    return request<any>({
        url: "product/product/isCollect",
        method: "get",
        params,
        noSkipLogin: true
    });
};
// 取消收藏商品
export const delCollectProduct = (data: object) => {
    return request({
        url: "user/collectProduct/cancel",
        method: "post",
        data
    });
};
// 收藏商品
export const updateCollectProduct = (data: object) => {
    return request({
        url: "user/collectProduct/save",
        method: "post",
        data
    });
};

//优惠券列表
export const getProductCouponList = (id: number) => {
    return request<ProductCouponList>({
        url: "product/product/getCoupon",
        method: "get",
        params: { id }
    });
};

// 获取商品活动信息
export const getPromotion = (data: object) => {
    return request<PromotionResponse>({
        url: "product/product/promotion",
        method: "post",
        data
    });
};

export const getProductAmount = (data: object) => {
    return request<ProductAmountResponse>({
        url: "product/product/getProductAmount",
        method: "post",
        data
    });
};

export const getBatchProductAvailability = (params: object) => {
    return request<SkuAvailabilitysResponse>({
        url: "product/product/getBatchProductAvailability",
        method: "get",
        params
    });
};
