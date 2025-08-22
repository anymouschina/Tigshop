import { createI18n } from "vue-i18n";
import { getTranslate } from "@/api/common";
import { isOverseas } from "@/utils";
import messages from "@/locale/index";

const i18n = createI18n({
    legacy: false,
    fallbackLocale: "zh",
    globalInjection: true,
    missing: (locale, key) => {
        if (isOverseas() && key) {
            const untranslatedCache = uni.getStorageSync("untranslatedCache") ? JSON.parse(uni.getStorageSync("untranslatedCache")) : [];
            if (!Array.isArray(untranslatedCache)) {
                uni.setStorageSync("untranslatedCache", JSON.stringify([]));
                return key;
            }
            if (untranslatedCache.includes(key)) return key;
            try {
                untranslatedCache.push(key);
                uni.setStorageSync("untranslatedCache", JSON.stringify(untranslatedCache));
                getTranslate({ translationName: key });
            } catch (e) {}
        }
        return key;
    },
    // 使用新版配置项完全禁用警告
    missingWarn: false,
    fallbackWarn: false,
    // 保留旧版配置，以确保兼容性
    silentTranslationWarn: true,
    silentFallbackWarn: true,
    messages
});

export default i18n;
