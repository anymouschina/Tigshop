import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { useConfigStore } from "@/store/config";
import { redirect } from "@/utils";
import { getUser } from "@/api/user/user";
import { userLogout } from "@/api/login/login";
import { getServiceConfig } from "@/api/common";

interface ServiceConfig {
    url: string;
    openType: number;
    show: number;
    serviceType: number;
    corpId: string;
}

export const useUserStore = defineStore("user", () => {
    const token = ref<string>(uni.getStorageSync("token") || "");
    const userInfo = ref<AnyObject>(uni.getStorageSync("userInfo") || {});
    const authType = ref<string>("");
    const serviceConfig = reactive<ServiceConfig>({
        url: "",
        openType: 0,
        show: 0,
        serviceType: 0,
        corpId: ""
    });

    async function logout() {
        try {
            await userLogout();
            const configStore = useConfigStore();
            clear();
            authType.value = "";
            // #ifdef MP-WEIXIN
            redirect({
                url: "/pages/index/index"
            });
            // #endif
            // #ifndef MP-WEIXIN
            if (configStore.XClientType === "wechat") {
                redirect({
                    url: "/pages/user/index"
                });
            } else {
                uni.reLaunch({
                    url: "/pages/login/index"
                });
            }
            // #endif
        } catch (error) {
            console.error(error);
        }
    }

    function clear() {
        token.value = "";
        uni.removeStorageSync("token");
        uni.removeStorageSync("userInfo");
        userInfo.value = {};
    }

    function setUserInfo(data: any) {
        userInfo.value = data;
        uni.setStorageSync("userInfo", data);
    }

    function setToken(tokenValue: string) {
        token.value = tokenValue;
        uni.setStorageSync("token", tokenValue);
    }

    function setAuthType(authTypeValue: string) {
        authType.value = authTypeValue;
    }

    async function getUserInfo() {
        try {
            const result = await getUser();
            setUserInfo(result);
        } catch (error) {
            console.error(error);
        }
    }

    async function getServiceConfigData() {
        try {
            const result = await getServiceConfig();
            Object.assign(serviceConfig, result);
        } catch (error) {
            console.error(error);
        }
    }

    return {
        token,
        userInfo,
        authType,
        serviceConfig,
        logout,
        clear,
        setUserInfo,
        setToken,
        setAuthType,
        getUserInfo,
        getServiceConfigData
    };
});
