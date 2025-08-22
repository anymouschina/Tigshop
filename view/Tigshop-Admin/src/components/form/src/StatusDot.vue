<template>
    <template v-if="inline">
        <span class="ant-badge-status-dot ant-badge-status-processing" :class="{ 'flicker': props.flicker }" :style="badgeStyle"></span>
    </template>
    <template v-else>
        <div class="ant-badge-status-dot ant-badge-status-processing" :class="{ 'flicker': props.flicker }" :style="badgeStyle"></div>
    </template>
</template>
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
    inline: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: "#1890ff"
    },
    flicker: {
        type: Boolean,
        default: false
    },
    size: {
        type: Number,
        default: 6
    }
});

const badgeStyle = computed(() => {
    return {
        "--border-color": props.color,
        "background-color": props.color,
        "width": props.size + "px",
        "height": props.size + "px"
    };
});
</script>
<style scoped lang="less">
.ant-badge-status-processing {
    position: relative;
    margin-right: 4px;
}

.ant-badge-status-dot {
    position: relative;
    top: -1px;
    display: inline-block;
    //width: 6px;
    //height: 6px;
    vertical-align: middle;
    border-radius: 50%;
    box-sizing: border-box;
}

.ant-badge-status-processing:after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    content: "";
    box-sizing: border-box;
}

.ant-badge-status-processing.flicker:after {
    -webkit-animation: antStatusProcessing 1.2s ease-in-out infinite;
    animation: antStatusProcessing 1.2s ease-in-out infinite;
}

@keyframes antStatusProcessing {
    0% {
        -webkit-transform: scale(.8);
        transform: scale(.8);
        opacity: .5
    }
    to {
        -webkit-transform: scale(2.4);
        transform: scale(2.4);
        opacity: 0
    }
}
</style>
