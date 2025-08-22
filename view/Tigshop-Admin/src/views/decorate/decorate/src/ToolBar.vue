<template>
    <div class="theme-toolbar">
        <div class="theme-menu-con show">
            <div class="theme-con-box">
                <el-tabs v-model="activeName" class="demo-tabs">
                    <el-tab-pane label="基础模块" name="toolList"></el-tab-pane>
                    <el-tab-pane label="高级模块" name="advancedList" v-if="isPro()"></el-tab-pane>
                </el-tabs>
                <div class="inside">
                    <el-collapse v-model="activeNames">
                        <el-collapse-item title="基础模块" name="tool" v-if="activeName === 'toolList'">
                            <template #title>
                                <div class="modules-head J_ModuleListHead">
                                    <span>基础模块</span>
                                </div>
                            </template>
                            <draggable
                                class="module-list"
                                item-key="type"
                                :list="toolList"
                                ghost-class="sortable-ghost"
                                chosen-class="toolChosenClass"
                                animation="300"
                                @start=""
                                @end=""
                                :sort="false"
                                :group="{ name: 'advanced', pull: 'clone', put: false }"
                                :clone="clone"
                            >
                                <template #item="{ element, index }">
                                    <div class="list-item tool-list-item" @click="onAdd(index, 'toolList', element)">
                                        <span v-if="element.content" class="pic" v-html="element.content"> </span>
                                        <span v-if="element.label" class="content">{{ element.label }}</span>
                                    </div>
                                </template>
                            </draggable>
                        </el-collapse-item>
                        <el-collapse-item title="其它模块" name="other" v-if="activeName === 'toolList'">
                            <template #title>
                                <div class="modules-head J_ModuleListHead">
                                    <span>其它模块</span>
                                </div>
                            </template>
                            <draggable
                                class="module-list"
                                item-key="type"
                                :list="otherList"
                                ghost-class="sortable-ghost"
                                chosen-class="toolChosenClass"
                                animation="300"
                                @start=""
                                @end=""
                                :sort="false"
                                :group="{ name: 'advanced', pull: 'clone', put: false }"
                                :clone="clone"
                            >
                                <template #item="{ element, index }">
                                    <div class="list-item tool-list-item" @click="onAdd(index, 'otherList')">
                                        <span v-if="element.content" class="pic" v-html="element.content"> </span>
                                        <span v-if="element.label" class="content">{{ element.label }}</span>
                                    </div>
                                </template>
                            </draggable>
                        </el-collapse-item>
                        <el-collapse-item title="高级模块" name="advanced" v-if="activeName === 'advancedList' && isPro()">
                            <template #title>
                                <div class="modules-head J_ModuleListHead">
                                    <span>高级模块</span>
                                </div>
                            </template>
                            <draggable
                                class="module-list"
                                item-key="type"
                                :list="advancedList"
                                ghost-class="sortable-ghost"
                                chosen-class="toolChosenClass"
                                animation="300"
                                @start=""
                                @end=""
                                :sort="false"
                                :group="{ name: 'advanced', pull: 'clone', put: false }"
                                :clone="clone"
                            >
                                <template #item="{ element, index }">
                                    <div class="list-item tool-list-item" @click="onAdd(index, 'advancedList')">
                                        <span v-if="element.content" class="pic" v-html="element.content"> </span>
                                        <span v-if="element.label" class="content">{{ element.label }}</span>
                                    </div>
                                </template>
                            </draggable>
                        </el-collapse-item>
                    </el-collapse>
                    <div style="height: 50px"></div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, defineAsyncComponent, onMounted, shallowRef } from "vue";
import draggable from "vuedraggable";
import { cloneDeep } from "lodash";
import { isPro, isOverseas } from "@/utils/version";
const adminType = localStorage.getItem("adminType");
const activeNames = ref(["tool", "other", "advanced"]);
const props = defineProps({
    modules: {
        type: Object,
        default: () => ({})
    }
});
const activeName = ref("toolList");

const modules = ref(props.modules);
const toolList = ref([
    // { type: "article", url: "mobile", label: "文章列表", content: '<i class="iconfont-admin icon-article"></i>', module: {}, isShow: true },
    { type: "imageAd", url: "mobile", label: "图片广告1", content: '<i class="iconfont-admin icon-image_nav"></i>', module: {}, isShow: true },
    { type: "imageAd2", url: "mobile", label: "图片广告2", content: '<i class="iconfont-admin icon-image_nav"></i>', module: {}, isShow: isOverseas() ? true : false },
    { type: "imageSquareAd", url: "mobile", label: "图片魔方", content: '<i class="iconfont-admin icon-image_square_ad"></i>', module: {}, isShow: true },
    { type: "imageHotarea", url: "mobile", label: "热图绘制", content: '<i class="iconfont-admin icon-image_hotarea"></i>', module: {}, isShow: true },
    { type: "product", url: "mobile", label: "商品", content: '<i class="iconfont-admin icon-product"></i>', module: {}, isShow: true },
    { type: "product2", url: "mobile", label: "商品2", content: '<i class="iconfont-admin icon-product"></i>', module: {}, isShow: isOverseas() ? true : false },
    { type: "whiteLine", url: "mobile", label: "分割线", content: '<i class="iconfont-admin icon-white_line"></i>', module: {}, isShow: true },
    { type: "whiteBlank", url: "mobile", label: "空白辅助", content: '<i class="iconfont-admin icon-white_blank"></i>', module: {}, isShow: true },
    { type: "imageNav", url: "mobile", label: "图文导航", content: '<i class="iconfont-admin icon-image_nav"></i>', module: {}, isShow: true },
    { type: "titleAd", url: "mobile", label: "文本标题", content: '<i class="iconfont-admin icon-title_ad"></i>', module: {}, isShow: true },
    { type: "notice", url: "mobile", label: "公告", content: '<i class="iconfont-admin icon-notice"></i>', module: {}, isShow: true }
]);
const advancedList = ref([
    // { type: "customProduct", url: "mobilePro", label: "个性商品", content: '<i class="iconfont-admin icon-product"></i>', module: {}, isShow: true },
    {
        type: "imageTextComponent",
        url: "mobilePro",
        label: "图文介绍",
        content: '<i class="iconfont-admin icon-image_text_component"></i>',
        module: {},
        isShow: true
    },
    { type: "productGrouping", url: "mobilePro", label: "商品分组", content: '<i class="iconfont-admin icon-product_grouping"></i>', module: {}, isShow: true },
    { type: "groupSliding", url: "mobilePro", label: "分组滑动", content: '<i class="iconfont-admin icon-group_sliding"></i>', module: {}, isShow: true },
    { type: "countdown", url: "mobilePro", label: "倒计时", content: '<i class="iconfont-admin icon-countdown"></i>', module: {}, isShow: true },
    { type: "categoryRec", url: "mobilePro", label: "分类推荐", content: '<i class="iconfont-admin icon-category_rec"></i>', module: {}, isShow: true },
    {
        type: "mixedProductDisplay",
        url: "mobilePro",
        label: "商品混排",
        content: '<i class="iconfont-admin icon-mixed_product_display"></i>',
        module: {},
        isShow: true
    },
    { type: "specialOffer", url: "mobilePro", label: "天天特价", content: '<i class="iconfont-admin icon-special_offer"></i>', module: {}, isShow: true },
    { type: "noticeA2", url: "mobilePro", label: "公告", content: '<i class="iconfont-admin icon-notice"></i>', module: {}, isShow: true },
    { type: "mixedNotice", url: "mobilePro", label: "公告混排", content: '<i class="iconfont-admin icon-notice"></i>', module: {}, isShow: true },
    {
        type: "comboSuggestions",
        url: "mobilePro",
        label: "组合推荐",
        content: '<i class="iconfont-admin icon-combo_suggestions"></i>',
        module: {},
        isShow: true
    },
    {
        type: "slideLargeImage",
        url: "mobilePro",
        label: "大图滑动",
        content: '<i class="iconfont-admin icon-slide_large_image"></i>',
        module: {},
        isShow: true
    },
    { type: "slidingImage", url: "mobilePro", label: "小图滑动", content: '<i class="iconfont-admin icon-sliding_image"></i>', module: {}, isShow: true },
    { type: "banner", url: "mobilePro", label: "首焦轮播", content: '<i class="iconfont-admin icon-banner"></i>', module: {}, isShow: true },
    { type: "categoryNav", url: "mobilePro", label: "类目导航", content: '<i class="iconfont-admin icon-category_nav"></i>', module: {}, isShow: true },
    { type: "categoryNavA1", url: "mobilePro", label: "类目导航A1", content: '<i class="iconfont-admin icon-category_nav"></i>', module: {}, isShow: true },
    { type: "categoryNavA2", url: "mobilePro", label: "类目导航A2", content: '<i class="iconfont-admin icon-category_nav"></i>', module: {}, isShow: true },
    { type: "categoryNavA3", url: "mobilePro", label: "类目导航A3", content: '<i class="iconfont-admin icon-category_nav"></i>', module: {}, isShow: true }
]);
const otherList = ref([
    { type: "coupon", url: "mobilePromotion", label: "优惠券", content: '<i class="iconfont-admin icon-coupon"></i>', module: {}, isShow: true }
]);
const adminToolList = ref([
    { type: "searchBar", url: "mobile", label: "商品搜索", content: '<i class="iconfont-admin icon-search_bar"></i>', module: {}, isShow: true },
    { type: "searchBar2", url: "mobile", label: "商品搜索2", content: '<i class="iconfont-admin icon-search_bar"></i>', module: {}, isShow: isOverseas() ? true : false },
    { type: "catNav", url: "mobile", label: "分类导航", content: '<i class="iconfont-admin icon-cat_nav"></i>', module: {}, isShow: true }
]);
const adminOtherList = ref([
    { type: "seckill", url: "mobilePromotion", label: "秒杀", content: '<i class="iconfont-admin icon-seckill"></i>', module: {}, isShow: true },
    { type: "seckill2", url: "mobilePromotion", label: "秒杀2", content: '<i class="iconfont-admin icon-seckill"></i>', module: {}, isShow: isOverseas() ? true : false }
]);
const shopToolList = ref([
    { type: "shopInfo", url: "mobilePromotion", label: "店铺信息", content: '<i class="iconfont-admin icon-product"></i>', module: {}, isShow: true }
]);
const clone = (obj: any) => {
    let newObj = cloneDeep(obj);
    // 增加唯一键值
    newObj.moduleIndex = Date.now();
    // 删除没用的值
    delete newObj.content;
    return newObj;
};
const emit = defineEmits(["item-added"]);
const onAdd = (index: number, type = "toolList", e?: MouseEvent) => {
    const listMap = {
        toolList: toolList.value,
        advancedList: advancedList.value,
        otherList: otherList.value
    };

    let addItem: any;

    const selectedList = listMap[type as "toolList" | "advancedList" | "otherList"];
    if (selectedList && selectedList[index]) {
        addItem = cloneDeep(selectedList[index]);
        addItem.moduleIndex = Date.now();
        modules.value.moduleList.push(addItem); // 将模块加入列表
        // Emit 事件以通知父组件新模块已添加
        emit("item-added", { newIndex: modules.value.moduleList.length - 1 });
    } else {
        throw new Error("无效的类型或索引");
    }
};
onMounted(() => {
    const shopId = localStorage.getItem("shopId");
    if (shopId && shopId != "0") {
        toolList.value = [...toolList.value, ...shopToolList.value, ...adminOtherList.value];
    } else {
        toolList.value = [...toolList.value, ...adminToolList.value];
        otherList.value = [...otherList.value, ...adminOtherList.value];
    }
});
</script>
<style lang="scss" scoped>
.theme-con-box {
    :deep(.el-tabs__item) {
        padding: 0;
        margin: 5px 20px;
    }
    :deep(.el-collapse) {
        border: none !important;
    }
    :deep(.el-collapse-item__header) {
        border: none !important;
    }
    :deep(.el-collapse-item__wrap) {
        border: none !important;
    }
    :deep(.el-collapse-item__content) {
        padding-bottom: 10px;
        line-height: 0.8;
    }
}
</style>
