import request from "@/utils/request";
import type { UserDataResponse } from "@/types/user/user";

export const getUserLevelList = () => {
    return request<any>({
        url: "user/user/levelList",
        method: "get"
    });
};

export const getUserLevelInfo = (params: object) => {
    return request<any>({
        url: "user/user/levelInfo",
        method: "get",
        params
    });
};
