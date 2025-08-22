<template>
    <up-number-box
        v-model="number"
        :icon-style="iconStyle"
        :button-size="buttonSize"
        :min="min"
        :max="max"
        :input-width="inputWidth"
        :disabled="disabled"
        @overlimit="overlimit"
        @change=""
    />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
    modelValue: {
        type: Number,
        default: 1
    },
    max: {
        type: Number,
        default: 99
    },
    min: {
        type: Number,
        default: 1
    },
    inputWidth: {
        type: [String, Number],
        default: 35
    },
    buttonSize: {
        type: [String, Number],
        default: 30
    },
    buttonWidth: {
        type: [String, Number],
        default: 35
    },
    iconStyle: {
        type: String,
        default: ""
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(["update:modelValue", "overlimit", "change"]);

const number = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit("update:modelValue", value);
        emit("change", value);
    }
});

const overlimit = (val: any) => {
    emit("overlimit", val);
};

const getButtonWidth = computed(() => {
    return props.buttonWidth + "px";
});
</script>

<style lang="scss" scoped>
.u-number-box {
    :deep(.u-number-box__plus) {
        width: v-bind(getButtonWidth);
    }
    :deep(.u-number-box__minus) {
        width: v-bind(getButtonWidth);
    }
}
</style>
