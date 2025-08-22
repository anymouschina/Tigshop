import { createSSRApp } from "vue";
import App from "./App.vue";
import pinia from "@/store/index";
import "@/utils/permission";
import uviewPlus from "uview-plus";
import mixin from "@/utils/mixin";
import i18n from "@/i18n";

export function createApp() {
    const app = createSSRApp(App);
    app.use(pinia).use(i18n).use(uviewPlus).use(mixin);
    return {
        app,
        pinia
    };
}
