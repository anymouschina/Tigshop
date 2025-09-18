import request from "../../utils/request";
export const getSalesmanPersonal = () => {
    return request({
        url: "user/user/detail",
        method: "get"
    });
};
// 更新个人信息
export const updateSalesmanPersonal = (data) => {
    return request({
        url: "user/user/updateInformation",
        method: "post",
        data
    });
};
//# sourceMappingURL=salesmanPersonal.js.map