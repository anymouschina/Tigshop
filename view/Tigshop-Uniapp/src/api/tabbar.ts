import request from "@/utils/request";
import type { TabbarDataResponse } from "@/types/tabbar";

export const getMobileNav = () => {
    return request<TabbarDataResponse>({
        url: "home/home/mobileNav",
        method: "get"
    });
};
