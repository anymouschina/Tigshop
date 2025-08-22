import request from "@/utils/request";
import type { collectionShopResponse } from "@/types/user/collectionShop";

export const getCollectionShop = (params: object) => {
    return request<collectionShopResponse>({
        url: "user/user/collectionShop",
        method: "get",
        params
    });
};
