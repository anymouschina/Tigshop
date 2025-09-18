import request from "../../utils/request";
export const getUserLevelList = () => {
    return request({
        url: "user/user/levelList",
        method: "get"
    });
};
export const getUserLevelInfo = (params) => {
    return request({
        url: "user/user/levelInfo",
        method: "get",
        params
    });
};
//# sourceMappingURL=levelCenter.js.map