const accessToken: any = localStorage.getItem("accessToken");
import { useLicensedStore } from "@/store/licensed"
import pinia from '@/store/store'
const licensed = useLicensedStore(pinia);
const licensedData: any = JSON.parse(localStorage.getItem("licensedData") as any) || licensed.licensedData;
//判断是否授权
export function isAuthorized() {
    let isAuth = false;
    if (licensedData && licensedData.license != "") {
        isAuth = true;
    }
    return isAuth
}
const poweredBytxt = " - powered by tigshop"
// 修改路由标题 是否授权  - powered by tigshop
export function processRoutes(routes: any[]) {
    if (!accessToken) {
        return
    }
    routes.forEach(route => {
        if (route.meta.title && route.meta.title !== 'undefined') {
            if (!isAuthorized() || licensedData.deCopyright == 0) {
                if (!route.meta.title?.includes(poweredBytxt)) {
                    route.meta.title += poweredBytxt;
                }
            }
            if (isAuthorized() && licensedData.deCopyright != 0 && licensedData.poweredByStatus == 0) {
                if (!route.meta.title?.includes(poweredBytxt)) {
                    route.meta.title += poweredBytxt;
                }
            }
        }
        if (route.children) {
            processRoutes(route.children);
        }
    });
    return routes;
}

// 头部去后缀
export function removeSuffix(title: string): string {
    // 定义要去掉的后缀
    const suffix = poweredBytxt;
    // 检查标题是否包含后缀，如果包含则去掉
    if (title && title.endsWith(suffix)) {
        return title.slice(0, title.length - suffix.length); // 去掉后缀
    } else {
        return title;
    }
}
import no_licensed from '@/style/images/no_licensed.png';
import business_authorization from '@/style/images/business_authorization.png';
import business_authorization_pro from '@/style/images/business_authorization_pro.png';
import enterprise_authorization from '@/style/images/enterprise_authorization.png';
import enterprise_authorization_pro from '@/style/images/enterprise_authorization_pro.png';
// 授权判断, 后台头像授权是否显示
export function isShowAvatar() {
   // 授权判断 未授权 0  商业授权 1 商业授权pro 2  企业授权 3 企业授权pro 4
    let url = no_licensed;
    if (licensedData.isEnterprise == 0) {
        if (licensedData.versionType.includes('pro')) {
            url = business_authorization_pro;
        } else {
            url = business_authorization;
        }
    }
    if (licensedData.isEnterprise == 1) {
        if (licensedData.versionType.includes('pro')) {
            url = enterprise_authorization_pro;
        } else {
            url = enterprise_authorization;
        }
    }
    return url;
}