<template>
    <div class="select-shop-warp">
        <div class="warp-info">
            <div class="back-btn">
                <div class="bark" @click="back()"><i class="iconfont-admin icon-zuojiantou-copy"></i>返回</div>
            </div>
            <div class="title-name">
                <div class="left-title">您可以进入以下管理后台</div>
            </div>
            <div class="sub-title-name" v-if="userinfo && userinfo?.username">
                <span>{{ encryptPhoneNumber(userinfo?.username) }}</span>
                已绑定了以下店铺，您可以进入以下任一店铺
            </div>
            <a-spin :spinning="loading" style="width: 100%; margin-top: 100px; height: 200px" />
            <div v-if="!loading && adminType === 'admin'" class="shop-list">
                <div @click="toIndex(0, 'admin')" class="shop-item" style="border-color: #ffeac7; background-color: #fff4e6; color: #4e4e4e">
                    <div class="left-item">
                        <img class="left-image" src="@/assets/logo/shop_logo_b.png" alt="" />
                        <div class="left-info">
                            <div class="left-title">
                                管理后台 <span v-if="userinfo && userinfo.username && userinfo.username !== ''">（{{ encryptPhoneNumber(userinfo?.username) }}）</span>
                            </div>
                        </div>
                    </div>
                    <div class="right-item">
                        <span class="iconfont-admin icon-login-youjiantou"></span>
                    </div>
                </div>
            </div>
            <div v-if="myShopList.length > 0" class="shop-list" :class="{'shop-list-min-height': vendorList.length == 0}">
                <div v-if="!loading" @click="toIndex(item.shopId, 'shop')" v-for="item in myShopList" class="shop-item">
                    <div class="left-item">
                        <el-image class="left-image" :src="shopLogo"></el-image>
                        <div class="left-info">
                            <div class="left-title">{{ item.shopTitle }}</div>
                        </div>
                    </div>
                    <div class="right-item">
                        <span class="iconfont-admin icon-login-youjiantou"></span>
                    </div>
                </div>
            </div>
             <div v-if="vendorList.length > 0" class="shop-list shop-list-min-height" :class="{'top': myShopList.length > 0}">
                <div v-if="!loading" @click="toIndex(item.vendorId, 'vendor')" v-for="item in vendorList" class="shop-item">
                    <div class="left-item">
                        <el-image class="left-image" :src="gysLogo"></el-image>
                        <div class="left-info">
                            <div class="left-title">{{ item.vendorName }}</div>
                        </div>
                    </div>
                    <div class="right-item">
                        <span class="iconfont-admin icon-login-youjiantou"></span>
                    </div>
                </div>
            </div>
            <div v-if="!loading && myShopList.length == 0 && vendorList.length == 0 && adminType != 'admin'" class="shop-list shop-list-min-height">
                <el-empty description="您还没有已绑定的店铺哦～" />
            </div>
           
        </div>
    </div>
</template>
<script setup lang="ts">
import shopLogo from "@/assets/logo/shop_logo.png";
import gysLogo from "@/assets/logo/gys.png";
import { useUserStore } from "@/store/user";
const props = defineProps({
    selectShopFlag: {
        type: Boolean,
        default: false
    },
    myShopList: {
        type: Array as () => any[],
        default: () => []
    },
    vendorList: {
        type: Array as () => any[],
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    userinfo: {
        type: Object,
        default: () => {}
    },
    adminType: {
        type: String,
        default: ""
    }
});
const emit = defineEmits(["closePopup", "update:selectShopFlag", "callBack"]);
const toIndex = async (id: number, type: string) => {
    emit("callBack", {id, type})
};
const { logout } = useUserStore();
const back = () => {
    emit("update:selectShopFlag", false);
    logout();
};
const isPhoneNumber = (username: string): boolean => {
    // 使用正则表达式判断是否为手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(username);
};

const encryptPhoneNumber = (username: string): string => {
    if (isPhoneNumber(username)) {
        // 加密中间4位
        return username.slice(0, 3) + "****" + username.slice(7);
    }
    return username;
};
</script>
<style scoped lang="less">
.select-shop-warp {
    background-color: #ffffff;
    padding: 20px 30px;
    box-sizing: border-box;

    .warp-info {
        display: flex;
        flex-direction: column;
        gap: 16px;
        .back-btn {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            .bark {
                display: flex;
                align-items: center;
                font-size: 16px;
                font-weight: 600;
                gap: 2px;
                cursor: pointer;
                i {
                    font-size: 14px;
                    padding-right: 5px;
                }
            }
        }

        .title-name {
            display: flex;
            justify-content: space-between;
            .bark {
                display: flex;
                align-items: center;
                font-size: 14px;
                font-weight: 600;
                gap: 2px;
                cursor: pointer;
            }

            .left-title {
                font-size: 22px;
                font-weight: bold;
            }

            .right-item {
                font-size: 14px;
            }
        }

        .sub-title-name {
            font-size: 14px;
            line-height: 1.5;

            & > span {
                font-weight: bold;
            }
        }

        .shop-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            .shop-item {
                cursor: pointer;
                border: 0.6px solid #e0e0e0;
                padding: 10px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                border-radius: 10px;

                .left-item {
                    flex: 1;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 14px;

                    .left-image {
                        width: 60px;
                        height: 60px;
                        border-radius: 10px;
                    }

                    .left-info {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;

                        .left-title {
                            font-size: 16px;
                            font-weight: bold;
                        }

                        .left-name {
                            display: flex;
                            align-items: center;
                            font-size: 14px;
                            color: #5b5b5b;
                            font-weight: 500;
                        }
                    }
                }

                .right-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            }
            &.top {
                margin-top: -8px;
            }
        }
        .shop-list-min-height {
            min-height: 200px;
        }

        .admin-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            .shop-item {
                cursor: pointer;
                border: 0.6px solid #e0e0e0;
                padding: 10px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                border-radius: 10px;

                .left-item {
                    flex: 1;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 14px;

                    .left-image {
                        width: 60px;
                        height: 60px;
                        border-radius: 10px;
                    }

                    .left-info {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;

                        .left-title {
                            font-size: 16px;
                            font-weight: bold;
                        }

                        .left-name {
                            display: flex;
                            align-items: center;
                            font-size: 14px;
                            color: #5b5b5b;
                            font-weight: 500;
                        }
                    }
                }

                .right-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            }
        }
    }
}

@media only screen and (max-width: 767px) {
    .select-shop-warp {
        padding: 0;
    }
}
</style>
