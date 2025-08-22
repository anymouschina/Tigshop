import request from "@/utils/request";
import type { PriceInquiryFilterParams, PriceInquiryFilterResult, PriceInquiryFormState } from "@/types/product/enquiry.d";

// 获取商品分类列表
export const getPriceInquiryList = (params: PriceInquiryFilterParams) => {
    return request<PriceInquiryFilterResult>({
        url: "product/priceInquiry/list",
        method: "get",
        params
    });
};

// 删除
export const delPriceInquiry = (data: object) => {
    return request({
        url: "product/priceInquiry/del",
        method: "post",
        data
    });
};
//获取分类详情
export const getPriceInquiry = (action: string, params: object) => {
    return request<PriceInquiryFormState>({
        url: "product/priceInquiry/" + action,
        method: "get",
        params
    });
};


// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "product/priceInquiry/batch",
        method: "post",
        data: {type, ...data}
    });
};

// 回复
export const updatePriceInquiryReply = (data: object) => {
    return request({
        url: "product/priceInquiry/reply",
        method: "post",
        data
    });
};
