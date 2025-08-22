import { useConfigStore } from "@/store/config";
import { useTabbarStore } from "@/store/tabbar";
import { useThemeStore } from "@/store/theme";
import { useUserStore } from "@/store/user";
import { useI18nStore } from "@/store/i18n";
import { useCurrencyStore } from "@/store/currency";
import { isOverseas } from "@/utils";
import { setIsInit } from "@/utils/request";

export default async function init() {
    const arr = [
        useConfigStore().getBaseConfigData(),
        useTabbarStore().getTabbarList(),
        useThemeStore().getThemeSettings(),
        useUserStore().getServiceConfigData()
    ];
    if (isOverseas()) {
        if (useI18nStore().isCache()) {
            arr.push(useI18nStore().init());
        }
        arr.push(useI18nStore().getLangListData(), useCurrencyStore().fetchCurrencyList());
    }

    try {
        await Promise.all(arr);
    } catch (error) {
        console.error("Initialization failed:", error);
    } finally {
        setIsInit(false);
    }
}
