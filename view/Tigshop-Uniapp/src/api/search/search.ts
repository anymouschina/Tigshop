import request from "@/utils/request";
import type { SearchFilterResult, ProductFilterResult, ProductFilterParams, ProductListResponse } from "@/types/search/search";

// 获取选中分类树
export const getCategoryTree = (id?: number) => {
    return request<SearchFilterResult>({
        url: "category/category/parentTree",
        method: "get",
        data: { id }
    });
};

// 获取分类筛选项
export const getCategoryProductFilter = (params: ProductFilterParams) => {
    return request<ProductFilterResult>({
        url: "search/search/getFilter",
        method: "get",
        params
    });
};

// 获取商品列表
export const getCategoryProduct = (params: object) => {
    return request<ProductListResponse>({
        url: "search/search/getProduct",
        method: "get",
        params
    });
};

// 获取店铺选中分类树
export const getShopCategoryTree = (id?: number) => {
    return request<any>({
        url: `shop/category/parentTree?id=${id}`,
        method: "get"
    });
};
