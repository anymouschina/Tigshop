import request from "../../utils/request";
export const getCollectionShop = (params) => {
    return request({
        url: "user/user/collectionShop",
        method: "get",
        params
    });
};
//# sourceMappingURL=collectionShop.js.map