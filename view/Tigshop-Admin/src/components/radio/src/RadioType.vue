<template>
    <div class="radio-style" v-if="radioType == 1">
        <template v-for="item in radioList" :key="item['key']">
            <div v-if="!disabled || modelValue == item['key']" :class="{ selected: modelValue == item['key'], disabled: disabled }" class="item-radio" :style="{ width: width }" @click="checkRadio(item)">
                <div v-if="modelValue == item['key']" :class="[{ triangleHeight: item['desc'] }, { triangle2: !item['desc'] }]" class="triangle"></div>
                <div class="title-row flex flex-justify-center flex-align-center">
                    <div class="title">
                        {{ item["title"] }}
                    </div>
                    <el-tooltip effect="light" placement="bottom" show-after="150">
                        <template #content>
                            <div style="width: 200px; text-align: left">{{ item["tips"] }}</div>
                        </template>
                        <el-icon v-if="item['tips']" color="#999999" size="14" style="margin-left: 5px"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </div>
                <div class="desc">{{ item["desc"] ? item["desc"] : "" }}</div>
            </div>
        </template>
    </div>
    <div class="radio-style2" v-if="radioType == 2">
        <div
            v-for="item in radioList"
            :key="item['key']"
            :class="{ selected: modelValue == item['key'], disabled: disabled }"
            class="item-radio"
            :style="{ width: width }"
            @click="checkRadio(item)"
        >
            <div v-if="modelValue == item['key']" :class="[{ triangleHeight: item['desc'] }, { triangle2: !item['desc'] }]" class="triangle"></div>
            <div class="title" style="margin-top: 20px; margin-bottom: 30px">{{ item["title"] }}</div>
            <div class="desc">{{ item["desc"] ? item["desc"] : "" }}</div>
            <div class="tips">{{ item["tips"] ? item["tips"] : "" }}</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { QuestionFilled } from "@element-plus/icons-vue";
const props = defineProps({
    modelValue: {
        type: Number,
        default: ""
    },
    radioList: {
        type: Array as any,
        default: []
    },
    width: {
        type: String,
        default: "160px"
    },
    radioType: {
        type: Number,
        default: 1
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(["update:modelValue"]);
const checkRadio = (value: any) => {
    if (props.disabled == false) {
        emit("update:modelValue", value.key);
    }
};
</script>
<style lang="less" scoped>
.radio-style {
    display: flex;
    gap: 8px;
    flex-direction: row;
    flex-wrap: wrap;

    .selected {
        border: 1px solid var(--el-color-primary) !important;
        background: #fff;
        position: relative;
        cursor: default;

        .title {
            color: var(--el-color-primary) !important;
        }
    }
    .disabled {
        border: 1px solid #f5f7fa !important;
        background: #f5f7fa;
        position: relative;
        cursor: default;

        .title {
            color: #333 !important;
        }
        .triangle {
            border-bottom: 20px solid #969799;
        }
        .triangle::after {
            color: #f5f7fa; /* 对号的颜色 */
        }
    }

    .triangle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 0;
        height: 0;
        border-left: 20px solid transparent;
        /* 调整这里的值以控制三角形的大小 */
        border-bottom: 20px solid var(--el-color-primary);
        /* 调整这里的值以控制三角形的大小和颜色 */
        border-bottom-right-radius: 0px;
    }

    .triangle::after {
        content: "\2713";
        position: absolute;
        right: 5px; /* 调整对号的位置，以适应三角形 */
        color: white; /* 对号的颜色 */
        z-index: 2; /* 确保在三角形之上 */
        top: 20px; /* 调整对号的位置，以适应三角形 */
        transform: translateY(-50%); /* 使用 translateY 来垂直居中 */
    }

    .triangle2::after {
        content: "\2713";
        position: absolute;
        right: 1px; /* 调整对号的位置，以适应三角形 */
        color: white; /* 对号的颜色 */
        z-index: 2; /* 确保在三角形之上 */
        top: 12px; /* 调整对号的位置，以适应三角形 */
        transform: translateY(-50%); /* 使用 translateY 来垂直居中 */
    }

    .triangleHeight {
        border-left: 30px solid transparent !important;
        /* 调整这里的值以控制三角形的大小 */
        border-bottom: 30px solid var(--el-color-primary) !important;
        /* 调整这里的值以控制三角形的大小和颜色 */
    }

    .item-radio {
        box-sizing: border-box;
        border: 1px solid #dcdfe6;
        border-radius: 2px;
        display: inline-block;
        cursor: pointer;
        text-align: center;
        padding: 16px;

        .title {
            font-weight: 500;
            color: #323233;
            font-size: 14px;
            line-height: 22px;
        }

        .desc {
            color: #979797;
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
        }
    }
}
.radio-style2 {
    display: flex;
    gap: 8px;
    flex-direction: row;
    flex-wrap: wrap;

    .selected {
        border: 1px solid var(--el-color-primary) !important;
        background: #fff;
        position: relative;
        cursor: default;

        .title {
            color: var(--el-color-primary) !important;
        }
        .tips {
            background-color: var(--tig-item-active-bg) !important;
            color: var(--el-color-primary) !important;
        }
    }

    .triangle {
        position: absolute;
        top: 0;
        right: 0;
        width: 0;
        height: 0;
        border-bottom-right-radius: 0px;
    }

    .triangle::after {
        content: "\2713";
        position: absolute;
        right: 5px; /* 调整对号的位置，以适应三角形 */
        color: white; /* 对号的颜色 */
        z-index: 2; /* 确保在三角形之上 */
        top: -22px; /* 调整对号的位置，以适应三角形 */
        transform: translateY(-50%); /* 使用 translateY 来垂直居中 */
        font-size: 14px;
        font-weight: 700;
    }

    .triangleHeight {
        border-left: 30px solid transparent !important;
        /* 调整这里的值以控制三角形的大小 */
        border-top: 30px solid var(--el-color-primary) !important;
        /* 调整这里的值以控制三角形的大小和颜色 */
    }

    .item-radio {
        box-sizing: border-box;
        border: 1px solid #dcdfe6;
        border-radius: 10px;
        overflow: hidden;
        display: inline-block;
        cursor: pointer;
        text-align: center;

        .title {
            font-weight: 500;
            color: #323233;
            font-size: 18px;
            line-height: 22px;
        }

        .desc {
            color: #979797;
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
            margin: 0 30px 20px 30px;
        }
        .tips {
            width: 100%;
            background-color: #f7f7f7;
            color: #666;
            padding: 10px 0;
        }
    }
}

</style>
