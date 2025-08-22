import { AnyObject } from "ant-design-vue/es/_util/type";
import { ComputedRef } from "vue";
// 列表查询时筛选参数类型
export interface ModulesType {
    moduleList: ModuleType[];
    pageModule: ModuleType;
}

export interface EditResult {
    data: {
        moduleList?: ModuleType[];
        pageModule?: ModuleType;
    };
    children?: any[];
    draftData?: any;
    decorateTitle?: string;
    hasDraftData: boolean;
    decorateId?: any;
}
export type backgroundDefault = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0
export type ModuleTypeStyle = 1 | 2 | 3 | 4
export interface ModuleType {
    module: {};
    moduleIndex?: number;
    baseStyle?: number;
    isShow?: boolean;
    active?: boolean;
    type: string;
    url: string;
    text?: string;
    moreLink?: string;
    style: number | ModuleTypeStyle;
    lineType?: number;
    backgroundDefault?: number | backgroundDefault;
    lineStyle?: number;
    blankHeight?: number;
    backgroundColor?: string;
    customPic?: string;
    backgroundImage?: string;
    backgroundRepeat: string;
    backgroundSize: string;
    products?: ModuleProductsType;
    title?: ModuleTitleType;
    subTitle?: ModuleSubTitleType;
    frame?: ModuleFrameType;
    icoPic: ModuleIcoPicType;
    swiperPageColor?: string;
    swiperPageStyle?: number;
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
    listStyleType?: string;
    goodsStyle?: number;
    goodsRadius?: number;
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
    imageBackgroundColor?: string;
    backgroundColor?: string;
    boxRadius?: number;
    innerPadding?: number;
    boxPadding?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
    title?: ModuleTitleType;
    waterfall?: number;
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
    leftAndRightPadding?: number;
    format?: {
        backgroundColor?: string;
        innerPadding?: string;
        boxRadius?: string;
        boxPadding?: string;
        boxPaddingTop?: string;
        boxPaddingBottom?: string;
    };
}

type GradientType = 'upDown' | 'leftRight' | 'diagonal' | 'purity';
type PicFillType = 'cover' | 'contain';
type TitleFontSize = 12 | 14 | 16
type BigTitleFontSize = 14 | 16 | 18
type TitleFontBaold = 400 | 700
type PicPageType = 1 | 2

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
    backgroundPicFillType: PicFillType;
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
    gradientType: GradientType;
    gradientColorA: string;
    gradientColorB: string;
    backgroundColor: string;
    backgroundPic: {
        picUrl: string;
        picThumb: string;
    };
    backgroundPicFillType: PicFillType;
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
    moreLink?: {
        link?: string;
        title?: string;
    };
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
    boxPaddingBottom?: number;
    boxPaddingTop?: number;
    picList: ModulePicListType[];
    showIndicator?: number;
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
    gradientColorA?: string;
    gradientColorB?: string;
}
export interface ModuleLinkListType {
    link?: {
        link?: string;
        title?: string;
    };
    linkTitle?: string;
    picTitle?: string;
}

//公告图标
export interface ModuleIcoPicType {
    picUrl?: string;
    picThumb?: string;
    picId?: number;
    picName?: string;
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
    productSelectType?: number;
    productCategoryId?: number;
    productTag?: number;
    baseStyle?: number;
    title?: string;
    moreLink?: LinkType;
    shortTitle?: string;
    enTitle?: string;
    color?: string;
    color2?: string;
    picList?: ModulePicListType[];
    picList2?: ModulePicListType[];
    picList3?: ModulePicListType[];
    linkList?: ModuleLinkListType[];
    productIds?: number[];
    catIds?: number[];
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
    number?: number;
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
    data?: AnyObject;
}

export interface PcImageAd {
    picList?: ModulePicListType[];
    isFluxWidth?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
}

// 店铺
export interface ShopInfo {
    customPic: ShopInfoCustomPic;
    backgroundDefault: number;
    style: number;
    frame: ShopInfoFrame;
}

export interface ShopInfoCustomPic {
    picUrl: string;
    picThumb: string;
    picId: number;
    picName: string;
}

export interface ShopInfoFrame {
    textColor: string;
    itemBackgroundColor: string;
    backgroundColor: string;
    innerPadding: number;
    itemHeight: number;
    itemRadius: number;
    boxRadius: number;
    boxPadding: number;
    boxPaddingTop: number;
    boxPaddingBottom: number;
}

export interface ModuleCategoryType {
    listStyleType?: string | number;
    categoryList: ModulePicListType[];
    rowNum: number;
    animation?: AnimationType;
    picFillType?: PicFillType;
    picPercent?: number;
    rowPicPercent: number;
    barWidth: number;
    barHeight: number;
    radius?: number;
    indicatorBar?: number;
    categoryPadding?: number;
    barColorOn: string;
    barColor: string;
    subTitle?: ModuleSubTitleType;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}
export interface ModuleSubTitleType {
    showTitle?: number;
    titleColor?: string;
    titleFontSize?: number;
    titleFontBold?: number;
}
export interface ModuleStyleType {
    boxPaddingTopBottom?: number;
    boxPaddingTop?: number;
    boxPaddingBottom?: number;
    boxPadding?: number;
    bannerMarginTop?: number;
    backgroundColor?: string;
    backgroundPic?: {
        picUrl?: string;
        picThumb?: string;
    };
    backgroundPicFillType?: PicFillType;
}
export interface ContentStyleType {
    padding?: number;
    paddingTopBottom?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeftRight?: number;
    boxRadiusTop?: number;
    boxRadiusBottom?: number;
    boxRadius?: number;
    gradientType?: GradientType;
    gradientColorA?: string;
    gradientColorB?: string;
    backgroundColor?: string;
    backgroundPic?: {
        picUrl?: string;
        picThumb?: string;
    };
    backgroundPicFillType?: string | number;
    boxShadow?: string;
}

// 图片环东效果
export interface AnimationType {
    type?: string;
    duration?: number;
    delay?: number;
    range?: number;
}
export interface ModuleCategoryA1Type {
    logoPic?: ModuleIcoPicType;
    listStyleType?: string;
    imageBackgroundColor?: string;
    categoryList: ModulePicListType[];
    rowNum: number;
    animation?: AnimationType;
    picFillType?: string | number;
    picPercent?: number;
    rowPicPercent: number;
    radius?: number;
    categoryPadding?: number;
    subTitle?: ModuleSubTitleType;
    showSplitLine?: number;
    radiusStyle?: number;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}

export interface ModuleCategoryNav3Type {
    logoPic?: ModuleIcoPicType;
    listStyleType?: string;
    imageBackgroundColor?: string;
    categoryList: ModulePicListType[];
    rowNum: number;
    animation?: AnimationType;
    picFillType?: string | number;
    picPercent?: number;
    rowPicPercent: number;
    radius?: number;
    categoryPadding?: number;
    subTitle?: ModuleSubTitleType;
    showSplitLine?: number;
    radiusStyle?: number;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
    picList?: ModulePicListType[];
    label: string;
    titleText: string;
    showMore: number;
    showMoreText: string;
}

export interface ModuleCategoryA2Type {
    listStyleType?: string | number;
    categoryList?: ModulePicListType[];
    rowNum?: number | string;
    rowPicPercent: number;
    animation?: AnimationType;
    picFillType?: string | number;
    picPercent?: number;
    radius?: number;
    categoryPadding?: number;
    subTitle?: ModuleSubTitleType;
    indicatorBar?: number;
    barWidth?: number;
    barHeight?: number;
    barWidthOn?: number;
    barColor?: string;
    barColorOn?: string;
    imageBackgroundColor?: string;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}


export interface ModuleBannerType {
    logoPic?: ModuleIcoPicType;
    logoHeight?: number;
    bannerContent: BannerContentType;
    searchContent?: BannerSearchContent;
    navContent?: BannerNavContent;
    bannerStyle?: BannerStyleType;
    moduleStyle?: ModuleStyleType;
}
export interface BannerContentType {
    picList: ModulePicListType[];
    picRadius?: number;
    height?: number;
    backgroundRadius?: number;
    gradientType?: GradientType;
    picPageType?: PicPageType;
    swiperPageColor?: string;
}
type menuIcon = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'custom'
type signIcon = 0 | 1 | 2 | 3 | 4 | 'custom'
export interface BannerSearchContent {
    showSearch?: number;
    searchText?: string;
    menuIcon?: menuIcon;
    menuLink?: {
        name?: string;
        path?: string;
        label?: string;
    };
    menuPic?: ModulePicListType;
    signIcon?: signIcon;
    signLink?: {
        name?: string;
        path?: string;
        label?: string;
    };
    signPic?: ModulePicListType;
}

export interface BannerNavContent {
    showNav?: number;
    navList?: ModuleLinkListType[];
}
type EffectType = "default" | "ceiling"
type TextAlignmentType = "left" | "center" | "right"
type ProductListStyleType = 1 | 2 | 3 | 4 | 5
export interface BannerStyleType {
    effectType?: EffectType;
    searchBackgroundColor?: string;
    searchFontColor?: string;
    searchText?: string;
    searchHeight?: number;
    searchRadius?: number;
    searchIconSize?: number;
    navPrefix?: string;
    navFontColor?: string;
    navBackgroundColor?: string;
    navPrefixColor?: string;
    textAlignment?: TextAlignmentType;
    navFontBold?: number;
    navLabelMargin?: number;
    navFontSize?: number;
}

export interface ModuleSlidingImageType {
    picList?: ModulePicListType[];
    backgroundGradientType?: GradientType;
    picFillType?: PicFillType;
    picMargin?: number;
    picPadding?: number;
    picRadius?: number;
    picReducePercent?: number;
    subTitle?: ModuleSubTitleType;
    showDesc?: number;
    descColor?: string;
    moduleStyle?: ModuleStyleType;
    autoPlay?: number;
    interval?: number;
    picWidth: number;
}
type SlidingEffectType = "auto" | "manual"
type FontPositionType = "internal" | "external"
export interface ModuleSlidingLargeImageType {
    picList: ModulePicListType[];
    rowNum: number;
    slidingEffect?: SlidingEffectType;
    slidingSpeed?: number;
    picMarginTop?: number;
    picMargin?: number;
    picRadius?: number;
    picFillType?: PicFillType;
    picTitleDesc?: TitleDescType;
    moduleTitle?: SlidingLargeImageTitleType;
    moduleStyle: ModuleStyleType;
    contentStyle?: ContentStyleType;
}
export interface TitleDescType {
    show?: number;
    titleColor?: string;
    titleFontSize?: number;
    titleFontWeight?: number;
    descColor?: string;
    descFontSize?: number;
    descFontWeight?: number;
    fontPosition?: FontPositionType,
    textAlignment?: TextAlignmentType;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    backgroundColor?: string;
}
type TitlePosition = "top" | "bottom"
export interface SlidingLargeImageTitleType {
    titleText?: string;
    subTitleText?: string;
    titlePosition?: TitlePosition;
    textAlignment?: TextAlignmentType;
    titleMarginTop?: number;
    titleMarginBottom?: number;
    titleMarginLeft?: number;
    titleColor?: string;
    titleFontSize?: number;
    titleFontWeight?: number;
    subFontTitleColor?: string;
    subFontTitleSize?: number;
    subFontTitleWeight?: number;
}
type SalePriceDecimal = 1 | 2 | 0
export interface ModuleComboSuggestionsEditType {
    comboGroups?: ComboGroupType[];
    regularPriceColor?: string;
    saleTagBackgroundColorA?: string;
    saleTagBackgroundColorB?: string;
    saleTagFontColor?: string;
    salePriceBackgroundColor?: string;
    salePriceFontColor?: string;
    salePriceDecimal?: SalePriceDecimal;
    imageRadius?: number;
    soldOutIcon?: number;
    backgroundGradientType?: GradientType;
    gradientColorA?: string;
    gradientColorB?: string;
    groupTitleColor?: string;
    bannerTittleColor: "#ffffff",
    bannerDotColor: "#ffffff",
    groupRadius?: number;
    groupShadow?: number;

    moduleStyle?: ModuleStyleType;
    // carouselDirection? : string;  //轮播方向  横向 horizontal  纵向 Vertical
    autoPlay?: number;
    interval: number;

}
type ComboType = "image" | "product"
export interface PruductList {
    productId?: number;
    productSn?: string;
    productName?: string;
    productDesc?: string;
    productPrice?: number;
    marketPrice?: number;
    picThumb?: string;
}
export interface ComboGroupType {
    titleImage: ModulePicListType;
    groupTitle?: string;
    groupSubTitle?: string;
    groupDesc?: string;
    groupColor?: string;
    groupType?: ComboType;
    picList?: ModulePicListType[];
    pruductList?: PruductList[];
    moreLink?: ModuleLinkListType;
}
export interface ComboGroupNoticeType {
    notices: ModulePicListType[];
}

type ScrollSpeedType = "scroll" | "still";
type NoticeIconType = "default" | "hide" | "custom";
export interface ModuleNoticeA2Type {
    noticeContent?: string;
    nociceLink?: {
        name?: string;
        path?: string;
        label?: string;
    };
    nociceEffect?: ScrollSpeedType;
    scrollSpeed?: number;
    textAlignment?: TextAlignmentType;
    noticeIconType?: NoticeIconType;
    iconPic?: ModuleIcoPicType;
    contentColor?: string;
    closeIcon?: number;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}
export interface ProductGroupsType {
    productGroupId?: number;
    productGroupName?: string;
    menuTitle?: string;
    productIds?: number[];
    productNumType?: string;
    productNum?: number | string;
    title?: string;
    subTitle?: string;
    bannerPic?: ModulePicListType;
    bannerLink?: ModuleLinkListType;
}
type ProductSourceType = "products" | "productGroup"
type ModuleColorStyle = "orange" | "red" | "blue" | "green" | "purple" | "grey" | "chocolate" | "brown"
type CountdownType = "dailyCycle" | "specifyTime"
type PicScaleType = "3:2" | "1:1" | "3:4" | "16:9"

export interface ModuleSpecialOfferType {
    productSource?: ProductSourceType;
    productGroups: ProductGroupsType[];
    productList: PruductList[];
    moduleColorStyle?: ModuleColorStyle;
    prodcutTitles: any[];
    moduleTitle: {
        title?: string;
        subTitle?: string;
        countdownTitle?: string;
        countdownType?: CountdownType;
        dailyTime: number[];
        specifyTime?: number;
    };
    picScale?: PicScaleType;
    picFillType?: PicFillType;
    productWidth?: number;
    productRadius?: number;
    showProductName?: number;
    productNameSize?: number;
    productNameWeight?: number;
    showProductPrice?: number;
    priceDecimal?: SalePriceDecimal;
    priceWeight?: number;
    showSellingPoints?: number;
    soldOutIcon?: number;
    moduleColor: {
        titleColor?: string;
        subTitleColor?: string;
        countdownColor?: string;
        countdownTitleColor?: string;
        productNameColor?: string;
        sellingPointsColor?: string;
    };
    moduleStyle?: ModuleStyleType;
    contentStyle: ContentStyleType;
}
type MorePosition = "top" | "auto"
export interface ModuleMixedProductDisplayType {
    productGroups: ComboGroupType[];
    rightPic?: ModulePicListType;
    showCountdown?: number;
    countdownType?: CountdownType;
    dailyTime: number[];
    specifyTime?: number;
    timeContent?: string[];

    picScale?: PicScaleType;
    picFillType?: PicFillType;
    productRadius?: number;
    morePosition?: MorePosition;

    showProductPrice?: number;
    priceWeight?: number;
    crossedOutPrice?: number;
    productSales?: number;

    moduleColor: {
        titleColor?: string;
        sellingPointColor?: string;
        countdownBackgroundColor?: string;
        countdownColor?: string;

        priceBackgroundColor?: string;
        priceColor?: string;
        crossedOutPriceColor?: string;
        lineColor?: string;
    },

    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}

export interface ModuleMixedNoticeDisplayType {
    noticeGroups: ComboGroupNoticeType[];

    picScale?: PicScaleType;
    picFillType?: PicFillType;

    moduleColor: {
        titleColor?: string;
        sellingPointColor?: string;
    },

    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}

export interface CategoryRecItem {
    title?: string;
    link?: ModuleLinkListType,
    titleColor?: string;
    backgroundColor?: string;
    catPic?: ModulePicListType;
}
export interface ModuleCategoryRecType {
    categoryList?: CategoryRecItem[];
    animation?: AnimationType;
    categoryPadding?: number;
    radius?: number;
    subTitle?: ModuleSubTitleType;
    backgroundColor?: string;
    catBorder?: number;
    catBorderWidth?: number;
    catBorderColor?: string;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}
export interface ModuleCountdownType {
    pruductList?: PruductList[];
    moduleColorStyle?: ModuleColorStyle;
    moduleTitle: {
        title?: string;
        subTitle?: string;
        moreText?: string;
        titleLink?: LinkType;
    };
    countdownData: {
        showCountdown?: number;
        countdownBackgroundPic?: ModulePicListType;
        countdownType?: CountdownType;
        dailyTime: number | Date;
        specifyTime?: number;
        timeContent?: string[];
        marginTop?: number;
        countdownPicBottom?: number;
    };
    rowNum: number;
    picScale?: PicScaleType;
    picFillType?: PicFillType;
    textAlignment?: TextAlignmentType;
    productPadding?: number;
    productRadius?: number;
    picBottomRadius?: number;
    showProductName?: number;
    showProductPrice?: number;
    headlines: number;
    priceWeight?: number;
    crossedOutPrice?: number;
    productSales?: number;
    moduleColor: {
        titleColor?: string;
        subTitleColor?: string;
        tipsColor?: string;
        productNameColor?: string;
        productBackgroundColor?: string;
        productPriceColor?: string;
        crossedOutPriceColor?: string;
        countdownColor?: string;
    }

    moduleStyle?: ModuleStyleType;
    contentStyle: ContentStyleType;
}

export interface ModuleGroupsType {
    title?: string;
    subTitle?: string;
    titleLink?: ModuleLinkListType;
    backgroundColor?: string;
    label: string;
    productList?: ProductGroupsType[];
    bannerPic?: ModulePicListType;
    bannerLink?: ModuleLinkListType;
    moreLink?: ModuleLinkListType;
}
export interface ModuleGroupSlidingType {
    groupList?: ModuleGroupsType[]; //分组数据
    groupWidth?: number; //分组宽度
    groupRadius?: number; //分组上下圆角
    productPicRatio?: number; //商品图片占比
    productPicRadius?: number; //商品图片圆角
    productPicRightRadius?: number; //商品图片右侧圆角 0为无圆角 1为圆角

    showRanking?: number; //是否显示排名 0为不显示 1为显示
    showProductLabel?: number; //是否显示商品标签 0为不显示 1为显示

    showProductName?: number; //是否显示商品标题 0为不显示 1为显示
    productNameRow: number; //商品标题行数 1为单行 2为双行
    productNameWeight?: number; //商品标题字体粗细
    productNameSize?: number; //商品标题字体大小

    showProductPrice?: number; //是否显示商品价格 0为不显示 1为显示
    productPriceWeight?: number; //商品价格字体粗细
    productPriceSize?: number; //商品价格字体大小
    showDiscountLabel?: number; //是否显示商优惠价标签 0为不显示 1为显示
    productPriceMarginTop?: number; //商品价格上距

    crossedOutPrice?: number; // 商品划线价 0?:不显示 1?:显示

    buyBtnStyle: BuyButtonStyleType; //购买按钮样式 0:不显示  1: 按钮样式1 2: 按钮样式2

    moduleColor: {
        titleSize?: number; // 模块大标题字体大小
        subTitleSize?: number; // 模块小标题字体大小
        titleColor?: string; // 模块大标题颜色
        subTitleColor?: string; // 模块小标题颜色
        titlePic?: ModulePicListType; // 模块大标题图标

        productBackgroundColor?: string; // 商品背景颜色
        productNameColor?: string; // 商品背景颜色
        labelBackgroundColor?: string; // 商品标签背景颜色
        labelTextColor?: string; // 商品标签文字颜色
        productPriceColor?: string; // 商品价格颜色
        crossedOutPriceColor?: string; // 商品划线价颜色
    };
    moduleStyle?: ModuleStyleType; // 模块样式
}

export interface GroupList {
    productGroupId?: number;  //商品分组id
    productGroupName?: string;  //商品分组名称
    title?: string;  //分组标题
    subTitle?: string;  //分组副标题
    menuTitle?: string;  //分组菜单标题
    productIds?: number[];  //分组商品id列表
    productNumType?: string;  //商品数量类型
    productNum?: number | string;  //商品数量
    bannerPic?: ModulePicListType;  //分组关联海报
    bannerLink?: ModuleLinkListType;  //分组关联链接
    productList: PruductList[];
}

type ProductCardStyleType = 1 | 2 | 3 | 4;
type BottomMoreBtnType = "text" | "image" | "close"
export interface ModuleProductGroupingType {
    productSource?: ProductSourceType;
    productGroups?: ProductGroupsType[];
    groupList: GroupList[];
    productCardStyle?: ProductCardStyleType;
    listStyle: number;
    picScale?: PicScaleType;
    picFillType?: PicFillType;
    textAlignment?: TextAlignmentType;
    cardMargin: number;
    cardPadding?: number;
    cardRadius?: number;
    picBottomRadius?: number;
    showProductName?: number;
    productNameRow: number;
    productNameWeight?: number;
    productNameSize?: number;
    showProductDesc?: number;
    showProductPrice?: number;
    productPriceWeight?: number;
    productPriceSize?: number;
    productPricePic?: ModulePicListType;
    productPriceMarginTop?: number;
    crossedOutPrice?: number;
    buyBtnStyle?: BuyButtonStyleType;
    bottomMoreBtn?: BottomMoreBtnType;
    bottomMoreBtnText?: string;
    bottomMoreBtnImage?: ModulePicListType;
    productColor: {
        infoTopPadding?: number;
        infoBottomPadding?: number;
        infoLeftRightPadding?: number;
        backgroundColor?: string;
        titleColor?: string;
        priceColor?: string;
        crossedOutPriceColor?: string;
        moreBtnBgColor?: string;
        moreBtnBorderColor?: string;
        moreBtnTextColor?: string;
    };
    groupTitle: {
        effectType?: EffectType;
        marginLeftRight?: number;
        showTitle?: number;
        bigTitleFontSize?: number;
        titleColor?: string;
        activeTitleColor?: string;
        showSubTitle?: number;
        titleFontSize?: number;
        subTitleColor?: string;
        activeSubTitleColor?: string;
        subTitleGradientType?: GradientType;
        gradientColorA?: string;
        gradientColorB?: string;
        subTitleRadius?: number;
        splitLineColor?: string;
        ceilingBgColor?: string;
    };
    moduleStyle?: ModuleStyleType;
    contentStyle: ContentStyleType;
}

export interface BuyButtonStyleType {
    showBtn?: number;
    btnType?: number;
    text?: string;
    textColor?: string;
    iconColor?: string;
    gradientType?: GradientType;
    gradientColorA?: string;
    gradientColorB?: string;
    radius?: number;
    paddingTopBottom?: number;
    paddingLeftRight?: number;
}

export interface ModuleCustomProductType {
    pruductList?: PruductList[];
    picUrl?: ModulePicListType;
    picLocation?: TextAlignmentType;
    animation?: AnimationType;
    picFillType?: PicFillType;
    productRadius?: number;
    picBottomRadius?: number;
    crossedOutPrice?: number;
    moduleColor: {
        productBackgroundColor?: string;
        productNameColor?: string;
        productPriceColor?: string;
        crossedOutPriceColor?: string;
    }
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}

export interface ModuleArticleType {
    style?: number;
    articleCategoryId?: number[];
    articleNum?: number;
    showTime?: number;
    showPageView?: number;
    showLike?: number;
    picRadius?: number;
    articleNameWeight?: TitleFontBaold;
    moduleColor: {
        articleNameColor?: string;
        articleTimeColor?: string;
        articleViewColor?: string;
        articleLikeColor?: string;
        statisticColor?: string;
    };
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}
export interface ModuleImageTextComponentType {
    picUrl?: ModulePicListType;
    title?: string;
    description?: string;
    picBorder: number;
    picBorderColor?: string;
    picRadius?: number;
    titTextAlignment?: TextAlignmentType;
    titMarginBottom?: number;
    titColor?: string;
    descTextAlignment?: TextAlignmentType;
    descColor?: string;
    moduleStyle?: ModuleStyleType;
    contentStyle?: ContentStyleType;
}
