export { default as CommonTitle } from "./src/commonTitle/View.vue";
export { default as CommonCountdown } from "./src/commonCountdown/View.vue";
export { default as CommonBuyButton } from "./src/commonBuyButton/View.vue";
import { ModuleFrameType, ModuleTitleType, ModuleStyle, ModuleSubTitle, ModuleContentStyle } from "@/types/decorate/decorate.d";
import { cloneDeep } from "lodash";

// 模块设置默认值
export const defaultFrame = {
    textColor: "",
    itemBackgroundColor: "",
    backgroundColor: "#ffffff",
    innerPadding: 0,
    itemHeight: 35,
    itemRadius: 3,
    boxRadius: 0,
    boxPadding: 10,
    leftAndRightPadding: 0,
    boxPaddingTop: 5,
    boxPaddingBottom: 5
};
// 标题默认值
export const defaultTitle = {
    showTitle: 0,
    titleStyle: 1,
    titleAlign: 1,
    titleBackground: "",
    titleBackground2: "",
    titleBackgroundPic: {
        picUrl: "",
        picThumb: ""
    },
    titleRadius: 0,
    titleText: "标题内容",
    titleColor: "",
    descText: "",
    descColor: "#aaaaaa",
    showMore: 0,
    moreLink: [],
    moreColor: "#aaaaaa",
    format: {
        titleBackground: "",
        titleRadius: ""
    }
};
// 图片环东效果
export const defaultAnimation = {
    type: "scale",
    duration: 0.5,
    delay: 0.2,
    range: 0.5
};
// 小标题默认值
export const defaultSubTitle = {
    showTitle: 1,
    titleColor: "#454545",
    titleFontSize: 12,
    titleFontBold: 400
};
// 模块样式默认值
export const defaultModuleStyle = {
    boxPaddingTopBottom: 0, //模块上下间距
    boxPaddingTop: 5, //模块顶部间距
    boxPaddingBottom: 0, //模块底部间距
    boxPadding: 10, //模块左右间距
    bannerMarginTop: 10, //banner顶部间距
    backgroundColor: "", //背景颜色
    backgroundPic: {
        //背景图片
        picUrl: "",
        picThumb: ""
    },
    backgroundPicFillType: "cover" //背景图片填充方式
};
// 内容区样式默认值
export const defaultContentStyle = {
    paddingTopBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeftRight: 0,
    padding: 0,
    boxRadiusTop: 0,
    boxRadiusBottom: 0,
    boxRadius: 0,
    gradientType: "upDown",
    gradientColorA: "",
    gradientColorB: "",
    backgroundColor: "",
    backgroundPic: {
        picUrl: "",
        picThumb: ""
    },
    backgroundPicFillType: "cover",
    boxShadow: 0
};

// 购买按钮样式默认值
export const defaultBuyButtonStyle = {
    showBtn: 1, //是否显示按钮
    btnType: 1, //按钮类型
    text: "", //按钮文字
    textColor: "#ffffff", //按钮文字颜色
    iconColor: "#ffffff", //按钮图标颜色
    gradientType: "leftRight", //按钮背景渐变类型
    gradientColorA: "#333333", //按钮背景渐变颜色A
    gradientColorB: "#333333", //按钮背景渐变颜色B
    radius: 16, //按钮圆角
    paddingTopBottom: 0, //按钮高度
    paddingLeftRight: 10 //按钮宽度
};

// 商品默认值
export const defaultProducts = {
    productSelectType: 1,
    productIds: [],
    productCategoryId: [],
    productNumber: 0,
    productTag: ""
};
// 公告图标图片
export const defaultIcoPic = {
    picUrl: "",
    picThumb: ""
};
// 背景图
export const defaultBackgroundPic = {
    picUrl: "",
    picThumb: ""
};
// 合并默认值
export const mergeDefaultModule = (module: any, defaultModule: any) => {
    defaultModule = cloneDeep(defaultModule);
    Object.keys(defaultModule).forEach((key) => {
        if (module[key] === undefined || module[key] === null || module[key] === "") {
            module[key] = defaultModule[key];
        }
    });
};
// 格式化模块设置
export const formatFrame = (frame: ModuleFrameType) => {
    return {
        innerPadding: "padding:" + frame.innerPadding + "px;",
        boxPadding: "padding-left:" + frame.boxPadding + "px;padding-right:" + frame.boxPadding + "px;",
        boxPaddingTop: "padding-top:" + frame.boxPaddingTop + "px;",
        boxPaddingBottom: "padding-bottom:" + frame.boxPaddingBottom + "px;",
        backgroundColor: frame.backgroundColor ? "background-color:" + frame.backgroundColor + ";" : "",
        boxRadius: "border-radius:" + frame.boxRadius + "px;"
    };
};
// 格式化标题
export const formatTitle = (title: ModuleTitleType) => {
    let backgroundText = title.titleBackground2
        ? title.titleBackground2
            ? `background:linear-gradient(to right, ${title.titleBackground}, ${title.titleBackground2});`
            : ""
        : title.titleBackground
          ? "background-color:" + title.titleBackground + ";"
          : "";
    return {
        titleBackground: backgroundText,
        titleRadius: "border-radius:" + title.titleRadius + "px " + title.titleRadius + "px " + "0 0;"
    };
};

export const gradientMap: { [key: string]: string } = {
    upDown: "to bottom",
    leftRight: "to right",
    diagonal: "to right bottom"
};
type CommonStyle = {
    moduleStyle: any;
    moduleContentStyle: any;
    moduleSubTitle: any;
};
export const formatCommonStyle = (moduleStyle: ModuleStyle, moduleContentStyle?: ModuleContentStyle, moduleSubTitle?: ModuleSubTitle) => {
    let obj: CommonStyle = {
        moduleStyle: {} as ModuleStyle,
        moduleContentStyle: {} as ModuleContentStyle,
        moduleSubTitle: {}
    };
    if (moduleStyle) {
        obj.moduleStyle = {
            boxPaddingTopBottom: `padding-top:${moduleStyle.boxPaddingTopBottom}px;padding-bottom:${moduleStyle.boxPaddingTopBottom}px;`,
            boxPadding: "padding-left:" + moduleStyle.boxPadding + "px;padding-right:" + moduleStyle.boxPadding + "px;",
            boxPaddingTop: "padding-top:" + moduleStyle.boxPaddingTop + "px;",
            boxPaddingBottom: "padding-bottom:" + moduleStyle.boxPaddingBottom + "px;",
            backgroundColor: moduleStyle.backgroundColor ? "background-color:" + moduleStyle.backgroundColor + ";" : "",
            backgroundImage: moduleStyle.backgroundPic.picUrl
                ? "background-image:url(" + moduleStyle.backgroundPic.picUrl + ");"
                : `background-color:${moduleStyle.backgroundColor};`,
            backgroundSize: `background-size: ${moduleStyle.backgroundPicFillType};`
        };
    }
    if (moduleContentStyle) {
        obj.moduleContentStyle = {
            paddingLeftRight: "padding-left:" + moduleContentStyle.paddingLeftRight + "px;padding-right:" + moduleContentStyle.paddingLeftRight + "px;",
            paddingTopBottom: "padding-top:" + moduleContentStyle.paddingTopBottom + "px;padding-bottom:" + moduleContentStyle.paddingTopBottom + "px;",
            paddingTop: "padding-top:" + moduleContentStyle.paddingTop + "px;",
            paddingBottom: "padding-bottom:" + moduleContentStyle.paddingBottom + "px;",
            innerPadding: "padding:" + moduleContentStyle.padding + "px;",
            backgroundColor: moduleContentStyle.backgroundColor ? "background-color:" + moduleContentStyle.backgroundColor + ";" : "",
            backgroundImage: moduleContentStyle.backgroundPic?.picUrl
                ? "background-image:url(" + moduleContentStyle.backgroundPic.picUrl + ");"
                : `background-image: linear-gradient( ${gradientMap[moduleContentStyle.gradientType]}, ${
                      moduleContentStyle.gradientColorA
                  }, ${moduleContentStyle.gradientColorB});`,
            backgroundSize: `background-size: ${moduleContentStyle.backgroundPicFillType};`,
            boxRadius: `border-radius:${moduleContentStyle.boxRadiusTop}px ${moduleContentStyle.boxRadiusTop}px ${moduleContentStyle.boxRadiusBottom}px ${moduleContentStyle.boxRadiusBottom}px;`,
            boxRadius2: `border-radius:${moduleContentStyle.boxRadius}px;`,
            boxShadow: moduleContentStyle.boxShadow === 1 ? "box-shadow:rgba(0, 0, 0, 0.06) 0px 2px 4px;" : ""
        };
    }

    if (moduleSubTitle) {
        obj.moduleSubTitle = {
            textFontSize: "font-size:" + moduleSubTitle.titleFontSize + "px;",
            textBlod: "font-weight:" + moduleSubTitle.titleFontBold + ";",
            textColor: "color:" + moduleSubTitle.titleColor + ";"
        };
    }
    return obj;
};

export const formatAnimation = (type: string, range: number) => {
    let num = range ? 50 * range : 50 * 0.3;
    switch (type) {
        case "close":
            return ``;
        case "scale":
            return `transform: translate(0px, 0px) scale(${range});opacity:0;`;
        case "slideLeft":
            return `transform: translate(-${num}px, 0px) scale(1);opacity:0;`;
        case "slideRight":
            return `transform: translate(${num}px, 0px) scale(1);opacity:0;`;
        case "slideTop":
            return `transform: translate(0px, ${num}px) scale(1);opacity:0;`;
        case "flip":
            return `transform: translate(0px, 0px) scale(1) rotateY(-180deg);opacity:0;`;
        default:
            return "";
    }
};

export const copyArray = (data: any, num = 1) => {
    let result: any = [];
    for (let i = 0; i < num; i++) {
        if (data && typeof data === "object") {
            result = [...result, ...data];
        } else {
            result = [...result, data];
        }
    }
    return result;
};

export const getDemoList = (list: any) => {
    return list.filter((item: any) => item.productId === 0);
};
