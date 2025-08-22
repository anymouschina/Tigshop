import request from "@/utils/request";
import type { UserDataResponse, SalesmanDataResponse } from "@/types/salesman/salesmanCenter";

export const getUser = () => {
    return request<UserDataResponse>({
        url: "user/user/detail",
        method: "get"
    });
};

export const getSalesman = () => {
    return request<SalesmanDataResponse>({
        url: "salesman/salesman/detail",
        method: "get"
    });
};
