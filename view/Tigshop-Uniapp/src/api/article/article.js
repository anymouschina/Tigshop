import request from "../../utils/request";
export const getArticleList = (params) => {
    return request({
        url: "article/article/list",
        method: "get",
        params
    });
};
//获取文章
export const getArticle = (params, url) => {
    return request({
        url: "article/article/" + url,
        method: "get",
        params
    });
};
//# sourceMappingURL=article.js.map