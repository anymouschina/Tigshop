import { useConfigStore } from "@/store/config";
import { ref, toRefs } from "vue";
import { onPageScroll } from "@dcloudio/uni-app";

export function useScrollTop(handleScroll?: any) {
    const scrollTop = ref(0);

    if (handleScroll && typeof handleScroll === "function") {
        handleScroll((e: any) => {
            scrollTop.value = e.scrollTop;
        });
    } else {
        onPageScroll((e) => {
            scrollTop.value = e.scrollTop;
        });
    }
    return {
        scrollTop
    };
}

export function useSafeAreaInsets() {
    const configStore = useConfigStore();
    const { top, bottom } = toRefs(configStore.safeAreaInsets);
    return {
        saveTop: top,
        safeBottom: bottom
    };
}

export function useMenuButtonInfo() {
    const configStore = useConfigStore();
    const { left, right, top, height } = toRefs(configStore.menuButtonInfo);
    return {
        menuLeft: left,
        menuRight: right,
        menuTop: top,
        menuHeight: height
    };
}

export function useSaveTopBoxHeight(contentHeight = 0) {
    const contentHeightRef = ref(contentHeight);
    const contentWidthRef = ref("100%");
    const height = ref(0);
    const { saveTop } = useSafeAreaInsets();
    const { menuTop, menuHeight, menuLeft } = useMenuButtonInfo();
    // #ifdef APP-PLUS || H5
    height.value = saveTop.value + contentHeightRef.value;
    // #endif
    // #ifndef H5 || APP-PLUS || MP-ALIPAY
    contentWidthRef.value = menuLeft.value + "px";
    contentHeightRef.value = (menuTop.value - saveTop.value) * 2 + menuHeight.value;
    height.value = contentHeightRef.value + saveTop.value;
    //  #endif
    return {
        height,
        contentHeight: contentHeightRef,
        contentWidth: contentWidthRef,
        statusBarHeight: saveTop
    };
}

export { useResetReactive, useResettableRef } from "./useResetState";
export { default as useList } from "./useList";
export { default as useStorageData } from "./useStorageData";
