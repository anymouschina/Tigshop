<template>
    <template v-if="title.showTitle">
        <div :class="'image-ad-title ad-title_style__' + title.titleStyle" :style="titleFormat.titleBackground + titleFormat.titleRadius">
            <div class="image-ad-title-l">
                <img
                    v-if="title?.titleBackgroundPic && title?.titleBackgroundPic.picThumb"
                    class="image-ad-title-img"
                    :src="imageFormat(title?.titleBackgroundPic.picThumb)"
                    alt=""
                    srcset=""
                />
                <div class="image-ad-title-h" :style="'color: ' + title.titleColor">{{ title.titleText }}</div>
                <div class="image-ad-title-d" :style="'color: ' + title.descColor">{{ title.descText }}</div>
            </div>
            <template v-if="title.showMore">
                <slot name="more">
                    <div class="image-ad-title-r">
                        <div class="more-link" url="{{title.moreLink ? title.moreLink.link : ''}}" :style="{ color: title?.moreColor }">
                            <span :style="title?.moreColor">更多</span> <i class="iconfont-h5 icon-youjiantou" :style="title?.moreColor"></i>
                        </div>
                    </div>
                </slot>
            </template>
        </div>
    </template>
</template>
<script lang="ts" setup>
import { ref, computed, Ref } from "vue";
import { imageFormat } from "@/utils/format";
import { ModuleTitleType } from "@/types/decorate/decorate.d";
import { mergeDefaultModule, defaultTitle, formatTitle } from "@/views/decorate/decorate/src/modules/";
// 在modules加入要使用的模块
const title = defineModel<ModuleTitleType>("modelValue") as Ref<ModuleTitleType>;
const titleFormat = computed(() => {
    return formatTitle(title.value);
});
</script>

<style scoped>
.modules-item .module-ad-con {
    min-height: 0;
}

.image-ad-title-r {
    font-size: 12px;
}

.image-ad-title-img {
    width: 30px;
    height: 30px;
    margin-right: 5px;
}
</style>
