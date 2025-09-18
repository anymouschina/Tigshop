import request from "../../utils/request";
// 获取商品分类列表
export const getPointList = (params) => {
    return request({
        url: "user/pointsLog/list",
        method: "get",
        params
    });
};
//# sourceMappingURL=point.js.map