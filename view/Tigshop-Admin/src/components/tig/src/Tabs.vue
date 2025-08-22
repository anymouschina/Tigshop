<template>
    <div class="tabs flex">
        <template v-for="item in tabs">
            <template v-if="item.isShow">
                <el-badge :value="item.count" color="#f33" :offset="[-5, 5]" :hidden="item.count === 0">
                    <div class="item" @click="onTabChange(item.value)" :class="modelValue == item.value ? 'active' : ''">
                        {{ item.label }}
                    </div>
                </el-badge>
            </template>
        </template>
    </div>
</template>
<script lang="ts" setup>
import { ref, defineProps, defineEmits, defineModel, PropType } from "vue";
const props = defineProps({
    tabs: {
        type: Array as PropType<Array<{ label: string; value: string; count: number; isShow: boolean }>>,
        default: () => []
    }
});
const emit = defineEmits(["onTabChange"]);
const modelValue = defineModel<any>("modelValue", { default: "" });
const onTabChange = (value: string) => {
    emit("onTabChange", value);
};
</script>
<style scoped lang="less">
.tabs {
    flex-wrap: wrap;
    gap: 10px !important;
    .item {
        min-width: 40px;
        padding: 0 8px;
        text-align: center;
        height: 25px;
        line-height: 25px;
        color: #333;
        margin-right: 5px;
        font-size: 14px;
        border-radius: 2px;
        border: 1px solid #fff;
        cursor: pointer;
        &:hover {
            color: var(--tig-primary);
        }
    }
    .active {
        color: var(--tig-primary);
        background: var(--tig-item-active-bg);
        border: 1px solid var(--tig-primary);
    }
}
</style>
