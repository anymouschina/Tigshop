import request from "@/utils/request";
import type { CollectProductResponse, CollectProductFilterParams } from "@/types/user/collectProduct";

// 收藏商品列表
export const getCollectProductList = (params?: CollectProductFilterParams) => {
    return request<CollectProductResponse>({
        url: "user/collectProduct/list",
        method: "get",
        params
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
