<template>
    <div class="layout-basic">
        <div class="layout-top">
            <pageTopMenu v-if="themeInfo.layout == 'topMenu'"></pageTopMenu>
            <pageTopBar v-if="themeInfo.layout == 'default'"></pageTopBar>
        </div>
        <div class="layout-main">
            <div class="layout-left-menu">
                <pageLeftMenu></pageLeftMenu>
            </div>
            <div class="layout-container">
                <el-scrollbar ref="ScrollBar" class="layout-content-warp">
                    <pageContainer>
                        <router-view />
                    </pageContainer>
                </el-scrollbar>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import pageLeftMenu from "./src/pageLeftMenu.vue";
import pageTopBar from "./src/pageTopBar.vue";
import pageTopMenu from "./src/pageTopMenu.vue";
import pageContainer from "./src/pageContainer.vue";
import { useThemeStore } from "@/store/theme";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElScrollbar } from "element-plus";

const themeStore = useThemeStore();
const themeInfo: any = themeStore.themeInfo;
themeStore.getThemeInfo();
const ScrollBar = ref<InstanceType<typeof ElScrollbar>>();
const route = useRoute();  // 获取当前路由
onMounted(() => {
    ScrollBar.value?.scrollTo(0, 0);
});
// 监听路由变化
watch(route, (to, from) => {
    ScrollBar.value?.scrollTo(0, 0);
});

</script>
<style lang="less" scoped>
.layout-basic {
    display: flex;
    flex-direction: column;
    height: 100%;

    .layout-top {
        z-index: 20;
    }

    .layout-main {
        display: flex;
        flex: 1;
        height: 0;
        min-height: 0;
        z-index: 11;

        .layout-container {
            flex: 1;
            display: flex;
            overflow-y: auto;
            position: relative;
            background-color: #f5f7fa;

            .layout-content-warp {
                width: 100%;
            }
        }
    }
}
</style>
