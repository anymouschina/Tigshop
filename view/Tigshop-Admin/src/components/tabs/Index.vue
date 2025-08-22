<template>
    <div class="tabs">
        <div class="tab" v-for="tab in tabs" :class="{'active': tab.name === modelValue}" @click="changeTab(tab.name)">
            {{ tab.label }}
        </div>
    </div>
</template>
<script setup>
import { computed, ref } from "vue";
const props = defineProps({
    tabs: {
        type: Array,
        default: () => []
    },
    modelValue: {
        type: String,
        default: ""
    },
});
const emit = defineEmits(['update:modelValue']);
const changeTab = (name) => { 
    emit('update:modelValue', name)
}
</script>

<style lang="less">
.tabs{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    border-bottom: 1px solid #dcdee0;
    border-bottom-color: #dcdee0;
    background-color: #fff;
    box-shadow: rgba(93, 113, 127, 0.08) 0px 5px 10px 0px;
    margin-bottom: 10px;
    .tab{
        line-height: 47px;
        height: 47px;
        max-width: 48%;
        width: 100%;
        text-align: center;
        cursor: pointer;
        color: #333;
        font-size: 14px;
        border-bottom: 2px solid #fff;
    }
    .active{
        color: #000;
        border-bottom:2px solid #155bd4;
    }
}
</style>
