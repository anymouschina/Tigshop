import request from "@/utils/request";
// 获取会话列表
export const getConversation = (params: {}) => {
    return request<any>({
        prefix: "/im/",
        url: "conversation/conversation/list",
        method: "get",
        params
    });
};
// 获取会话消息
export const getConversationMessage = (params: {}) => {
    return request<any>({
        prefix: "/im/",
        url: "conversation/message/list",
        method: "get",
        params
    });
};
// 获取会员信息
export const getUserInfo = (params: {}) => {
    return request({
        prefix: "/im/",
        url: "conversation/message/list",
        method: "get",
        params
    });
};
//发送消息
export const sendMessage = (data: {}) => {
    return request<any>({
        prefix: "/im/",
        url: "conversation/message/send",
        method: "post",
        data
    });
};
//设置消息已读
export const setRead = (data: {}) => {
    return request({
        prefix: "/im/",
        url: "conversation/message/setRead",
        method: "post",
        data
    });
};
