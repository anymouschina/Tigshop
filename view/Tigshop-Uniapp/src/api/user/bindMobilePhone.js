import request from "../../utils/request";
export const bindMobilePhone = (data) => {
    return request({
        url: "user/login/bindMobile",
        method: "post",
        data
    });
};
//# sourceMappingURL=bindMobilePhone.js.map