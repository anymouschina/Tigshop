import request from "../utils/request";
export const getRegionByIds = (ids) => {
    return request({
        url: "sys/region/getRegion",
        method: "get",
        params: { regionIds: ids }
    });
};
//# sourceMappingURL=region.js.map