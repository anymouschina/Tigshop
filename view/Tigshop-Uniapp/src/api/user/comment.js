import request from "../../utils/request";
// 获取评价列表数字角标
export const getCommentSubNum = () => {
    return request({
        url: "user/comment/subNum",
        method: "get"
    });
};
// 获取带晒单评价列表
export const getShowedList = (params) => {
    return request({
        url: "user/comment/showedList?isShowed=0",
        method: "get",
        params
    });
};
// 获取已评价列表
export const getCommentList = (params) => {
    return request({
        url: "user/comment/list",
        method: "get",
        params
    });
};
// 上传评论
export const updateCommentData = (data) => {
    return request({
        url: "user/comment/evaluate",
        method: "post",
        data
    });
};
//获取评价详情
export const getCommentData = (params) => {
    return request({
        url: "user/comment/detail",
        method: "get",
        params
    });
};
//# sourceMappingURL=comment.js.map