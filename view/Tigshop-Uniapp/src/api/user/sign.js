import request from "../../utils/request";
export const getSignList = (url) => {
    return request({
        url: url,
        method: "get"
    });
};
export const signIn = () => {
    return request({
        url: "user/sign/sign",
        method: "get"
    });
};
//# sourceMappingURL=sign.js.map