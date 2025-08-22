<template>
    <div :class="'module-ad-con module-notice'" :style="frameFormat.boxPadding + frameFormat.boxPaddingTop + frameFormat.boxPaddingBottom">
        <div class="notice-ad-warp">
            <div class="notice-con" :style="frameFormat.backgroundColor + ' ' + frameFormat.boxRadius">
                <!-- <div class="module-ad-empty empty-image_ad">
                <div class="image-empty-bg"></div>
                <div class="desc">公告</div>
            </div> -->
                <div class="notice-item">
                    <div class="item-content">
                        <div class="item-notice-con" :style="itemFormat.itemBackgroundColor + itemFormat.itemHeight + itemFormat.itemRadius">
                            <div class="item-notice-ico"><img :src="imageFormat(module?.icoPic.picUrl)" /></div>
                            <div class="item-notice-list">
                                <div class="item-notice-input" :style="itemFormat.textColor">{{ module?.text }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, computed, Ref } from "vue";
import { imageFormat } from "@/utils/format";
import { ModuleType } from "@/types/decorate/decorate.d";
import { mergeDefaultModule, defaultFrame, formatFrame, defaultIcoPic } from "@/views/decorate/decorate/src/modules/";
// 在modules加入要使用的模块
const module = defineModel<ModuleType>("module") as Ref<ModuleType>;
const defaultModule = ref({
    text: "公告内容",
    icoPic: defaultIcoPic,
    frame: defaultFrame
});
mergeDefaultModule(module.value, defaultModule.value);
module.value.icoPic.picUrl='https://oss.tigshop.com/img/gallery/202508/1754895669bP3iJSUiXSBoRB1VQq.png'
const { frame } = module.value;
const frameFormat = computed(() => {
    return formatFrame(frame ?? {});
});
const itemFormat = computed(() => {
    return {
        itemBackgroundColor: `background-color:${module?.value?.frame?.itemBackgroundColor};`,
        itemRadius: `border-radius:${module?.value?.frame?.itemRadius}px;`,
        itemHeight: `height:${module?.value?.frame?.itemHeight}px;`,
        textColor: `color:${module?.value?.frame?.textColor};`
    };
});
</script>
