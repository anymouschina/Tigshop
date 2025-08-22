import request from "@/utils/request";
import { panelIndexFilterState } from "@/types/panel/index";
// 供应商面板首页
export const getPanelIndex = () => {
    return request<panelIndexFilterState>({
        url: "panel/panel/vendorIndex",
        method: "get"
    });
};
