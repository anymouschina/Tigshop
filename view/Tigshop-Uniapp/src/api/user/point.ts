import request from "@/utils/request";
import type { PointFilterParams, PointFilterResult } from "@/types/user/point";
// 获取商品分类列表

export const getPointList = (params: object) => {
    return request<PointFilterResult>({
        url: "user/pointsLog/list",
        method: "get",
        params
    });
};
