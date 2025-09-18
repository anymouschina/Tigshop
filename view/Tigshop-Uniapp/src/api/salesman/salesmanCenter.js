import request from "../../utils/request";
export const getUser = () => {
    return request({
        url: "user/user/detail",
        method: "get"
    });
};
export const getSalesman = () => {
    return request({
        url: "salesman/salesman/detail",
        method: "get"
    });
};
//# sourceMappingURL=salesmanCenter.js.map