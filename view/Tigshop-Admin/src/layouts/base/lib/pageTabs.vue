<template>
    <div class="page-tabs">
        <el-tabs v-model="activeTab" @tab-change="tabChange" @tab-remove="tabRemove" type="card" addable ref="tabs">
            <template #add-icon>
                <el-dropdown placement="top-start">
                    <el-icon size="16"><MoreFilled /></el-icon>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="closeOtherTabs">关闭其他</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </template>
            <el-tab-pane v-for="item in tabList" :key="item.path" :name="item.path" :closable="tabList.length !== 1">
                <template #label>
                    <el-popover ref="popover" :visible="item.isShow" @click.native.stop>
                        <template #reference>
                            <div class="custom-tabs-label" @contextmenu.prevent="handleContextMenu(item)">
                                <span class="title">{{ removeSuffix(item.title) }}</span>
                                <div class="custom-tabs-refresh" @click="refreshCurrentTab(item)">
                                    <el-icon size="16" :class="{ 'anticon-spin': isRotating }"><RefreshRight /></el-icon>
                                </div>
                            </div>
                        </template>
                        <template #default>
                            <div>
                                <el-button type="primary" link @click="closeOtherTabs(item)">关闭其他</el-button>
                            </div>
                        </template>
                    </el-popover>
                </template>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script lang="ts" setup>
import { MoreFilled, RefreshRight } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, nextTick, shallowRef, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { removeSuffix } from "@/utils/authorize"; // 确保你有这个工具函数的实现
import { useAppStore } from "@/store/app";
const appStore = useAppStore();
interface TabType {
    title: string;
    path: string;
    isShow: boolean;
}
const route = useRoute();
const router = useRouter();
const activeTab = ref(route.path);
const tabList = reactive<TabType[]>([]);
const popover = <any>shallowRef();
const handleClickOutside = (event: any) => {
    if (popover.value) {
        // 关闭popover
        tabList.map((item) => {
            item.isShow = false;
        });
    }
};
onMounted(() => {
    document.addEventListener("click", handleClickOutside);
    const currentPath = route.path;
    if (!tabList.some((item) => item.path === currentPath) && route.meta.title) {
        tabList.push({
            title: route.meta.title as string,
            path: currentPath,
            isShow: false
        });
    }
    activeTab.value = currentPath;
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
});

const handleContextMenu = (item: TabType) => {
    // 关闭其他标签的 isShow
    tabList.forEach((tab) => {
        if (tab !== item) {
            tab.isShow = false; // 关闭其他标签的显示
        }
    });
    // 显示当前选项
    item.isShow = true;
};
const isRotating = ref(false);
const refreshCurrentTab = (currentTab: TabType) => {
    appStore.routerKey++;
    if (!isRotating.value) {
        isRotating.value = true;
        // 设定1秒动画结束后停止旋转
        setTimeout(() => {
            isRotating.value = false;
        }, 1000);
    }
};

// 刷新当前标签页数据的功能
// const refreshCurrentTab = (currentTab: TabType) => {
//     console.log(`刷新 ${currentTab.title} 页的数据`);
//     // 在这里添加你的数据刷新逻辑，例如调用 API
//     // 例如: fetchData(currentTab.path);
// }

// 点击标签导致 activeTab 改变时触发
const tabChange = (tab: string) => {
    activeTab.value = tab;
    router.push(tab);
};

// 添加路由 添加到标签页
const addTab = (tab: TabType) => {
    const index = tabList.findIndex((item) => item.path === tab.path);
    if (index === -1) {
        tabList.push(tab);
    }
};

// 路由变更之前的全局守卫
router.beforeEach((to) => {
    activeTab.value = to.path;
    addTab({
        title: to.meta.title as string,
        path: to.path,
        isShow: false
    });
});

// 关闭标签页
const tabRemove = (targetTab: string) => {
    const targetIndex = tabList.findIndex((tab) => tab.path === targetTab);
    if (targetIndex !== -1) {
        if (activeTab.value === targetTab) {
            const nextTab = tabList[targetIndex - 1] || tabList[targetIndex + 1];
            if (nextTab) {
                activeTab.value = nextTab.path;
                router.push(activeTab.value);
            }
        }
        // 从 tabList 中删除标签
        tabList.splice(targetIndex, 1);
    }
    if (tabList.length === 0) {
        router.push("/panel/index/");
    }
};
const closeOtherTabs = (item: TabType) => {
    item.isShow = false;
    nextTick(() => {
        const currentPath = item.path || activeTab.value;
        const tabsToRemove = tabList.filter((v) => v.path !== currentPath); // 记录需要关闭的标签
        tabsToRemove.forEach((v) => {
            tabRemove(v.path);
        });
    });
};
</script>

<style scoped lang="less">
/* 可以根据需要添加样式 */
.page-tabs {
    background: #fff;
    padding-top: 10px;
    .custom-tabs-label {
        display: flex;
        align-items: center;
        padding: 0 6px 0 16px;

        .custom-tabs-refresh {
            padding: 5px 0 5px 8px;
            box-sizing: border-box;
            height: 34px;
            display: flex;
            align-items: center;
            display: none;
        }
    }
    :deep(.el-tabs--card) {
        .el-tabs__header {
            padding: 0 16px !important;
            margin-bottom: 0;
            .el-tabs__new-tab {
                border: none;
            }
            .el-tabs__nav {
                border: none;
                gap: 10px;
                .el-tabs__item {
                    padding: 0 0 0 0 !important;
                    border: 1px solid #fff;
                    border-bottom: 0px;
                    padding: 0;
                    background-color: #fff;
                    padding-top: 1px;
                    border-radius: 8px 8px 0 0;
                    .is-icon-close {
                        width: 14px;
                        right: 0;
                        margin: 0 16px 0 0;
                    }
                    .custom-tabs-label {
                        transition: color 0.3s;
                    }
                    &:hover {
                        color: var(--el-text-color-primary);
                        .custom-tabs-label {
                            color: var(--el-color-primary);
                        }
                    }
                    &.is-active {
                        border-color: #e4e7ed;
                        background-color: #f5f7fa;
                        padding-top: 0;
                        height: 41px;
                        line-height: 38px;
                        color: var(--el-text-color-primary);
                        .custom-tabs-label {
                            color: var(--el-color-primary);
                        }
                        .custom-tabs-refresh {
                            display: flex;
                            transition: transform 1s;
                            color: var(--el-text-color-primary);
                            &:hover {
                                color: var(--el-color-primary);
                            }
                        }
                        .is-icon-close {
                            &:hover {
                            }
                        }
                    }
                    &:nth-child(2):not(.is-active).is-closable {
                        &:hover {
                            padding: 0;
                        }
                    }
                }
            }
        }
    }
    :deep(.is-closable) {
        &:hover {
            padding: 0;
            margin: 0;
            left: 0;
            right: 0;
        }
    }
}
.anticon-spin {
    display: inline-block;
    -webkit-animation: loadingCircle 1s infinite linear;
    animation: loadingCircle 1s infinite linear;
}
@keyframes loadingCircle {
    100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
    }
}
</style>
