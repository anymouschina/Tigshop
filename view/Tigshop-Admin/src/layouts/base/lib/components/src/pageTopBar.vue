<template>
    <div class="page-top" :class="{ 'shop-admin': adminType === 'merchant' }">
        <div class="page-top-warp" :class="{ dark: themeInfo.navTheme === 'dark' }">
            <div class="top-bar-left">
                <div class="main-menu-logo" :class="{ light: themeInfo.navTheme === 'light' }">
                    <div class="logo-box" v-if="licensedData && licensedData.adminLightLogo && licensedData.adminLightLogo !== null">
                        <img v-if="showAdminLogo" :src="imageFormat(licensedData.adminLightLogo)" key="admin-logo" />
                        <img v-if="showDefaultLogo" :src="logoWhite" key="default-logo" />
                    </div>
                </div>
                <div class="top-bar-item wap-show" @click="menusStore.menuActive = !menusStore.menuActive">
                    <span class="open-menu-btn icon-zhankai iconfont"></span>
                </div>
                <div class="top-bar-item wap-show">
                    <a class="wap-refresh-btn icon-shuaxin iconfont" href="javascript:;" onclick="location.reload();"></a>
                </div>
                <div class="top-bar-item wap-show" style="display: none">
                    <a class="wap-openShop-btn icon-wangdianwaibao iconfont" :href="urlFormat('/')" target="_blank"></a>
                </div>
                <div v-if="adminType === 'shop'" class="shop-tit">
                    <h2>当前店铺: {{ shopInfo.shopTitle }}</h2>
                    <div class="label" v-if="shopInfo.status === 0">
                        {{ shopInfo.statusText }}
                    </div>
                    <div class="label green" v-else>
                        {{ shopInfo.statusText }}
                    </div>
                </div>
                <div v-else v-click-outside="onClickOut">
                    <div class="top-bar-item top-bar-search-warp">
                        <div class="top-bar-search">
                            <TigInput
                                v-model="keyword"
                                style="width: 300px"
                                placeholder="在这里查找功能，一键直达"
                                :prefix-icon="Search"
                                @input="onInput"
                                @blur="onBlur"
                            />
                        </div>
                    </div>
                    <div class="search-menu-con" v-show="isShow">
                        <div class="search-menu-title">搜索结果</div>
                        <div class="search-menu-list">
                            <div class="menu-item" v-for="item in searchMenu" @click="toPage(item.authoritySn)">
                                <p>{{ item.authorityName }}</p>
                            </div>
                            <div class="empty" v-if="searchMenu.length < 1">没有搜索到栏目！</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="top-bar-right">
                <div class="top-bar-item mr10">
                    <Licensed></Licensed>
                </div>
                <MsgCount></MsgCount>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "@/store/user";
import { useConfigStore } from "@/store/config";
import { useMenusStore } from "@/store/menu";
import { useLicensedStore } from "@/store/licensed";
import { notification } from "ant-design-vue";
import { urlFormat, imageFormat } from "@/utils/format";
import { Search } from "@element-plus/icons-vue";
import { getSearchMenu } from "@/api/panel/adminMsg";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { cleanUp } from "@/api/common/common";
import { ClickOutside as vClickOutside } from "element-plus";
import { updateMenu } from "@/utils/menus";
import type { MainMenu } from "@/types/common/common.d";
import MsgCount from "../../src/MsgCount.vue";
import { useThemeStore } from "@/store/theme";
import logoWhite from "@/style/images/logo_white.png";
import Licensed from "../../src/Licensed.vue";

const { themeInfo } = useThemeStore();
const adminType = ref(localStorage.getItem("adminType"));
const router = useRouter();
const routerList: any[] = JSON.parse(localStorage.getItem("routers") || "[]");
const licensedStore = useLicensedStore();
const licensedData = licensedStore.licensedData;
const menusStore = useMenusStore();

interface searchFrom {
    authorityName: string;
    authoritySn: string;
    routeLink: string;
    authoritySn: string;
}

const showAdminLogo = computed(() => {
    return licensedData?.adminLightLogo != null;
});
const showDefaultLogo = computed(() => {
    return licensedData !== null && !licensedData?.adminLightLogo;
});

const keyword = ref("");
const searchMenu = ref<searchFrom[]>([]);
const isShow = ref(false);
const onInput = async (e: any) => {
    try {
        const result: any = await getSearchMenu({ keyword: keyword.value });
        searchMenu.value = result;
        if (keyword.value) {
            isShow.value = true;
        }
    } catch (error: any) {
        message.error(error.message);
    }
};
const recursionRouter = (authoritySn: string, children: any[] = []): string | undefined => {
    const routes = children.length > 0 ? children : routerList;
    let foundPath: string | undefined = undefined;

    for (let i = 0; i < routes.length; i++) {
        const item = routes[i];
        if (item.name === authoritySn) {
            if (item.children && item.children.length > 0) {
                foundPath = item.children[0].name;
            } else {
                foundPath = item.name;
            }
            break;
        } else if (item.children && item.children.length > 0) {
            const result = recursionRouter(authoritySn, item.children);
            if (result) {
                foundPath = result;
                break;
            }
        }
    }
    return foundPath;
};

const toPage = (authoritySn: string) => {
    isShow.value = false;
    keyword.value = "";
    searchMenu.value = [];
    router.push({
        name: recursionRouter(authoritySn)
    });
};
const onBlur = () => {
    if (keyword.value == "") {
        isShow.value = false;
    }
};
const onClickOut = () => {
    isShow.value = false;
};

const { logout, updateUserInfo } = useUserStore();
const userInfo = computed(() => useUserStore().userInfo);
const shopInfo = computed(() => useUserStore().shopInfo);
const vendorInfo = computed(() => useUserStore().vendorInfo);
const unreadMsg = ref(0);
// 清除缓存
const clearCache = async () => {
    try {
        const result = await cleanUp();
        const configStore = useConfigStore();
        // 更新后台设置项
        updateUserInfo();
        configStore.updateConfig();
        menusStore.mainMenu = (await updateMenu()) as MainMenu[];
        notification["success"]({
            message: "缓存已清除",
            description: "缓存清除后可刷新页面更新效果"
        });
    } catch (error: any) {
        message.error(error.message);
    }
};
const onLogout = async () => {
    logout();
};
const dialogVisible = ref(false);
const switchShop = () => {
    dialogVisible.value = true;
};
const closePopup = () => {
    dialogVisible.value = false;
};
//预览图片
onMounted(() => {
    licensedStore._getLicensed();
});
</script>
<style lang="less" scoped>
.page-top {
    background: #eef2ff;
    clear: both;
    font-size: 12px;
    height: 60px;
    z-index: 100;
    border-bottom: 1px solid #f0f2f5;
    box-sizing: border-box;

    .notice_box {
        background: #fff;
        box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.12);
        position: absolute;
        right: 0;
        width: 200px;
        top: 50px;
        display: none;
        border-radius: 9px;
        padding: 20px 10px;

        .notice_bar {
            height: 20px;
            line-height: 20px;
            padding: 10px 15px;
            font-size: 14px;
            color: #333;
            font-weight: bold;
        }

        a {
            line-height: 26px;
            color: #222;
            display: block;
            padding: 7px 15px;
            font-size: 13px;
            border-radius: 5px;

            &:hover {
                background: rgba(61, 127, 255, 0.06);
            }
        }

        .noc-warn {
            background: #f9243f;
            width: 19px;
            height: 19px;
            border-radius: 3px;
            position: absolute;
            right: 15px;
            margin-top: 4px;
            text-align: center;
            line-height: 19px;
            color: #333;
        }

        .notice-arrow {
            border-bottom: 6px solid #fff;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            left: 193px;
            position: absolute;
            top: -6px;
            display: none;
        }

        .notice_data_null {
            padding: 10px;
            text-align: center;
            font-size: 16px;
        }
    }

    .shop-tit {
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: end;

        .label {
            display: inline-block;
            padding: 1px 3px;
            color: var(--tig-red-text-color);
            border: 1px solid var(--tig-red-text-color);
            border-radius: 2px;
            margin-left: 10px;
        }

        .green {
            color: #53a42b;
            border: 1px solid #53a42b;
        }
    }
}

.page-top-warp {
    background: #fff;
    border-radius: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &.dark {
        border-radius: 0;
    }
}

.dropdown-memu {
    background-color: #ffffff;
    box-shadow:
        0 6px 16px 0 rgba(0, 0, 0, 0.08),
        0 3px 6px -4px rgba(0, 0, 0, 0.12),
        0 9px 28px 8px rgba(0, 0, 0, 0.05);
    font-size: 12px;
    border-radius: 9px;
    position: relative;
    top: -5px;

    .entrance-list {
        margin: 8px 0;
        overflow: hidden;
        padding: 8px 15px;
        width: 240px;
        display: flex;
        align-items: center;

        p {
            border-radius: 2px;
            color: #333;
            height: 80px;
            text-align: center;
            width: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            &:hover {
                background: #f5f5f5;
            }
        }

        i {
            color: #788d9b;
            display: block;
            font-size: 20px;
            height: 40px;
            line-height: 40px;
            margin: 8px auto 4px;
            width: 40px;
        }
    }

    .admin_exit {
        border-top: 1px solid #f5f5f5;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;

        a {
            line-height: 40px;
            padding: 0 10px;
            flex: 1;
            text-align: center;
        }
    }
}

.top-bar-left {
    display: flex;
    position: relative;
    align-items: center;
    height: 100%;

    .main-menu-logo {
        display: flex;
        align-items: center;
        height: 100%;
        width: 98px;
        background-color: #030021;
        justify-content: center;
        position: relative;

        &:after {
            content: "";
            position: absolute;
            width: 100%;
            height: 1px;
            background-color: #030021;
            bottom: -1px;
            left: 0px;
            right: 0px;
        }

        .logo-box {
            max-width: 80px;
            max-height: 40px;
        }

        img {
            max-width: 100%;
            max-height: 100%;
        }
        &.light {
            background-color: #eef2ff;
            &:after {
                background-color: #eef2ff;
            }
        }
    }
}

.top-bar-right {
    float: right;
    display: flex;
    align-items: center;
}

.top-bar-search {
    position: relative;
    margin: 0 0 0 20px;

    :deep(.el-input__wrapper) {
        background: #f2f4f7;
        box-shadow: 0 0 0 1px #f2f4f7 inset;
        border: 1px solid #f2f4f7;
        border-radius: 15px;
        font-size: 13px;

        &.is-focus {
            box-shadow: 0 0 0 1px var(--tig-primary) inset;
        }

        i {
            color: #98a9cc;
            font-size: 14px;
        }
    }

    input.top-bar-search-input {
        background: #f2f4f7;
        border: 1px solid #f2f4f7;
        border-radius: 15px;
        padding: 10px;
        height: 30px;
        line-height: 30px;
        box-sizing: border-box;
        padding-left: 30px;
        width: 300px;
    }

    i {
        color: #98a9cc;
        position: absolute;
        left: 10px;
        top: 8px;
        font-size: 14px;
    }
}

.search-menu-con {
    right: auto !important;
    left: 30px !important;
    top: 40px;
    background-clip: padding-box;
    background-color: #ffffff;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.12);
    font-size: 12px;
    position: absolute;
    border-radius: 9px;

    .empty {
        padding: 0;
    }

    .search-menu-title {
        padding: 20px 20px 0 20px;
        color: #333;
    }

    .search-menu-list {
        padding: 20px;
        width: 350px;
        display: flex;
        flex-wrap: wrap;

        .menu-item {
            margin: 0 12px 12px 0;
            padding: 10px 18px;
            border-radius: 9px;
            background: #f7f8fa;
            cursor: pointer;
            display: inline-block;
            color: #666;
            font-size: 13px;

            a {
                color: #666;
            }
        }
    }
}

.wap-show {
    display: none;
}

.top-bar-user {
    .admin-user-name {
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        word-break: keep-all;
        max-width: 100px;
    }
}

@media only screen and (max-width: 767px) {
    .page-top {
        left: 0;
        min-width: 100%;
    }

    .wap-show {
        display: block;
    }

    .openShop-btn {
        display: none;
    }

    .open-menu-btn {
        padding: 0 20px;
        display: block;
        line-height: 58px;
        cursor: pointer;
        color: #333;
    }

    .page-top-warp {
        border-radius: 0;

        .wap-refresh-btn,
        .wap-openShop-btn {
            padding: 0 15px;
            display: block;
            line-height: 55px;
            cursor: pointer;
            font-size: 20px;
            color: #333;
        }

        .clearCache-btn {
            display: none;
        }
    }

    .top-bar-search-warp {
        display: none;
    }

    .top-bar-item .top-bar-btn {
        word-break: keep-all;
        margin: 0;
        padding-left: 10px;
    }

    .top-bar-user {
        margin-left: 10px;
        margin-right: 10px;

        .admin-user-name {
            max-width: 60px;
        }
    }

    .shop-tit {
        display: none;
    }
    .main-menu-logo {
        display: none !important;
    }
}

.shop-admin {
    &.page-top {
        background-color: #030021;
    }
}
</style>
<style>
body .page-top .el-dialog__header {
    display: none;
}
</style>
