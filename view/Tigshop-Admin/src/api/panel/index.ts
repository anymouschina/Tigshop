import request from "@/utils/request";
import { panelIndexFilterState } from "@/types/panel/index";
// 面板首页
export const getPanelIndex = () => {
    return request<panelIndexFilterState>({
        url: "panel/panel/index",
        method: "get"
    });
};
