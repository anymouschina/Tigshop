<template>
    <div class="responsive-top-menu">
        <div
            v-for="(menu, index) in visibleMenus"
            :key="`menu-${menu.meta.authoritySn}`"
            class="menu-item"
            :class="[themeInfo.navTheme, { current: isActive(menu) }]"
            @click="actionPush(menu)"
        >
            {{ menu.meta.authorityName }}
        </div>

        <div v-if="hiddenMenus.length > 0" class="more-container" @mouseenter="showDropdown = true" @mouseleave="showDropdown = false">
            <div class="menu-item" :class="themeInfo.navTheme">
                更多
                <i class="iconfont-admin icon-sanjiaoxing"></i>
            </div>
            <transition name="fade">
                <div v-show="showDropdown" class="dropdown-menu">
                    <div class="dropdown-box">
                        <div
                            v-for="menu in hiddenMenus"
                            :key="`hidden-${menu.meta.authoritySn}`"
                            class="dropdown-item"
                            :class="{ current: isActive(menu) }"
                            @click="handleDropdownClick(menu)"
                        >
                            {{ menu.meta.authorityName }}
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useMenusStore } from "@/store/menu";
import { useThemeStore } from "@/store/theme";

const { themeInfo } = useThemeStore();
const router = useRouter();
const store = useMenusStore();
const showDropdown = ref(false);
const screenWidth = ref(window.innerWidth);
interface RouteItem {
    path: string;
    name: string;
    component?: any;
    redirect?: string;
    meta: {
        title?: string;
        is404?: boolean;
        isShowInHeader?: boolean;
        queryParam?: string;
        [key: string]: any;
    };
    children?: RouteItem[];
    [key: string]: any;
}
const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280
};

const maxVisibleItems = computed(() => {
    if (screenWidth.value >= BREAKPOINTS.XL) return 12;
    if (screenWidth.value >= BREAKPOINTS.LG) return 8;
    if (screenWidth.value >= BREAKPOINTS.MD) return 5;
    if (screenWidth.value >= BREAKPOINTS.MD) return 3;
    return 1;
});

const menus = computed(() => store.routers || []);

const visibleMenus = computed(() => {
    const filtered = menus.value.filter((menu) => menu.meta.isShow);
    return filtered.slice(0, maxVisibleItems.value);
});

const hiddenMenus = computed(() => {
    const filtered = menus.value.filter((menu) => menu.meta.isShow);
    return filtered.slice(maxVisibleItems.value);
});

const isActive = (menu: RouteItem) => {
    return router.currentRoute.value.matched[0].name === menu.name;
};

const actionPush = (menu: RouteItem) => {
    router.push(menu.path);
};

const handleDropdownClick = (menu: RouteItem) => {
    actionPush(menu);
    showDropdown.value = false;
};

const handleResize = () => {
    screenWidth.value = window.innerWidth;
};

onMounted(() => {
    window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="less">
.responsive-top-menu {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;

    .menu-item {
        padding: 10px 16px;
        cursor: pointer;
        white-space: nowrap;
        border-radius: 4px;
        transition: all 0.2s ease;
        color: #b6babf;
        &:hover {
            background: #9c9c9c2e;
        }
        &.current {
            color: #fff;
            font-weight: bold;
        }

        &.light {
            color: #788d9b;
            &:hover {
                background: #f7f7f7;
            }
        }
    }

    .more-container {
        position: relative;
        .dropdown-menu {
            position: absolute;
            left: 0;
            top: 45px;
            background: white;
            min-width: 120px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            .dropdown-box {
                padding: 10px;
                .dropdown-item {
                    cursor: pointer;
                    transition: all 0.2s ease;
                    padding: 10px;
                    gap: 10px;

                    &:hover {
                        background: var(--tig-item-active-bg);
                        color: var(--tig-text-hover);
                    }
                }
            }
        }
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
}
</style>
