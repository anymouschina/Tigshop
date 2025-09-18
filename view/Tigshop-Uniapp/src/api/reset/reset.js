import request from "../../utils/request";
export const forgetPassword = (data) => {
    return request({
        url: "user/login/forgetPassword",
        method: "post",
        data
    });
};
//# sourceMappingURL=reset.js.map