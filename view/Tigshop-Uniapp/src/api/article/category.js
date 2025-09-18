import request from "../../utils/request";
export const getBzzxCategoryList = (params) => {
    return request({
        url: "article/category/indexBzzxList",
        method: "get",
        params
    });
};
//# sourceMappingURL=category.js.map