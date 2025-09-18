import request from "../../utils/request";
export const historyProductList = () => {
    return request({
        url: "user/user/historyProduct",
        method: "get"
    });
};
export const delHistoryProduct = (ids) => {
    return request({
        url: "user/user/delHistoryProduct",
        method: "post",
        data: {
            ids
        }
    });
};
//# sourceMappingURL=historyProduct.js.map