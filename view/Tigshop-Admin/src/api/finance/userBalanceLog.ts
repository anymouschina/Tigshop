import request from "@/utils/request";
import type {UserBalanceLogFilterParams, UserBalanceLogFilterResult} from "@/types/finance/userBalanceLog.d"
// 获取用户余额日志列表
export const getUserBalanceLogList = (params: UserBalanceLogFilterParams) => {
    return request<UserBalanceLogFilterResult>({
        url: "finance/userBalanceLog/list",
        method: "get",
        params,
    });
}
