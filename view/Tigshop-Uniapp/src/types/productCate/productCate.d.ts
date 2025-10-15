/* 分类树结构 */
export interface DataResponse {
    item: Item;
    descArr: DescArr[];
    skuList: any[];
    picList: PicList[];
    attrList: DataResponseAttrList;
    rankDetail: RankDetail;
    code: number;
    message: string;
}

export interface filterSeleted {
    categoryId: number;
    categoryName: string;
    keywords?: string;
    categoryDesc?: string;
    parentId?: number;
    sortOrder?: number;
    measureUnit?: string;
    isShow?: number;
    seoTitle?: string;
    shortName?: string;
    categoryPic?: string;
    categoryIco?: number;
    isHot?: number;
    searchKeywords?: string;
    children?: filterSeleted[];
}

export interface SearchFilterResult {
    // 后端历史响应（全局）: 直接数组
    // 新增店铺模式响应：{ list, source, fallback, shopId }
    list?: filterSeleted[];
    data: filterSeleted[];
    source?: 'shop' | 'global';
    fallback?: boolean;
    shopId?: number;
    code: number;
    message: string;
}
