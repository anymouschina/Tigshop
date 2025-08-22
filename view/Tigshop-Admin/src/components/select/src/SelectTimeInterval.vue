<template>
    <div class="lyecs-time-select-group">
        <div class="time-con">
            <el-date-picker
                :clearable="!clearable"
                v-model="startDate"
                :type="type"
                :disabled-date="disabledStartDate"
                placeholder="开始日期"
                @change="onChangeStartDate"
                :value-format="valueFormat"
                :editable="false"
                :style="{width}"
                :disabled="disabled"
            ></el-date-picker>
            <span style="display: inline-block; padding: 0 10px">至</span>
            <el-date-picker
                :clearable="!clearable"
                v-model="endDate"
                :type="type"
                :disabled-date="disabledEndDate"
                placeholder="结束日期"
                @change="onChangeEndDate"
                :value-format="valueFormat"
                :editable="false"
                :style="{width}"
                :disabled="disabled"
            ></el-date-picker>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import { formattedDate } from "@/utils/time";
import { getDays } from "@/utils/util";
// 传值
const props = defineProps({
    type: {
        type: String,
        default: "datetime"
    },
    clearable: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    valueFormat: {
        type: String,
        default: "YYYY-MM-DD"
    },
    width: {
        type: String,
        default : "200px"
    }
});
const emit = defineEmits(["update:startDate", "update:endDate", "callback"]);
const startDate = defineModel<String>("startDate", { type: String, default: formattedDate(new Date(), "YYYY-MM-DD 00:00:00") });
const endDate = defineModel<String>("endDate", { type: String, default: formattedDate(getDays(30, "add"), "YYYY-MM-DD 23:59:59") });
onMounted(() => {
    emit("update:startDate", startDate.value);
    emit("update:endDate", endDate.value);
});
const disabledStartDate = (time: any) => {
    if (endDate.value) {
        return time.getTime() > convertToMilliseconds(endDate.value);
    }
    return false;
};

const disabledEndDate = (time: any) => {
    if (startDate.value) {
        return time.getTime() < convertToMilliseconds(startDate.value);
    }
    return false;
};
function convertToMilliseconds(dateString: any) {
    return new Date(dateString).getTime(); 
}
const onChangeStartDate = (value: any) => {
    startDate.value = value;
    emit("update:startDate", value);
    emit("callback", true);
};
const onChangeEndDate = (value: any) => {
    endDate.value = value;
    emit("update:endDate", value);
    emit("callback", true);
};
</script>

<style lang="less" scoped>
.time-con {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

@media only screen and (max-width: 767px) {
    .time-con {
        flex-direction: column-reverse;
        align-items: start;
        :deep(.el-input) {
            width: 100% !important;
            // margin-bottom: 15px;
        }
        > * {
            flex: 1;
        }
        > span {
            // display: none !important;
            flex: 1;
            line-height: 30px;
            text-align: left;
        }
        :deep(.el-date-editor) {
            flex: 1;
        }
    }
}
</style>
