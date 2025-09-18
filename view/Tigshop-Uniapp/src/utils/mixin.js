import { currRoute } from "./";
import { useTabbarStore } from "../store/tabbar";
export default {
    install(vue) {
        vue.mixin({
            onLoad: () => {
                const route = currRoute() || "";
                useTabbarStore().$patch((state) => {
                    state.currRoute = route;
                });
            },
            onShow: () => {
                const route = currRoute() || "";
                useTabbarStore().$patch((state) => {
                    state.currRoute = route;
                });
            },
            onPageScroll() { }
        });
    }
};
//# sourceMappingURL=mixin.js.map