<template>
    <div
        :class="'module-ad-con module-search_bar'"
        :style="frameFormat.boxPadding + frameFormat.boxPaddingTop + frameFormat.boxPaddingBottom + frameFormat.backgroundColor"
    >
        <div class="module-ad-content" :style="allFormat.itemBackgroundColor + ' '">
            <div class="oversea-sousuo-box">
                <div class="oversea-sousuo" :style="allFormat.itemHeight + allFormat.itemBorderRadius">
                    <div class="sousuo-icon">
                        <div class="iconfont-h5 icon-sousuo2" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { ModuleType } from "@/types/decorate/decorate.d";
import { mergeDefaultModule, defaultFrame, formatFrame, defaultIcoPic } from "@/views/decorate/decorate/src/modules/";
const module = defineModel<ModuleType>("module");
const defaultModule = ref({
    text: "搜索商品",
    icoPic: defaultIcoPic,
    frame: defaultFrame
});
mergeDefaultModule(module.value, defaultModule.value);

const { frame } = module.value;
const frameFormat = computed(() => {
    return formatFrame(frame);
});

const allFormat = computed(() => {
    return {
        itemBackgroundColor: `background-color: ${module?.value?.frame?.itemBackgroundColor};`,
        itemHeight: `height: ${module?.value?.frame?.itemHeight}px;`,
        itemBorderRadius: `border-radius: ${module?.value?.frame?.itemRadius}px;`,
        textColor: `color: ${module?.value?.frame?.textColor};`
    };
});
</script>

<style lang="less" scoped>
.oversea-sousuo-box {
    .oversea-sousuo {
        border: 1px solid #1a1a1a;
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 12px;

        .sousuo-icon {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            
            .icon-sousuo2 {
                font-size: 20px;
            }
        }
    }
}
</style>
