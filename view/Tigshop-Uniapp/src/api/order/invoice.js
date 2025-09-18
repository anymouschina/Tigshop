import request from "../../utils/request";
// 获取增票资质详情 状态
export const getInvoiceStatus = () => {
    return request({
        url: "user/invoice/getStatus",
        method: "get"
    });
};
export const getCheckInvoice = (params) => {
    return request({
        url: "order/check/getInvoice",
        method: "get",
        params
    });
};
//# sourceMappingURL=invoice.js.map