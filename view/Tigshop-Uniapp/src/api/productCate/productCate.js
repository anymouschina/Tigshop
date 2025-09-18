import request from "../../utils/request";
// 获取商品分类
export const getCategoryAll = () => {
    return request({
        url: "category/category/all",
        method: "get"
    });
};
// 获取热门分类
export const getCategoryHot = () => {
    return request({
        url: "category/category/hot",
        method: "get"
    });
};
// 获取分类树
export const getCategoryTree = (id) => {
    return request({
        url: "category/category/parentTree",
        method: "get"
    });
};
// 获取指定分类列表
export const getCategoryList = (id) => {
    return request({
        url: "category/category/list?id=" + id,
        method: "get",
        cancelPrevious: true,
        requestKey: "categoryList"
    });
};
//# sourceMappingURL=productCate.js.map