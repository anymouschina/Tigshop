<template>
    <div class="div2">
        <div class="notice-warp">
            <p>提示：该分类进入的是{{ slide ? "滑动切换分类商品瀑布流" : "按分类搜索的结果" }}页面。</p>
        </div>
        选择分类页面{{ slide ? "（滑动）" : "" }}：
        <SelectCategory v-model:categoryId="categoryId" v-model:categoryName="categoryName"></SelectCategory>
    </div>
</template>
<script lang="ts" setup>
import { SelectCategory } from "@/components/select";
import { computed, ref } from "vue";

const props = defineProps({
    modelValue: { type: Number, default: 0 },
    slide: { type: Boolean, default: false }
});
const emit = defineEmits(["update:modelValue"]);
const categoryName = ref("");
const categoryId = computed({
    get: () => props.modelValue,
    set: (newValue) => {
        emit("update:modelValue", newValue);
        linkSelectData.value = {
            path: "list",
            label: "分类",
            id: newValue,
            name: categoryName.value,
            data: {
                id: newValue,
            }
        };
    }
});
const linkSelectData = defineModel("linkSelectData");
</script>
<style lang="less" scoped>
.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}
</style>
