import request from "@/utils/request";
import type { ArticleFilterParams, ArticleFilterResult, ArticleFormResult } from "@/types/article/article.d";

export const getArticleList = (params?: ArticleFilterParams) => {
    return request<ArticleFilterResult>({
        url: "article/article/list",
        method: "get",
        params
    });
};

//获取文章
export const getArticle = (params: object, url: string) => {
    return request<ArticleFormResult>({
        url: "article/article/" + url,
        method: "get",
        params
    });
};
