<template>
    <div>
        <el-form :model="filterParams" inline>
            <div class="filtrate-menu">
                <el-form-item class="mr-10">
                    <SelectTimeInterval type="date" v-model:start-date="filterParams.startTime" v-model:end-date="filterParams.endTime"></SelectTimeInterval>
                </el-form-item>
                <el-form-item>
                    <el-button plain @click="handleSearch">搜索</el-button>
                </el-form-item>
            </div>
        </el-form>

        <div class="main-panel">
            <ul>
                <li class="main-panel-item">
                    <div class="main-panel-item-title">商品浏览量</div>
                    <div class="main-panel-item-value">{{ filterState?.salesData?.productView ?? 0 }}</div>
                    <div class="main-panel-item-increase">
                        环比：
                        <span>{{ filterState?.salesData?.productViewGrowthRate }} %</span>
                        <i
                            v-if="
                                filterState?.salesData?.productViewGrowthRate.toString() !== '--' &&
                                Number(filterState?.salesData?.productViewGrowthRate) > 0
                            "
                            class="admin-iconfont red f12 up"
                            >&#xe61a;</i
                        >

                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                    </div>
                </li>
                <li class="main-panel-item">
                    <div class="main-panel-item-title">商品访客数</div>
                    <div class="main-panel-item-value">{{ filterState?.salesData?.productVisitor ?? 0 }}</div>
                    <div class="main-panel-item-increase">
                        环比：
                        <span>{{ filterState?.salesData?.productVisitorGrowthRate }} %</span>
                        <i
                            v-if="
                                filterState?.salesData?.productVisitorGrowthRate.toString() !== '--' &&
                                Number(filterState?.salesData?.productVisitorGrowthRate) > 0
                            "
                            class="admin-iconfont red f12 up"
                            >&#xe61a;</i
                        >

                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                    </div>
                </li>
                <li class="main-panel-item">
                    <div class="main-panel-item-title">下单件数</div>
                    <div class="main-panel-item-value">{{ filterState?.salesData?.orderNum ?? 0 }}</div>
                    <div class="main-panel-item-increase">
                        环比：
                        <span>{{ filterState?.salesData?.orderNumGrowthRate }} %</span>
                        <i
                            v-if="
                                filterState?.salesData?.orderNumGrowthRate.toString() !== '--' && Number(filterState?.salesData?.orderNumGrowthRate) > 0
                            "
                            class="admin-iconfont red f12 up"
                            >&#xe61a;</i
                        >

                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                    </div>
                </li>
                <li class="main-panel-item">
                    <div class="main-panel-item-title">支付金额</div>
                    <div class="main-panel-item-value">{{ filterState?.salesData?.paymentAmount ?? 0 }}</div>
                    <div class="main-panel-item-increase">
                        环比：
                        <span>{{ filterState?.salesData?.paymentAmountGrowthRate }} %</span>
                        <i
                            v-if="
                                filterState?.salesData?.paymentAmountGrowthRate.toString() !== '--' &&
                                Number(filterState?.salesData?.paymentAmountGrowthRate) > 0
                            "
                            class="admin-iconfont red f12 up"
                            >&#xe61a;</i
                        >

                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                    </div>
                </li>
                <li class="main-panel-item">
                    <div class="main-panel-item-title">退款金额</div>
                    <div class="main-panel-item-value">{{ filterState?.salesData?.refundAmount ?? 0 }}</div>
                    <div class="main-panel-item-increase">
                        环比：
                        <span>{{ filterState?.salesData?.refundAmountGrowthRate }} %</span>
                        <i
                            v-if="
                                filterState?.salesData?.refundAmountGrowthRate.toString() !== '--' &&
                                Number(filterState?.salesData?.refundAmountGrowthRate) > 0
                            "
                            class="admin-iconfont red f12 up"
                            >&#xe61a;</i
                        >

                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                    </div>
                </li>
                <li class="main-panel-item">
                    <div class="main-panel-item-title">退款件数</div>
                    <div class="main-panel-item-value">{{ filterState?.salesData?.refundQuantity ?? 0 }}</div>
                    <div class="main-panel-item-increase">
                        环比：
                        <span>{{ filterState?.salesData?.refundQuantityGrowthRate }} %</span>
                        <i
                            v-if="
                                filterState?.salesData?.refundQuantityGrowthRate.toString() !== '--' &&
                                Number(filterState?.salesData?.refundQuantityGrowthRate) > 0
                            "
                            class="admin-iconfont red f12 up"
                            >&#xe61a;</i
                        >

                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                    </div>
                </li>
            </ul>
        </div>
    </div>
    <div class="chart-menu">
        <div class="chart-menu-item" ref="SalesDetailRef"></div>
        <div class="chart-menu-item" ref="NumberProductViewsRef"></div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted, nextTick, onUnmounted } from "vue";
import { SelectTimeInterval } from "@/components/select";
import { getDays } from "@/utils/util";
import { formattedDate } from "@/utils/time";
import * as echarts from "echarts";
import { message } from "ant-design-vue";
import { getSaleDetail } from "@/api/panel/statisticsSale";
import type { statisticsSalesFilterParams, statisticsSalesFilterState } from "@/types/panel/statisticsSale";

/**
 * 图表
 */
const SalesDetailRef = ref<HTMLDivElement>();
const NumberProductViewsRef = ref<HTMLDivElement>();
let SalesDetailRefChart: echarts.ECharts;
let NumberProductViewsChart: echarts.ECharts;
const SalesDetailOptions = ref<any>({
    title: {
        text: "金额明细",
        left: "center",
    },
    tooltip: {
        trigger: "axis",
        axisPointer: {
            type: "cross",
            crossStyle: {
                color: "#999",
            },
        },
        // trigger: "axis",
        // axisPointer: {
        //     type: "shadow"
        // }
    },
    legend: {
        data: ["支付金额", "退款金额"],
        left: "center",
        bottom: "bottom",
    },
    xAxis: {
        type: "category",
        data: [],
    },
    yAxis: [
        {
            type: "value",
            name: "金额",
            nameTextStyle: {
                // 设置名称样式，包括颜色
                color: "#7cb5ec", // 名称颜色为红色
            },
            nameGap: 20, // 设置名称与轴线之间的距离，即位置
            axisLabel: {
                color: "#7cb5ec",
                formatter: "{value} 元",
            },
        },
    ],
    series: [
        {
            name: "支付金额",
            data: [],
            type: "line",
            smooth: true,
            lineStyle: {
                color: "#64a9ff",
            },
            color: "#5CA5FF",
            emphasis: {
                scale: !1,
            },
            tooltip: {
                valueFormatter: function (value: string) {
                    return value + "元";
                },
            },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        // 渐变颜色
                        {
                            offset: 0,
                            color: "rgba(92, 165, 255,0.50)",
                        },
                        {
                            offset: 1,
                            color: "rgba(92, 165, 255,0.00)",
                        },
                    ],
                    global: false,
                },
            },
            // yAxisIndex: 2 // 指定使用哪个y轴
        },
        {
            name: "退款金额",
            data: [],
            type: "line",
            smooth: true,
            lineStyle: {
                color: "rgba(0, 190, 189,0.50)",
            },
            color: "rgba(0, 190, 189,0.50)",
            emphasis: {
                scale: !1,
            },
            tooltip: {
                valueFormatter: function (value: string) {
                    return value + "元";
                },
            },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        // 渐变颜色
                        {
                            offset: 0,
                            color: "rgba(0, 190, 189,0.50)",
                        },
                        {
                            offset: 1,
                            color: "rgba(0, 190, 189,0.00)",
                        },
                    ],
                    global: false,
                },
            },
            // yAxisIndex: 2 // 指定使用哪个y轴
        },
    ],
});
const NumberProductViewsOptions = ref<any>({
    title: {
        text: "商品明细",
        left: "center",
    },
    tooltip: {
        trigger: "axis",
        axisPointer: {
            type: "shadow",
        },
    },
    legend: {
        data: ["商品浏览量"],
        left: "center",
        bottom: "bottom",
    },
    xAxis: {
        type: "category",
        data: [],
    },
    yAxis: [
        {
            type: "value",
            name: "浏览量",
            nameTextStyle: {
                // 设置名称样式，包括颜色
                color: "#64a9ff", // 名称颜色为红色
            },
            nameGap: 20, // 设置名称与轴线之间的距离，即位置
            axisLabel: {
                color: "#64a9ff",
                formatter: "{value} 次",
            },
            min: "10",
        },
    ],
    series: [
        {
            name: "商品浏览量",
            type: "bar",
            barWidth: "50%",
            showBackground: false,
            backgroundStyle: {
                color: "rgba(0, 127, 255,0.1)",
            },
            itemStyle: {
                // borderRadius: [35, 35, 0, 0],
                color: {
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    type: "linear",
                    global: false,
                    colorStops: [
                        {
                            //第一节下面
                            offset: 0,
                            color: "#007FFF",
                        },
                        {
                            offset: 1,
                            color: "#539FE5",
                        },
                    ],
                },
            },
            data: [],
        },
    ],
});

const handleChartResize = () => {
    SalesDetailRefChart?.resize();
    NumberProductViewsChart?.resize();
};
const initChart = () => {
    SalesDetailRefChart = echarts.init(SalesDetailRef.value);
    SalesDetailRefChart.setOption(SalesDetailOptions.value);
    NumberProductViewsChart = echarts.init(NumberProductViewsRef.value);
    NumberProductViewsChart.setOption(NumberProductViewsOptions.value);
    window.addEventListener("resize", handleChartResize);
};

const filterParams = reactive<statisticsSalesFilterParams>({
    startTime: formattedDate(getDays(30, "sub"), "YYYY-MM-DD"),
    endTime: formattedDate(new Date(), "YYYY-MM-DD"),
});
const filterState = ref<statisticsSalesFilterState>();
const getData = async () => {
    try {
        const result = await getSaleDetail(filterParams);
            filterState.value = result;
            const { horizontalAxis, longitudinalAxisPaymentAmount, longitudinalAxisProductView, longitudinalAxisRefundAmount } =
                result.salesStatisticsData;
            SalesDetailOptions.value.xAxis.data = horizontalAxis;
            SalesDetailOptions.value.series[0].data = longitudinalAxisPaymentAmount;
            SalesDetailOptions.value.series[1].data = longitudinalAxisRefundAmount;
            SalesDetailRefChart?.setOption(SalesDetailOptions.value);
            NumberProductViewsOptions.value.xAxis.data = horizontalAxis;
            NumberProductViewsOptions.value.series[0].data = longitudinalAxisProductView;
            NumberProductViewsChart?.setOption(NumberProductViewsOptions.value);
    } catch (error: any) {
        message.error(error.message);
        console.error(error);
    }
};
const handleSearch = () => {
    getData();
};

onMounted(() => {
    nextTick(() => {
        initChart();
    });
    window.onresize = () => {
        SalesDetailRefChart?.resize();
        NumberProductViewsChart?.resize();
    };

    getData();
});
onUnmounted(() => {
    SalesDetailRefChart?.dispose();
    window.removeEventListener("resize", handleChartResize);
});
</script>

<style lang="less" scoped>
.filtrate-menu {
    display: flex;
    // margin-bottom: 20px;

    .mr-10 {
        margin-right: 5px;
    }
}

.main-panel {
    ul {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-gap: 17px 28px;
    }

    .main-panel-item {
        padding: 15px;
        border-radius: 10px;
        background-color: #f7f8fa;

        .main-panel-item-title {
            font-size: 14px;
            color: #777;
        }

        .main-panel-item-value {
            font-size: 24px;
            color: #333;
            display: block;
            font-weight: bold;
            padding: 10px 0;
        }

        .main-panel-item-increase {
            font-size: 14px;
            color: #777;
            i {
                font-size: 16px;
            }

            .up {
                display: inline-block;
                transform: rotate(180deg);
            }
        }
    }
}

.chart-menu {
    height: 400px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: 20px;

    .chart-menu-item {
        width: 48%;
    }
}
</style>
