import request from "@/utils/request";

export const verificationCheck = (data: object) => {
    return request({
        url: "common/verification/check",
        method: "POST",
        data
    });
};

export const verificationCaptcha = (data: object) => {
    return request({
        url: "common/verification/captcha",
        method: "POST",
        data
    });
};

export const sendMobileCode = (data: object) => {
    return request({
        url: "sys/sms/getCode",
        method: "POST",
        data
    });
};
