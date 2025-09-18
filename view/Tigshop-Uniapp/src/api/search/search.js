import request from "../../utils/request";
// 获取选中分类树
export const getCategoryTree = (id) => {
    return request({
        url: "category/category/parentTree",
        method: "get",
        data: { id }
    });
};
// 获取分类筛选项
export const getCategoryProductFilter = (params) => {
    return request({
        url: "search/search/getFilter",
        method: "get",
        params
    });
};
// 获取商品列表
export const getCategoryProduct = (params) => {
    return request({
        url: "search/search/getProduct",
        method: "get",
        params
    });
};
// 获取店铺选中分类树
export const getShopCategoryTree = (id) => {
    return request({
        url: `shop/category/parentTree?id=${id}`,
        method: "get"
    });
};
//# sourceMappingURL=search.js.map