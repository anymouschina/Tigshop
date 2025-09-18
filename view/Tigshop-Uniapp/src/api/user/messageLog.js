import request from "../../utils/request";
//获取站内信列表
export const getMessageList = (params) => {
    return request({
        url: "user/message/list",
        method: "get",
        params
    });
};
//站内信单个标记已读
export const addMessageRead = (id) => {
    return request({
        url: "user/message/updateMessageRead",
        method: "post",
        data: { id }
    });
};
//站内信全部标记已读
export const addMessageAllRead = () => {
    return request({
        url: "user/message/updateAllRead",
        method: "post"
    });
};
//删除站内信
export const delMessage = (data) => {
    return request({
        url: "user/message/del",
        method: "post",
        data
    });
};
//# sourceMappingURL=messageLog.js.map