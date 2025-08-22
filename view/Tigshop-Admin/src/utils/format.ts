import { useConfigStore } from "@/store/config";
import { returnAvatar } from "@/utils/avatar";
import { extractContent } from "@/utils/util";

// 格式化图片地址
export function imageFormat(path: string | undefined) {
    const config = useConfigStore();
    if (!path) {
        return "";
    }
    // if (Number(config.get("storageType")) > 0) {
    return path.includes("http") ? path : config.get("storageUrl") + path;
    // } else {
    //     return path.includes("http") ? path :  path.indexOf('/') > 0 ? "/" + path : path;
    // }
}

//格式化头像
export function avatarFormat(avatar: string) {
    if(extractContent(String(avatar)) == 'def'){
        return returnAvatar(avatar)
    }else{
        return imageFormat(avatar)
    }
}
// 格式化金额
export function priceFormat(price: number | undefined | null, currencyFormat = true) {
    const config = useConfigStore();
    const currency = config.get("dollarSign") ?? "¥";
    price = price ? price : 0;
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (currencyFormat) {
        return currency + "" + num.toFixed(2);
    } else {
        return num.toFixed(2);
    }
}

// 链接格式化
export function urlFormat(params: string | { path: string; [key: string]: any; platform?: string }): string {
    const config = useConfigStore();
    const domain = config.get("pcDomain") ? config.get("pcDomain") : config.get("h5Domain");
    if (typeof params === "string") {
        return domain + params;
    } else {
        switch (params.path) {
            case "product":
                return domain + "/item/" + params.sn + "";
            default:
                return domain + params.path;
        }
    }
}
export function urlWapFormat(params: string | { path: string; [key: string]: any }): string {
    const config = useConfigStore();
    const domain = config.get("h5Domain") ? config.get("h5Domain") : "";
    if (typeof params === "string") {
        return domain + "/mobile" +  params;
    } else {
        switch (params.path) {
            case "product":
                return domain + "/item/?id=" + params.id + "";
            default:
                return domain + params.path;
        }
    }
}

export function convertNullsToEmptyStrings(obj: any) {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj[key] === null || obj[key] === undefined || obj[key] === 'null' || obj[key] === 'undefined') {
          obj[key] = '';
        } else if (typeof obj[key] === 'object') {
          // 递归处理嵌套对象
          convertNullsToEmptyStrings(obj[key]);
        }
      }
      return obj;
    }
    return {};
  }

//格式化头像
export function baseDirFormat(path: string) {
    if(path) {
       const result = /^\//.test(path);
       return result ? path : `/${path}`
    } else {
        return '';
    }
}