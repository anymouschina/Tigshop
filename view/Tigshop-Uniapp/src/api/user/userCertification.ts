import request from "@/utils/request";

export const applyApply = (data: object) => {
    return request({
        url: "user/company/apply",
        method: "post",
        data
    });
};

export const getApplyInfo = (id: any) => {
    return request<any>({
        url: "user/company/detail",
        method: "get",
        params: { id }
    });
};

export const getMyApply = () => {
    return request<any>({
        url: "user/company/myApply",
        method: "get"
    });
};
