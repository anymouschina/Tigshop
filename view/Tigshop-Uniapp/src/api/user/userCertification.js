import request from "../../utils/request";
export const applyApply = (data) => {
    return request({
        url: "user/company/apply",
        method: "post",
        data
    });
};
export const getApplyInfo = (id) => {
    return request({
        url: "user/company/detail",
        method: "get",
        params: { id }
    });
};
export const getMyApply = () => {
    return request({
        url: "user/company/myApply",
        method: "get"
    });
};
//# sourceMappingURL=userCertification.js.map