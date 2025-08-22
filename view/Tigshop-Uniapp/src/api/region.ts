import request from "@/utils/request";
import type { RegionFilterState } from "@/types/user/address";
export const getRegionByIds = (ids: string) => {
    return request<RegionFilterState>({
        url: "sys/region/getRegion",
        method: "get",
        params: { regionIds: ids }
    });
};
