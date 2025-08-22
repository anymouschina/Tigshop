import { defineStore } from "pinia";
import { ref } from "vue";
import { getLang, getLangList, getDefaultLang } from "@/api/common";
import { useI18n } from "vue-i18n";
import type { LangListItem } from "@/types/common";

export const useI18nStore = defineStore("i18n", () => {
    const langList = ref<LangListItem[]>([]);

    const { locale, setLocaleMessage } = useI18n();

    const data = ref(uni.getStorageSync("localeLang") || null);

    const langCode = ref<string>(uni.getStorageSync("langCode") || "");

    const isCache = () => {
        // 本地语言缓存数据是否存在
        if (data.value && data.value.localeCode && data.value.langData) {
            setLangCode(data.value.localeCode);
            setLangData(data.value.localeCode, data.value.langData);
            return true;
        }
        return false;
    };

    const init = async () => {
        if (!langCode.value) {
            await getDefaultLangConfig();
        } else {
            await getLangData(langCode.value);
        }
    };

    const getLangListData = async () => {
        try {
            const result = await getLangList();
            langList.value = result;
        } catch (error) {
            console.error(error);
        }
    };

    // 获取语言数据
    const getLangData = async (localeCode: string) => {
        try {
            const result = await getLang(localeCode);
            setLangCode(localeCode);
            setLangData(localeCode, result);
        } catch (error) {
            console.error(error);
        }
    };

    // 获取默认语言配置
    const getDefaultLangConfig = async () => {
        try {
            const result = await getDefaultLang(uni.getLocale());
            await getLangData(result.localeCode);
        } catch (error) {
            console.error(error);
        }
    };

    const setLangCode = (localeCode: string) => {
        console.log("Setting language code:", localeCode);
        langCode.value = localeCode;
        uni.setStorageSync("langCode", localeCode); 
        uni.setLocale(localeCode);
        if(localeCode == 'zh'){
            uni.setLocale('zh-Hans');
        }
    };

    // 设置语言数据
    const setLangData = (localeCode: string, langData: any) => {
        locale.value = localeCode;
        setLocaleMessage(localeCode, langData);
        uni.setStorageSync("localeLang", { langData, localeCode });
    };

    return {
        langList,
        langCode,
        getLangData,
        getLangListData,
        getDefaultLangConfig,
        init,
        isCache
    };
});
