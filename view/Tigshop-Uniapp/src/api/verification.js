import request from "../utils/request";
export const verificationCheck = (data) => {
    return request({
        url: "common/verification/check",
        method: "POST",
        data
    });
};
export const verificationCaptcha = (data) => {
    return request({
        url: "common/verification/captcha",
        method: "POST",
        data
    });
};
export const sendMobileCode = (data) => {
    return request({
        url: "sys/sms/getCode",
        method: "POST",
        data
    });
};
//# sourceMappingURL=verification.js.map