import request from "@/utils/request";
import type { SearchFilterResult } from "@/types/productCate/productCate";
// 获取商品分类
export const getCategoryAll = () => {
    return request<SearchFilterResult>({
        url: "category/category/all",
        method: "get"
    });
};
// 获取热门分类
export const getCategoryHot = () => {
    return request<SearchFilterResult>({
        url: "category/category/hot",
        method: "get"
    });
};
// 获取分类树
export const getCategoryTree = (id: number) => {
    return request<SearchFilterResult>({
        url: "category/category/parentTree",
        method: "get"
    });
};

// 获取指定分类列表
export const getCategoryList = (id: number) => {
    return request<SearchFilterResult>({
        url: "category/category/list?id=" + id,
        method: "get",
        cancelPrevious: true,
        requestKey: "categoryList"
    });
};
