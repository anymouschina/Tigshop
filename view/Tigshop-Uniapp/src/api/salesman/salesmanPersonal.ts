import request from "@/utils/request";
import type { SalesmanPersoanlDataResponse } from "@/types/salesman/salesmanPersonal";

export const getSalesmanPersonal = () => {
    return request<SalesmanPersoanlDataResponse>({
        url: "user/user/detail",
        method: "get"
    });
};

// 更新个人信息
export const updateSalesmanPersonal = (data: object) => {
    return request({
        url: "user/user/updateInformation",
        method: "post",
        data
    });
};
