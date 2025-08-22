import request from "@/utils/request";
import type { SearchInfoList, MessageList, MessageDetail } from "@/types/im/im.d";
// 获取会话列表
export const getConversation = (params: {}) => {
    return request<{records:SearchInfoList[]}>({
        prefix: "/im",
        url: "conversation/conversation/list",
        method: "get",
        params
    });
};
// 获取会话消息
export const getConversationMessage = (params: {}) => {
    return request<{records:MessageList[]}>({
        prefix: "/im",
        url: "conversation/message/list",
        method: "get",
        params
    });
};
// 获取会员信息
export const getUserInfo = (params: {}) => {
    return request({
        prefix: "/im",
        url: "conversation/message/list",
        method: "get",
        params
    });
};
//发送消息
export const sendMessage = (data: {}) => {
    return request<any>({
        prefix: "/im",
        url: "conversation/message/send",
        method: "post",
        data
    });
};
//设置消息已读
export const setRead = (data: {}) => {
    return request({
        prefix: "/im",
        url: "conversation/message/setRead",
        method: "post",
        data
    });
};
//删除会话  conversationId
export const delConversation = (data: {}) => {
    return request({
        prefix: "/im",
        url: "conversation/conversation/del",
        method: "post",
        data
    });
};

// 会话详情
export const getConversationDetail = (params: {}) => {
    return request<MessageDetail>({
        prefix: "/im",
        url: "conversation/conversation/detail",
        method: "get",
        params
    });
};

// 保存会话备注
export const conversationSaveRemark = (data: object) => {
    return request({
        prefix: "/im",
        url: "conversation/conversation/saveRemark",
        method: "post",
        data
    });
};

// 客服重新发起会话
export const conversationCreate = (data: object) => {
    return request<MessageList>({
        prefix: "/im",
        url: "conversation/conversation/create",
        method: "post",
        data
    });
};

