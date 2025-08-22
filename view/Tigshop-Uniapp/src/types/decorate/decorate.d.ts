import { ComputedRef } from "vue";
// 列表查询时筛选参数类型
export interface ModulesType {
    moduleList: ModuleType[];
    pageModule: ModuleType;
}

export interface EditResult {
    item: {
        data: {
            moduleList?: ModuleType[];
            pageModule?: ModuleType;
        };
    };
}
export interface ModuleType {
    module: {};
    moduleIndex?: number;
    isShow?: boolean;
    active?: boolean;
    type: string;
    text?: string;
    style: number;
    lineType?: number;
    lineStyle?: number;
    blankHeight?: number;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundRepeat: string;
    backgroundSize: string;
    products?: ModuleProductsType;
    title?: ModuleTitleType;
    frame?: ModuleFrameType;
    icoPic?: ModuleIcoPicType;
}
//分类导航结构
export interface ModuleCatNavType {
    navBackgroundPic?: ModuleIcoPicType;
    logoPic?: ModuleIcoPicType;
    itemWidth?: number;
    textColor?: string;
    backgroundColor?: string;
    itemBackgroundColor?: string;
    searchTextColor?: string;
    isGanged?: number;
    logoHeight?: number;
    searchText?: string;
    boxPadding?: number;
    itemRadius?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
}
//优惠券结构
export interface ModuleCouponType {
    showTitle?: number;
    title?: string;
    desc?: string;
    colorStyle?: number;
    itemBackgroundColor?: string;
    backgroundColor?: string;
    itemPadding?: number;
    boxRadius?: number;
    boxPadding?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
}
//活动结构
export interface ModuleActivityType {
    style?: number;
    goodsStyle?: number;
    goodsRadioStyle?: number;
    textAlign?: number;
    textWeight?: number;
    goodsNameRow?: number;
    goodsNamePadding?: number;
    showName?: number;
    showBrief?: number;
    showPrice?: number;
    goodsPadding?: number;
    buyBtnStyle?: number;
    backgroundColor?: string;
    boxRadius?: number;
    innerPadding?: number;
    boxPadding?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
    title?: ModuleTitleType;
}
// 结构
export interface ModuleFrameType {
    textColor?: string;
    itemBackgroundColor?: string;
    itemRadius?: string;
    itemHeight?: string;
    backgroundColor?: string;
    innerPadding?: number;
    boxRadius?: number;
    boxPadding?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
    titleFontSize?: number;
    titleFontWeight?: number;
    format?: {
        backgroundColor?: string;
        innerPadding?: string;
        boxRadius?: string;
        boxPadding?: string;
        boxPaddingTop?: string;
        boxPaddingBottom?: string;
    };
}

export interface ModuleStyle {
    boxPaddingTopBottom: number;
    boxPaddingTop: number;
    boxPaddingBottom: number;
    boxPadding: number;
    backgroundColor: string;
    backgroundPic: {
        picUrl: string;
        picThumb: string;
    };
    backgroundPicFillType: string;
}

export interface ModuleContentStyle {
    paddingTopBottom: number;
    paddingTop: number;
    paddingBottom: number;
    paddingLeftRight: number;
    padding: number;
    boxRadiusTop: number;
    boxRadiusBottom: number;
    boxRadius: number;
    gradientType: string;
    gradientColorA: string;
    gradientColorB: string;
    backgroundColor: string;
    backgroundPic: {
        picUrl: string;
        picThumb: string;
    };
    backgroundPicFillType: string;
    boxShadow: number;
}

export interface ModuleSubTitle {
    showTitle?: number;
    titleFontSize?: number;
    titleFontBold?: number;
    titleColor?: string;
}

// 标题

export interface ModuleTitleType {
    showTitle?: number;
    titleStyle?: number;
    titleAlign?: number;
    titleBackground?: string;
    titleBackground2?: string;
    titleBackgroundPic?: {
        picUrl?: string;
        picThumb?: string;
    };
    titleRadius?: number;
    titleText?: string;
    titleColor?: string;
    descText?: string;
    descColor?: string;
    showMore?: number;
    moreLink?: any;
    moreColor?: string;
    format?: {
        titleBackground?: string;
        titleRadius?: string;
    };
}
export interface ModuleImageType {
    picType: number;
    picPageType: number;
    navType?: number;
    navStyle?: number;
    rowNum?: number;
    colNum?: number;
    radioStyle?: number;
    swiperPageColor?: string;
    swiperPreView?: number;
    imgPadding?: number;
    isFluxWidth?: number;
    picRadioStyle?: number;
    picList: ModulePicListType[];
    format?: {
        imgPadding?: string;
    };
}
// 热图
export interface ModuleImageHotareaType {
    picList?: ModuleImageHotareaPicListType[];
    imgPadding: number;
    picRadioStyle?: number;
    format?: {
        imgPadding?: string;
    };
}
export interface ModuleImageHotareaPicListType {
    picTitle?: string;
    picUrl?: string;
    picDesc?: string;
    hotarea?: HotareaType[];
}

export interface HotareaType {
    link?: LinkType;
    title?: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
    position?: string;
}

// 商品
export interface ModuleProductsType {
    productSelectType?: number;
    productIds?: number[];
    productCategoryId?: number;
    productNumber?: number;
    productTag?: string;
}
export interface ModulePicListType {
    picUrl?: string;
    picThumb?: string;
    picLink?: {
        link?: string;
        title?: string;
    };
    picTitle?: string;
    picDesc?: string;
}
export interface ModuleLinkListType {
    link?: {
        link?: string;
        title?: string;
    };
    linkTitle?: string;
}

//公告图标
export interface ModuleIcoPicType {
    picUrl?: string;
    picThumb?: string;
}

export interface FilterParams {
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    keyword?: string;
    isShow?: number;
}

// 获取列表返回参数类型
export interface FilterResult {
    records: FilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface FilterState {
    exampleId?: number;
    exampleName?: string;
    exampleLogo?: string;
    isShow?: boolean;
    sortOrder?: number;
}

// 获取详情返回参数类型
export interface FormResult {
    item: FormState;
}
export interface FormState {
    exampleName?: string;
    exampleLogo?: string;
    exampleDesc?: string;
    sortOrder?: string;
    isShow?: number;
}
// PC端
export interface PcPageHeaderType {
    logo?: {
        picUrl?: string;
        picThumb?: string;
    };
    headerStyle?: number;
}
export interface PcCatProductType {
    categoryId?: number;
    title?: string;
    shortTitle?: string;
    enTitle?: string;
    color?: string;
    color2?: string;
    picList?: ModulePicListType[];
    picList2?: ModulePicListType[];
    picList3?: ModulePicListType[];
    linkList?: ModuleLinkListType[];
    productIds?: number[];
}
export interface PcBannerType {
    logo?: {
        picUrl?: string;
        picThumb?: string;
    };
    bannerStyle?: number;
    showCat?: number;
    picList?: ModulePicListType[];
    picList2?: ModulePicListType[];
    picList3?: ModulePicListType[];
}

export interface PcCustomAd1Type {
    picList?: ModulePicListType[];
    picList2?: ModulePicListType[];
    picList3?: ModulePicListType[];
}
export interface PcCustomAd2Type {
    linkList?: ModuleLinkListType[];
    picList?: ModulePicListType[];
    picList2?: ModulePicListType[];
    picList3?: ModulePicListType[];
}
export interface PcRecommendProduct {
    titleName?: string;
    products?: ModuleProductsType;
}
export interface PcSeckillType {
    seckillTitle?: string;
}

export interface LinkType {
    path?: string;
    name?: string;
    label?: string;
    id?: number;
    sn?: string;
    link?: string;
    appLink?: string;
}
