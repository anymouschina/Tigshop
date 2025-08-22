import request from "@/utils/request";
import { SeckillFilterResult, SeckillFormState ,SeckillFilterParams} from "@/types/promotion/seckill";
// 获取秒杀列表
export const getSeckillList = (params: SeckillFilterParams) => {
    return request<SeckillFilterResult>({
        url: "promotion/seckill/list",
        method: "get",
        params,
    });
}
// 秒杀列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "promotion/seckill/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 秒杀列表页面删除项
export const delSeckill = (data: object) => {
    return request({
        url: "promotion/seckill/del",
        method: "post",
        data,
    });
}
// 秒杀列表页面更新项
export const updateSeckillFiled = (data: object) => {
    return request({
        url: "promotion/seckill/updateField",
        method: "post",
        data,
    });
}
// 获取秒杀详情
export const getSeckill = (action: string, params: object) => {
    return request<SeckillFormState[]>({
        url: "promotion/seckill/" + action,
        method: "get",
        params
    });
}
// 更新秒杀
export const updateSeckill = (operation: string, data: object) => {
    return request({
        url: "promotion/seckill/" + operation,
        method: "post",
        data
    });
}
