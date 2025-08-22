<template>
    <div class="tooltip-con">
        <el-tooltip effect="light" :placement="props.placement" :show-after="100">
            <div class="tooltip-title">
                <slot> </slot>
                <i v-if="props.ico" class="iconfont-admin icon-yiwen"></i>
            </div>
            <template #content>
                <div style="max-width:300px">{{ props.content }}</div>
            </template>
        </el-tooltip>
    </div>
</template>
<script lang="ts" setup>
const props = defineProps({
    content: {
        type: String,
        default: "",
    },
    ico: {
        type: Boolean,
        default: false,
    },
    placement: {
        type: String,
        default: "top",
    },
});
</script>
<style lang="less" scoped>
.icon-yiwen {
    color: #bab8b8;
    padding-left: 2px;
    padding-right: 2px;
    font-size: 14px;
    &:hover {
        color: #acacac;
    }
}
.tooltip-title {
    display: flex;
    flex-wrap: nowrap;
}
</style>
