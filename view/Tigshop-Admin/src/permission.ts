import router, { resetRouter } from "./router";
import { useAppStore } from "@/store/app";
import { setDocumentTitle } from "@/utils/domUtils";
import { useMenusStore } from "@/store/menu";
import { useUserStore } from "@/store/user";
import { getMenu } from "@/utils/menus";
import { loginOut } from "@/utils/storage";
import { processRoutes } from "@/utils/authorize";

const allowList = ["loginIndex", "merchantLogin"]; // 免登录名单
const loginRoutePath = "/login/index"; // 确保与路由配置一致
let isLoggingOut = false; // 标志位，避免重复执行登出逻辑
router.beforeEach(async (to, from, next) => {
    // 设置文档标题
    if (to.meta?.title) {
        setDocumentTitle(`${to.meta.title}`);
    }
    const appStore = useAppStore();
    appStore.setHeaderTitle(to.meta.title as string);
    const accessToken = localStorage.getItem("accessToken");
    const shopId = localStorage.getItem("shopId");

    // 处理登出逻辑
    if (to.path === loginRoutePath && to.query.logout === "1" && !isLoggingOut) {
        isLoggingOut = true;
        loginOut();
        resetRouter();
        next({ path: loginRoutePath, query: {} });
        // 刷新页面
        setTimeout(() => {
            location.reload();
        }, 300);
        return;
    }

    // 处理登录状态
    if (accessToken) {
        // if (!shopId) {
        // const userStore = useUserStore();
        // userStore.logout(false); // 调用登出方法，清理状态
        // next({ path: loginRoutePath, replace: true });
        // } else {
        const menuStore = useMenusStore();
        if (to.path === loginRoutePath) {
            // 登录成功后，检查 redirect 参数
            const redirect = to.query.redirect as string;
            if (redirect) {
                next({ path: redirect, replace: true });
            } else {
                next({ path: menuStore.routers[0] ? menuStore.routers[0].path : "/", replace: true });
            }
        } else {
            if (menuStore.hasAddRoutes) {
                next();
            } else {
                const routers = await getMenu();
                menuStore.setRouters(processRoutes(routers) || []);
                menuStore.routers.forEach((route: any) => router.addRoute(route));

                router.addRoute({
                    path: "/:pathMatch(.*)*",
                    name: "notFound",
                    meta: { title: "404", is404: true },
                    component: () => import("@/layouts/base/index.vue"),
                    children: [
                        {
                            path: "",
                            name: "notFoundIndex",
                            meta: { title: "404" },
                            component: () => import("@/layouts/base/404.vue")
                        }
                    ]
                });

                menuStore.setHasAddRoutes(true);
                next({ ...to, replace: true });
            }
        }
        // }
    } else {
        if (allowList.includes(<string>to.name) || to.path === loginRoutePath) {
            next(); // 在免登录名单，或已在登录页，继续
        } else {
            next({ path: loginRoutePath, query: { redirect: to.fullPath } });
        }
    }
    isLoggingOut = false; // 清理标志位
});

router.afterEach(() => { });
