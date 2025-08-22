<template>
    <div class="container">
        <div class="">
            <a-spin :spinning="loading">
                <div style="display: flex; gap: 12px; flex-direction: column">
                    <div class="content_wrapper tig-table-list bar-top-item">
                        <div class="box-header">
                            <div class="title">待办事项</div>
                        </div>
                        <el-row :gutter="20">
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/order/list', { status: 1 })">
                                <div class="bar_panel panel-bar-left">
                                    <div class="image">
                                        <img src="@/assets/vendor/vendor_panel_logo4.png" />
                                    </div>
                                </div>
                                <div class="data_box">
                                    <div class="count">{{ filterState?.consoleData.awaitShip ?? 0 }}</div>
                                    <div class="title">待发货订单</div>
                                </div>
                            </el-col>
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/order/list', { status: 0 })">
                                <div class="bar_panel panel-bar-left">
                                    <div class="image">
                                        <img src="@/assets/vendor/vendor_panel_logo2.png" />
                                    </div>
                                </div>
                                <div class="data_box">
                                    <div class="count">{{ filterState?.consoleData.awaitSettlement ?? 0 }}</div>
                                    <div class="title">待结算订单</div>
                                </div>
                            </el-col>
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/order/aftersales/list', { status: 1 })">
                                <div class="bar_panel panel-bar-left">
                                    <div class="image">
                                        <img src="@/assets/vendor/vendor_panel_logo3.png" />
                                    </div>
                                </div>
                                <div class="data_box">
                                    <div class="count">{{ filterState?.consoleData.awaitAfterSale ?? 0 }}</div>
                                    <div class="title">待处理售后</div>
                                </div>
                            </el-col>
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/product/list')">
                                <div class="bar_panel panel-bar-left">
                                    <div class="image">
                                        <img src="@/assets/vendor/vendor_panel_logo1.png" />
                                    </div>
                                </div>
                                <div class="data_box">
                                    <div class="count">{{ filterState?.consoleData.saleOutProductNum ?? 0 }}</div>
                                    <div class="title">售罄商品</div>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                    <div class="content_wrapper tig-table-list tig-table-list-admin">
                        <div class="store-data-con">
                            <div class="header">
                                <div class="title">
                                    <div>实时数据</div>
                                    <div class="time" @click="refresh">
                                        <div>更新时间：{{ newTime }}</div>
                                        <i class="iconfont-admin icon-shuaxin1" :class="{ 'rotate-animation': isRotating }"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="content">
                                <div class="label">
                                    <div class="num">{{ priceFormat(filterState?.realTimeData.todaySettlementAmount ?? 0) }}</div>
                                    <div class="text">今日结算总额</div>
                                </div>
                                <div class="label">
                                    <div class="num">{{ filterState?.realTimeData.todaySettlementNum ?? 0 }}</div>
                                    <div class="text">今日结算订单数</div>
                                </div>
                                <div class="label">
                                    <div class="num">{{ filterState?.realTimeData.saleProductNum ?? 0 }}</div>
                                    <div class="text">在售商品数</div>
                                </div>
                                <div class="label">
                                    <div class="num">{{ filterState?.realTimeData.outageProductNum ?? 0 }}</div>
                                    <div class="text">断供商品数</div>
                                </div>
                                <div class="label">
                                    <div class="num">{{ priceFormat(filterState?.realTimeData.accountBalance ?? 0) }}</div>
                                    <div class="text">账户余额</div>
                                </div>
                                <div class="label">
                                    <div class="num">{{ priceFormat(filterState?.realTimeData.awaitSettlementAmount ?? 0) }}</div>
                                    <div class="text">待结算金额</div>
                                </div>
                                <div class="label">
                                    <div class="num">{{ filterState?.realTimeData.bindShopNum ?? 0 }}</div>
                                    <div class="text">关联店铺数</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-menu content_wrapper">
                        <div ref="ordersReceivedStatisticsRef" class="chart-menu-item"></div>
                    </div>
                </div>
            </a-spin>
        </div>
    </div>
</template>
<script lang="ts" setup>
import dayjs from "dayjs";
import { priceFormat } from "@/utils/format";
import { ref, onMounted, onUnmounted, nextTick, onBeforeMount } from "vue";
import * as echarts from "echarts";
import { getPanelIndex } from "@/api/vendor/panel";
import { panelIndexFilterState } from "@/types/vendor/panel";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { getAdminType } from "@/utils/storage";
const adminType = getAdminType();

const isRotating = ref<boolean>(false);
const newTime = ref<string>(dayjs().format("YYYY-MM-DD HH:mm:ss"));
const router = useRouter();

// 初始化导出模块

const loading = ref<boolean>(false);
// 获取详情数据
const filterState = ref<panelIndexFilterState>();
const ordersReceivedStatisticsRef = ref<HTMLDivElement>();
let ordersReceivedStatisticsChart: echarts.ECharts;
const refresh = () => {
    isRotating.value = true;
    newTime.value = dayjs().format("YYYY-MM-DD HH:mm:ss");
    getData();
    setTimeout(() => {
        isRotating.value = false;
        message.success("刷新成功");
    }, 500); // 500ms 是动画的持续时间，需要与 CSS 中的动画时间一致
};
const ordersReceivedStatisticsOptons = ref<any>({
    title: {
        text: "收益统计",
        left: "left",
        textStyle: {
            color: "#222",
            fontSize: 16
        }
    },
    grid: {
        left: '5%',  // 调整左侧边距
        right: '5%', // 调整右侧边距
        bottom: '10%', // 调整底部边距，如果需要
    },
    tooltip: {
        trigger: "axis"
    },
    legend: {
        data: ["收益金额", "订单数量"],
        left: "center",
        bottom: "bottom"
    },
    xAxis: {
        type: "category",
        data: [] // 这里填写您的 X 轴数据，如日期或月份
    },
    yAxis: [
        {
            type: "value",
            name: "", //name: "订单金额",
            splitLine: {
                show: true
            }
        },
        {
            type: "value",
            name: "", //name: "订单数量",
            splitLine: {
                show: false
            }
        }
    ],
    series: [
        {
            name: "收益金额",
            data: [], // 填写金额数据
            type: "bar", // 修改为柱状图
            barWidth: "50%", // 柱状图宽度设置
            itemStyle: {
                color: "#2478f2" // 设置柱状图颜色
            },
            emphasis: {
                scale: false
            },
            yAxisIndex: 0 // 对应第一个 y 轴（金额）
        },
        {
            name: "订单数量",
            data: [], // 填写数量数据
            type: "line", // 修改为折线图
            smooth: true,
            lineStyle: {
                color: "#84b7f9" // 设置折线图颜色
            },
            itemStyle: {
                color: "#84b7f9" // 设置柱状图颜色
            },

            emphasis: {
                scale: false
            },
            yAxisIndex: 1 // 对应第二个 y 轴（数量）
        }
    ]
});
const getData = async () => {
    // loading.value = true;
    try {
        const result = await getPanelIndex();
        filterState.value = result;
        // return;
        const orderCountData = result.panelStatisticalData.longitudinalAxisOrderNum.map((item: number) => {
            return item === 0 ? 0 : item;
        });
        ordersReceivedStatisticsOptons.value.xAxis.data = result.panelStatisticalData.horizontalAxis;
        ordersReceivedStatisticsOptons.value.series[0].data = result.panelStatisticalData.longitudinalAxisIncome;
        ordersReceivedStatisticsOptons.value.series[1].data = orderCountData;
        ordersReceivedStatisticsChart && ordersReceivedStatisticsChart.setOption(ordersReceivedStatisticsOptons.value);
    } catch (error) {
        console.error(error);
    }
    loading.value = false;
};

const handleChartResize = () => {
    ordersReceivedStatisticsChart?.resize();
};

const initChart = () => {
    ordersReceivedStatisticsChart = echarts.init(ordersReceivedStatisticsRef.value);
    ordersReceivedStatisticsChart.setOption(ordersReceivedStatisticsOptons.value);
    window.addEventListener("resize", handleChartResize);
};
const toPage = (path: string, query?: any) => {
    router.push({
        path,
        query
    });
};

onBeforeMount(() => {
    getData();
});
onMounted(() => {
    nextTick(() => {
        initChart();
    });
});
onUnmounted(() => {
    ordersReceivedStatisticsChart?.dispose();
    window.removeEventListener("resize", handleChartResize);
});
</script>
<style lang="less" scoped>
/*面板页面*/
.page_index #content {
    background: #fff;
}

.bar-top-item {
    .itme-box {
        box-sizing: border-box;
        border-radius: 4px;
        height: 80px;
        margin-bottom: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        &:hover {
            background-color: #f7f7f7;
        }

        .bar_panel {
            border-bottom-left-radius: 4px;
            border-top-left-radius: 4px;
            height: 100%;
            align-items: center;
            justify-content: center;
            display: flex;
            box-sizing: border-box;
            .image {
                padding: 15px;
                background-color: #f7f7f7;
                border-radius: 4px;
                img {
                    width: 35px;
                }
            }
        }
        .data_box {
            border-bottom-right-radius: 4px;
            border-top-right-radius: 4px;
            color: #666;
            line-height: 1.8em;
            font-weight: normal;
            margin: 0;
            padding-left: 20px;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            flex-direction: column;

            .title {
                font-size: 14px;
            }

            .count {
                color: #333 !important;
                font-size: 22px;
                font-weight: bold;

                &:hover {
                    color: #333 !important;
                }
            }
        }
    }
}

.box-header {
    margin-bottom: 18px;

    .title {
        font-size: 16px;
        font-weight: bold;
        color: #222;
    }
}

.store-data-con {
    width: 100%;
    border-radius: 4px;
    overflow: hidden;
    background: #fff;
    .content {
        display: flex;
        flex-wrap: wrap;
        padding: 10px;
        grid-gap: 45px 0px;
        .label {
            width: 25%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            .num {
                font-size: 24px;
                margin-bottom: 15px;
                font-weight: 500;
            }
            .text {
                color: #666;
                font-size: 12px;
            }
        }
    }

    .header {
        padding-bottom: 18px;

        .title {
            font-size: 16px;
            font-weight: bold;
            color: #222;
            display: flex;
            align-items: flex-end;
            .time {
                display: flex;
                align-items: center;
                font-size: 14px;
                font-weight: 400;
                color: #969799 !important;
                margin-left: 10px !important;
                cursor: pointer;
                i {
                    font-size: 14px;
                    margin-left: 10px;
                    margin-top: 2px;
                }
            }
        }
    }
}

.chart-data-con {
    flex: 1;

    &:first-child {
        margin-right: 20px;
    }

    .header {
        border-bottom: 1px #f0f2f5 solid;
        margin-bottom: 20px;

        .title {
            font:
                14px/45px tahoma,
                arial,
                "Hiragino Sans GB",
                "Microsoft Yahei",
                \5b8b\4f53,
                sans-serif;
            color: #000;
            font-weight: bold;
        }
    }
}

.chart-menu {
    display: flex;
    justify-content: space-between;
    .chart-menu-item {
        width: 100%;
        height: 400px;
    }
}

.rotate-animation {
    animation: rotate 0.5s linear;
}

@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(180deg);
    }
}

@media only screen and (max-width: 767px) {
    .tig-table-list-admin .store-data-con .index-cell {
        width: 100% !important;
        height: 138px;
        padding: 18px 14px 0;
    }

    .index-cell {
        &:after {
            background: #fff !important;
            content: "";
            height: 55px;
            pointer-events: none;
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 1px;
        }
        .live-wrapper {
            padding: 0 !important;
            .index-detail {
                align-items: center;
            }
        }
    }

    .chart-menu {
        flex-wrap: wrap;
    }

    .chart-menu-item {
        width: 100% !important;
    }

    .bar-top-item .itme-box .data_box {
        padding: 15px 0 15px 12px;
    }
    .store-data-con {
        .content {
            .label {
                width: 50%;
            }
        }
    }
}
</style>
