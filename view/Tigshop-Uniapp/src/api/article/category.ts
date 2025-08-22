import request from "@/utils/request";
import type { CategoryFilterResult } from "@/types/article/category.d";

export const getBzzxCategoryList = (params: object) => {
    return request<CategoryFilterResult>({
        url: "article/category/indexBzzxList",
        method: "get",
        params
    });
};
