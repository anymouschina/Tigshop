import request from "../../utils/request";
// 秒杀列表
export const getSeckill = (params) => {
    return request({
        url: "home/home/getSeckill",
        method: "get",
        params
    });
};
//# sourceMappingURL=seckill.js.map