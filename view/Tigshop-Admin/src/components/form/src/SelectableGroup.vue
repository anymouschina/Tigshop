<template>
    <!--    <el-input style="width: 180px" v-model="modelValue"></el-input>-->
    <div :class="['selectable-group', { 'is-single': !isMultiple }, { 'is-multiple': isMultiple }]">
        <div v-for="(option, index) in options" :key="index" :class="['option', { 'is-selected': isSelected(option) }]" @click="toggleSelection(option)">
            {{ option.label }}
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
    options: {
        type: Array,
        required: true
    },
    isMultiple: {
        type: Boolean,
        default: false
    }
});
const modelValue = defineModel("modelValue");

const toggleSelection = (option) => {
    if (!props.isMultiple) {
        modelValue.value = option.value;
    } else {
        const index = modelValue.value.findIndex((o) => o === option.value);
        if (index === -1) {
            modelValue.value.push(option.value);
        } else {
            modelValue.value.splice(index, 1);
        }
    }
};

const isSelected = (option) => {
    if (!props.isMultiple) {
        return modelValue.value === option.value;
    }
    return modelValue.value.some((o) => o === option.value);
};
</script>

<style lang="less" scoped>
.selectable-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;

    .option {
        padding: 0 8px;
        border: 1px solid #c8c9cc;
        cursor: pointer;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        height: 30px;
        justify-content: center;
        font-size: 14px;
        border-radius: 2px;
        transition: all 0.2s ease-in-out;
        color: #c8c9cc;

        &:hover {
            color: var(--tig-primary);
            border-color: var(--tig-primary);
        }

        &.is-selected {
            color: var(--tig-primary);
            border-color: var(--tig-primary);
        }
    }

    .checkmark {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: var(--tig-primary);
        margin: auto;
    }
}
</style>
