import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { useConfigStore } from "./config";
import { redirect } from "../utils";
import { getUser } from "../api/user/user";
import { userLogout } from "../api/login/login";
import { getServiceConfig } from "../api/common";
export const useUserStore = defineStore("user", () => {
    const token = ref(uni.getStorageSync("token") || "");
    const userInfo = ref(uni.getStorageSync("userInfo") || {});
    const authType = ref("");
    const serviceConfig = reactive({
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
            }
            else {
                uni.reLaunch({
                    url: "/pages/login/index"
                });
            }
            // #endif
        }
        catch (error) {
            console.error(error);
        }
    }
    function clear() {
        token.value = "";
        uni.removeStorageSync("token");
        uni.removeStorageSync("userInfo");
        userInfo.value = {};
    }
    function setUserInfo(data) {
        userInfo.value = data;
        uni.setStorageSync("userInfo", data);
    }
    function setToken(tokenValue) {
        token.value = tokenValue;
        uni.setStorageSync("token", tokenValue);
    }
    function setAuthType(authTypeValue) {
        authType.value = authTypeValue;
    }
    async function getUserInfo() {
        try {
            const result = await getUser();
            setUserInfo(result);
        }
        catch (error) {
            console.error(error);
        }
    }
    async function getServiceConfigData() {
        try {
            const result = await getServiceConfig();
            Object.assign(serviceConfig, result);
        }
        catch (error) {
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
//# sourceMappingURL=user.js.map