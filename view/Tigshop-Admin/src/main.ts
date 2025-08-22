import { createApp } from "vue";
// import { createPinia } from "pinia";
import pinia from './store/store'
import App from "./App.vue";
import router from "./router";
import "./permission";
import { useVersionManager } from './utils/versionManager'
import { regGlobalComponets } from "@/components/regGlobal";
// 引入 tig 文件夹中的所有组件
import {tigGlobalComponets} from "@/components/tig/index";
const app = createApp(App);
// 初始化版本管理
useVersionManager()
regGlobalComponets(app);
tigGlobalComponets(app);
// const pinia = createPinia();
import piniaPersist from "pinia-plugin-persist";
pinia.use(piniaPersist);
app.use(pinia);

// import Antd from 'ant-design-vue';
// app.use(Antd)
// import 'default-passive-events'

import ElementPlus from "element-plus";
app.use(ElementPlus);
import "./style/css/element-variables.scss";
import "./style/global.less"; // global style
import "./style/css/m.base.less";

import "virtual:svg-icons-register";
import SvgIcon from "./components/SvgIcon.vue";
app.component("SvgIcon", SvgIcon);

app.use(router);
app.mount("#app");
