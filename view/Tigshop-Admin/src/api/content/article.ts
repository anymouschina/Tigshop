import request from "@/utils/request";
import type { ArticleFilterResult, ArticleFormState,ArticleFilterParams } from "@/types/content/article.d";
// 获取示例模板列表
export const getArticleList = (params: ArticleFilterParams) => {
    return request<ArticleFilterResult>({
        url: "content/article/list",
        method: "get",
        params,
    });
}
// 示例模板列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "content/article/batch",
        method: "post",
        data: {type, ...data}
    });
}
// 示例模板列表页面删除项
export const delArticle = (data: object) => {
    return request({
        url: "content/article/del",
        method: "post",
        data,
    });
}
// 示例模板列表页面更新项
export const updateArticleFiled = (data: object) => {
    return request({
        url: "content/article/updateField",
        method: "post",
        data,
    });
}
// 获取示例模板详情
export const getArticle = (action: string, params: object) => {
    return request<ArticleFormState>({
        url: "content/article/" + action,
        method: "get",
        params
    });
}
// 更新示例模板
export const updateArticle = (operation: string, data: object) => {
    return request({
        url: "content/article/" + operation,
        method: "post",
        data
    });
}
