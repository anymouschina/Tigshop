
import request from "@/utils/request";
import type { SearchInfo, SearchInfoList } from "@/types/im/im.d";
// 获取待接入列表
export const getWaitServantList = (params: {}) => {
    return request<any>({
        prefix: "/im",
        url: "conversation/conversation/waitServantList",
        method: "get",
        params
    });
};

// 接入会话/转接会话
export const transferConversation = (data: object) => {
    return request({
        prefix: "/im",
        url: "conversation/conversation/transfer",
        method: "post",
        data
    });
};
// 获取待接入列表im
export const getConsultHistory = (params: {}) => {
    return request<{records: SearchInfoList[], total: number}>({
        prefix: "/im",
        url: "conversation/conversation/consultHistory",
        method: "get",
        params
    });
};

// 设置客服状态 "status": 1 //状态1在线2忙3离开
export const setModifyStatus = (data: object) => {
    return request({
        prefix: "/im",
        url: "servant/servant/modifyStatus",
        method: "post",
        data
    });
};

// 搜索用户和会话列表接口  keyword: 3412321
export const getConversationSearch = (params: {}) => {
    return request<SearchInfo>({
        prefix: "/im",
        url: "conversation/conversation/search",
        method: "get",
        params
    });
};
