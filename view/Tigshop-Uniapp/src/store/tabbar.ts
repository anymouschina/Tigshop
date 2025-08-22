import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getMobileNav } from "@/api/tabbar";
import { useConfigStore } from "@/store/config";
import { urlFormat } from "@/utils/format";
import ico1 from "@/static/images/common/ico_1.png";
import ico2 from "@/static/images/common/ico_2.png";
import ico3 from "@/static/images/common/ico_3.png";
import ico4 from "@/static/images/common/ico_4.png";
import ico1h from "@/static/images/common/ico_1h.png";
import ico2h from "@/static/images/common/ico_2h.png";
import ico3h from "@/static/images/common/ico_3h.png";
import ico4h from "@/static/images/common/ico_4h.png";

export const useTabbarStore = defineStore("tabbar", () => {
    const tabbarList = ref<any[]>([]);
    const tabbarHeightNum = ref(60);
    const currRoute = ref("");

    const tabbarHeight = computed(() => {
        const configStore = useConfigStore();
        return tabbarHeightNum.value + configStore.safeBottom + "px";
    });

    const formatTabarList = ref<string[]>([]);

    const currentActiveValue = computed(() => {
        const index = formatTabarList.value.findIndex((item) => {
            return `/${currRoute.value}` === item;
        });
        return index;
    });

    async function getTabbarList() {
        try {
            const result = await getMobileNav();
            formatTabarList.value = result.data.navList.map((item: any) => {
                return urlFormat(item.picLink).split("?")[0];
            });
            tabbarList.value = result.data.navList.map((item: any) => {
                return {
                    link: item.picLink,
                    image: item.picThumb,
                    activeImage: item.picActiveThumb,
                    text: item.picTitle
                };
            });
        } catch (error) {
            tabbarList.value = [
                {
                    link: "/pages/index/index",
                    image: ico1,
                    activeImage: ico1h,
                    text: "首页"
                },
                {
                    link: "/pages/productCate/index",
                    image: ico2,
                    activeImage: ico2h,
                    text: "分类"
                },
                {
                    link: "/pages/cart/index",
                    image: ico3,
                    activeImage: ico3h,
                    text: "购物车"
                },
                {
                    link: "/pages/user/index",
                    image: ico4,
                    activeImage: ico4h,
                    text: "我的"
                }
            ];
            console.error(error);
        }
    }

    return {
        tabbarList,
        tabbarHeightNum,
        tabbarHeight,
        formatTabarList,
        currentActiveValue,
        currRoute,
        getTabbarList
    };
});
