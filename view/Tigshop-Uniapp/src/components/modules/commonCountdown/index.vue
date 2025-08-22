<template>
    <div class="countdown-box">
        <template v-if="countdownType === 'dailyCycle'">
            <template v-if="Array.isArray(props.dailyTime) && getCurrentTimestamp() < Number(dailyTime[0])">
                <up-count-down :format="format" :time="Number(timeInfo.dailyStarTime) - getCurrentTimestamp()" @change="onChange">
                    <template v-for="(item, index) in arr" :key="index">
                        <text class="time-item" :style="timeStyle">
                            {{ formatTime(timeData[timeDateMap[item]])
                            }}<template v-if="!zh">
                                <text class="time-item-unit" :style="unitStyle">{{ index < arr.length - 1 ? ":" : "" }}</text>
                            </template>
                            <template v-else>
                                <text class="time-item-unit" :style="unitStyle">{{ textMap[item] }}</text>
                            </template>
                        </text>
                    </template>
                </up-count-down>
            </template>
            <template v-else>
                <up-count-down :format="format" :time="dailyEndTimeData" @change="onChange">
                    <template v-for="(item, index) in arr" :key="index">
                        <text class="time-item" :style="timeStyle">
                            {{ formatTime(timeData[timeDateMap[item]])
                            }}<template v-if="!zh">
                                <text class="time-item-unit" :style="unitStyle">{{ index < arr.length - 1 ? ":" : "" }}</text>
                            </template>
                            <template v-else>
                                <text class="time-item-unit" :style="unitStyle">{{ textMap[item] }}</text>
                            </template>
                        </text>
                    </template>
                </up-count-down>
            </template>
        </template>
        <template v-else>
            <up-count-down :format="format" :time="specifyTimeData" @change="onChange">
                <template v-for="(item, index) in arr" :key="index">
                    <text class="time-item" :style="timeStyle">
                        {{ formatTime(timeData[timeDateMap[item]])
                        }}<template v-if="!zh">
                            <text class="time-item-unit" :style="unitStyle">{{ index < arr.length - 1 ? ":" : "" }}</text>
                        </template>
                        <template v-else>
                            <text class="time-item-unit" :style="unitStyle">{{ textMap[item] }}</text>
                        </template>
                    </text>
                </template>
            </up-count-down>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
defineOptions({
    styleIsolation: "shared"
});
const props = defineProps({
    countdownType: {
        type: String,
        default: "dailyCycle"
    },
    valueStyle: {
        type: Object,
        default: () => ({})
    },
    dailyTime: {
        type: [Array as any, Number, String],
        default: () => []
    },
    specifyTime: {
        type: [Number, String],
        default: ""
    },
    format: {
        type: String,
        default: "HH:mm:ss"
    },
    color: {
        type: String,
        default: "#000"
    },
    zh: {
        type: Boolean,
        default: false
    },
    timeStyle: {
        type: Object,
        default: () => ({})
    },
    unitStyle: {
        type: Object,
        default: () => ({})
    }
});
const arr = computed(() => props.format.split(":"));
const timeData = ref<any>({});
const onChange = (e: any) => {
    timeData.value = e;
    // console.log('timeData', timeData.value)
};
// 格式化时间，保证两位数显示
const formatTime = (time: string) => {
    return time?.toString().padStart(2, "0");
};
const timeInfo = computed(() => {
    let obj = {
        dailyStarTime: 0,
        dailyEndTime: 0
    };
    if (props.dailyTime) {
        if (typeof props.dailyTime === "object") {
            let hour = new Date(Number(props.dailyTime[0])).getHours();
            obj.dailyStarTime = new Date(new Date().setHours(hour)).getTime();
            hour = new Date(Number(props.dailyTime[1])).getHours();
            obj.dailyEndTime = new Date(new Date().setHours(hour)).getTime();
        } else {
            let hour = new Date(Number(props.dailyTime)).getHours();
            obj.dailyEndTime = new Date(new Date().setHours(hour)).getTime();
        }
    }

    return obj;
});

const textMap: { [key: string]: string } = {
    DD: "天",
    HH: "时",
    mm: "分",
    ss: "秒"
};

const timeDateMap = {
    DD: "days",
    HH: "hours",
    mm: "minutes",
    ss: "seconds"
};

const color = computed(() => props.color);

const specifyTimeData = computed(() => {
    let num = Number(props.specifyTime) - getCurrentTimestamp();
    return num > 0 ? num : 0;
});

const dailyEndTimeData = computed(() => {
    let num = Number(timeInfo.value.dailyEndTime) - getCurrentTimestamp();
    return num > 0 ? num : 0;
});

const getCurrentTimestamp = () => {
    return new Date().getTime();
};
</script>

<style lang="scss" scoped>
.countdown-box {
    .time-item {
        color: v-bind(color) !important;
        font-size: 12px;
    }
}
</style>
