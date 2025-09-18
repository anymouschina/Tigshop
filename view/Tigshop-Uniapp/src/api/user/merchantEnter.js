import request from "../../utils/request";
export const applyMerchant = (data) => {
    return request({
        url: "merchant/merchant/apply",
        method: "post",
        data
    });
};
export const getMerchantInfo = (id) => {
    return request({
        url: "merchant/merchant/applyDetail",
        method: "get",
        params: { id }
    });
};
export const getMyMerchant = () => {
    return request({
        url: "merchant/merchant/myApply",
        method: "get"
    });
};
export const getApplyShopAgreement = () => {
    return request({
        url: "merchant/merchant/applyShopAgreement",
        method: "get"
    });
};
//# sourceMappingURL=merchantEnter.js.map