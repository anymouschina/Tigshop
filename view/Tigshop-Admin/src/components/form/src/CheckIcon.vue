<template>
    <div @click="toggleSelected" class="box-warp">
        <div class="check-icon iconfont-admin icon-gou" :class="{ 'selected': isSelected }"></div>
    </div>
</template>

<script setup lang="ts">

import { computed } from "vue";

const selected = defineModel<Boolean>("selected");
const emit = defineEmits(["update:selected", "selected-change"]);

const toggleSelected = () => {
    emit("selected-change", !selected.value);
};
const isSelected = computed(() => {
    return selected.value;
});

</script>

<style lang="less" scoped>
.box-warp {
    display: flex;
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;

    .check-icon {
        width: 16px;
        height: 16px;
        cursor: pointer;
        border-radius: 50%;
        background-color: #c8c9cc;
        padding: 2px;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        color: white;
        font-size: 12px;
    }

    .selected {
        background-color: green;
    }
}


</style>
