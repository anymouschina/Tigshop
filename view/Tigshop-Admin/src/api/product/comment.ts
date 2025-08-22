import request from "@/utils/request";
import type {CommentFilterParams, CommentFilterResult, CommentFormState} from "@/types/product/comment";
// 获取用户评论列表
export const getCommentList = (params: CommentFilterParams) => {
    return request<CommentFilterResult>({
        url: "product/comment/list",
        method: "get",
        params,
    });
}
// 用户评论列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "product/comment/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 用户评论列表页面删除项
export const delComment = (data: object) => {
    return request({
        url: "product/comment/del",
        method: "post",
        data,
    });
}
// 用户评论列表页面更新项
export const updateCommentFiled = (data: object) => {
    return request({
        url: "product/comment/updateField",
        method: "post",
        data,
    });
}
// 获取用户评论详情
export const getComment = (action: string, params: object) => {
    return request<CommentFormState>({
        url: "product/comment/" + action,
        method: "get",
        params
    });
}
// 更新用户评论
export const updateComment = (operation: string, data: object) => {
    return request({
        url: "product/comment/" + operation,
        method: "post",
        data
    });
}
// 回复用户评论
export const replyComment = (data: object) => {
    return request({
        url: "product/comment/replyComment",
        method: "post",
        data
    });
}
