import request from "@/utils/request";
import type { HistoryProductResponse } from "@/types/user/historyProduct";

export const historyProductList = () => {
    return request<HistoryProductResponse>({
        url: "user/user/historyProduct",
        method: "get"
    });
};
export const delHistoryProduct = (ids: number[]) => {
    return request({
        url: "user/user/delHistoryProduct",
        method: "post",
        data: {
            ids
        }
    });
};
