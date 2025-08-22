<template>
    <div class="container">
        <div class="">
            <a-spin :spinning="loading">
                <div style="display: flex; gap: 12px; flex-direction: column">
                    <div class="content_wrapper tig-table-list bar-top-item">
                        <div class="box-header">
                            <div class="title">待办事项</div>
                        </div>
                        <el-row :gutter="15">
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/order/list', { status: 0 })">
                                <div class="bar_panel panel-bar-left"><i class="main_pel_m iconfont-admin icon-base-daifukuan"></i></div>
                                <div class="data_box">
                                    <div class="title">待付款订单</div>
                                    <div class="count">{{ filterState?.consoleData.awaitPay ?? 0 }}</div>
                                </div>
                            </el-col>
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/order/list', { status: 1 })">
                                <div class="bar_panel panel-bar-left"><em class="main_pel_m iconfont-admin icon-base-daifahuo"></em></div>
                                <div class="data_box">
                                    <div class="title">待发货订单</div>
                                    <div class="count">{{ filterState?.consoleData.awaitShip ?? 0 }}</div>
                                </div>
                            </el-col>
                            <el-col :lg="6" :md="6" :sm="12" :xs="12" class="itme-box" @click="toPage('/order/aftersales/list', { status: 1 })">
                                <div class="bar_panel panel-bar-left"><em class="main_pel_m iconfont-admin icon-base-tuihuanhuo"></em></div>
                                <div class="data_box">
                                    <div class="title">待售后订单</div>
                                    <div class="count">{{ filterState?.consoleData.awaitAfterSale ?? 0 }}</div>
                                </div>
                            </el-col>
                            <el-col
                                v-if="adminType === 'admin'"
                                :lg="6"
                                :md="6"
                                :sm="12"
                                :xs="12"
                                class="itme-box"
                                @click="toPage('/user/feedback/list', { type: '5,6', status: 0 })"
                            >
                                <div class="bar_panel panel-bar-left"><em class="main_pel_m iconfont-admin icon-base-daipingjia"></em></div>
                                <div class="data_box">
                                    <div class="title">待回复订单</div>
                                    <div class="count">{{ filterState?.consoleData.awaitComment ?? 0 }}</div>
                                </div>
                            </el-col>
                            <el-col
                                v-if="adminType === 'shop'"
                                :lg="6"
                                :md="6"
                                :sm="12"
                                :xs="12"
                                class="itme-box"
                                @click="toPage('/comment/list', { status: 0 })"
                            >
                                <div class="bar_panel panel-bar-left"><em class="main_pel_m iconfont-admin icon-base-daipingjia"></em></div>
                                <div class="data_box">
                                    <div class="title">待回复订单</div>
                                    <div class="count">{{ filterState?.consoleData.awaitComment ?? 0 }}</div>
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
                                <div class="index-cell index-cell-0" :class="{ linetwo: adminType !== 'admin' }" @click="toPage('/statistics-order/list/', {})">
                                    <div class="live-wrapper">
                                        <i class="oui-icon iconfont-admin icon-base-basezhifujine"></i>
                                        <div class="index-detail">
                                            <div class="detail-left">
                                                <div class="name sans-serif">支付金额</div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit">{{ filterState?.realTimeData.todayOrderAmount }}</span>
                                                </div>
                                            </div>
                                            <div class="detail-right">
                                                <div class="yesterday-data clearfix">
                                                    <div class="name">昨日全天</div>
                                                    <div class="yesterday-value num">
                                                        {{ filterState?.realTimeData.yesterdayOrderAmount ?? "0" }}
                                                    </div>
                                                </div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit f12"
                                                        >日环比 <span>{{ filterState?.realTimeData.orderAmountGrowthRate ?? 0 }}%</span>
                                                        <i
                                                            v-if="
                                                                filterState?.realTimeData.orderAmountGrowthRate.toString() !== '--' &&
                                                                Number(filterState?.realTimeData.orderAmountGrowthRate) > 0
                                                            "
                                                            class="admin-iconfont up red f12"
                                                            >&#xe61a;</i
                                                        >
                                                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    class="index-cell index-cell-1"
                                    :class="{ linetwo: adminType !== 'admin' }"
                                    @click="toPage('/statistics-access/list/', {})"
                                    v-if="adminType === 'admin'"
                                >
                                    <div class="live-wrapper">
                                        <i class="oui-icon iconfont-admin icon-base-zuji"></i>
                                        <div class="index-detail">
                                            <div class="detail-left">
                                                <div class="name sans-serif">访客数</div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit">{{ filterState?.realTimeData.todayVisitNum ?? "0" }}</span>
                                                </div>
                                            </div>
                                            <div class="detail-right">
                                                <div class="yesterday-data clearfix">
                                                    <div class="name">昨日全天</div>
                                                    <div class="yesterday-value num">
                                                        {{ filterState?.realTimeData.yesterdayVisitNum ?? "0" }}
                                                    </div>
                                                </div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit f12"
                                                        >日环比 <span>{{ filterState?.realTimeData.visitGrowthRate ?? 0 }}%</span>
                                                        <i
                                                            v-if="
                                                                filterState?.realTimeData.visitGrowthRate.toString() !== '--' &&
                                                                Number(filterState?.realTimeData.visitGrowthRate) > 0
                                                            "
                                                            class="admin-iconfont up red f12"
                                                            >&#xe61a;</i
                                                        >
                                                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    class="index-cell index-cell-2"
                                    :class="{ linetwo: adminType !== 'admin' }"
                                    @click="adminType == 'admin' ? toPage('/statistics-user/list/', {}) : ''"
                                >
                                    <div class="live-wrapper">
                                        <i class="oui-icon iconfont-admin icon-base-tuandui"></i>
                                        <div class="index-detail">
                                            <div class="detail-left">
                                                <div class="name sans-serif">支付买家数</div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit">{{ filterState?.realTimeData.todayBuyerNum ?? "0" }}</span>
                                                </div>
                                            </div>
                                            <div class="detail-right">
                                                <div class="yesterday-data clearfix">
                                                    <div class="name">昨日全天</div>
                                                    <div class="yesterday-value num">
                                                        {{ filterState?.realTimeData.yesterdayBuyerNum ?? "0" }}
                                                    </div>
                                                </div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit f12"
                                                        >日环比 <span>{{ filterState?.realTimeData.buyerGrowthRate ?? 0 }}%</span>
                                                        <i
                                                            v-if="
                                                                filterState?.realTimeData.buyerGrowthRate.toString() !== '--' &&
                                                                Number(filterState?.realTimeData.buyerGrowthRate) > 0
                                                            "
                                                            class="admin-iconfont up red f12"
                                                            >&#xe61a;</i
                                                        >
                                                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    class="index-cell index-cell-3"
                                    :class="{ linetwo: adminType !== 'admin' }"
                                    @click="toPage('/statistics-access/list/', {})"
                                    v-if="adminType === 'admin'"
                                >
                                    <div class="live-wrapper">
                                        <i class="oui-icon iconfont-admin icon-base-liulan"></i>
                                        <div class="index-detail">
                                            <div class="detail-left">
                                                <div class="name sans-serif">浏览量</div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit">{{ filterState?.realTimeData.todayViewNum ?? "0" }}</span>
                                                </div>
                                            </div>
                                            <div class="detail-right">
                                                <div class="yesterday-data clearfix">
                                                    <div class="name">昨日全天</div>
                                                    <div class="yesterday-value num">
                                                        {{ filterState?.realTimeData.yesterdayViewNum ?? "0" }}
                                                    </div>
                                                </div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit f12"
                                                        >日环比 <span>{{ filterState?.realTimeData.viewGrowthRate ?? 0 }}%</span>
                                                        <i
                                                            v-if="
                                                                filterState?.realTimeData.viewGrowthRate.toString() !== '--' &&
                                                                Number(filterState?.realTimeData.viewGrowthRate) > 0
                                                            "
                                                            class="admin-iconfont up red f12"
                                                            >&#xe61a;</i
                                                        >
                                                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="index-cell index-cell-4" :class="{ linetwo: adminType !== 'admin' }" @click="toPage('/statistics-sale/list/', {})">
                                    <div class="live-wrapper">
                                        <i class="oui-icon iconfont-admin icon-base-dingdan"></i>
                                        <div class="index-detail">
                                            <div class="detail-left">
                                                <div class="name sans-serif">支付订单数</div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit">{{ filterState?.realTimeData.todayOrderNum }}</span>
                                                </div>
                                            </div>
                                            <div class="detail-right">
                                                <div class="yesterday-data clearfix">
                                                    <div class="name">昨日全天</div>
                                                    <div class="yesterday-value num">
                                                        {{ filterState?.realTimeData.yesterdayOrderNum ?? "0" }}
                                                    </div>
                                                </div>
                                                <div class="live-counter">
                                                    <span class="oui-counter-digit f12"
                                                        >日环比 <span>{{ filterState?.realTimeData.orderGrowthRate ?? 0 }}%</span>
                                                        <i
                                                            v-if="
                                                                filterState?.realTimeData.orderGrowthRate.toString() !== '--' &&
                                                                Number(filterState?.realTimeData.orderGrowthRate) > 0
                                                            "
                                                            class="admin-iconfont up red f12"
                                                            >&#xe61a;</i
                                                        >
                                                        <i v-else class="admin-iconfont green f12">&#xe61a;</i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="index-cell index-cell-5" :class="{ linetwo: adminType !== 'admin' }">
                                    <router-link :to="{ path: '/statistics-sale/list' }" class="check-more tig-openPage"> 查看更多销售统计 </router-link>
                                </div>
                            </div>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                    <div class="chart-menu content_wrapper">
                        <div ref="accessStatisticsRef" class="chart-menu-item" v-if="adminType === 'admin'"></div>
                        <div ref="ordersReceivedStatisticsRef" class="chart-menu-item" :class="{ full: adminType !== 'admin' }"></div>
                    </div>
                </div>
            </a-spin>
        </div>
    </div>
</template>
<script lang="ts" setup>
import dayjs from "dayjs";
import { ref, onMounted, onUnmounted, nextTick, onBeforeMount } from "vue";
import * as echarts from "echarts";
import { getPanelIndex } from "@/api/panel";
import { panelIndexFilterState } from "@/types/panel/index";
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
const accessStatisticsRef = ref<HTMLDivElement>();
const ordersReceivedStatisticsRef = ref<HTMLDivElement>();
let accessStatisticsChart: echarts.ECharts;
let ordersReceivedStatisticsChart: echarts.ECharts;
const accessStatisticsOptons = ref<any>({
    title: {
        text: "访问趋势",
        left: "left",
        textStyle: {
            color: "#222",
            fontSize: 16
        }
    },
    grid: {
        // left: "5%"
        right: "2.5%"
    },
    tooltip: {
        trigger: "axis"
    },
    legend: {
        data: ["访问量"],
        left: "center", // 将图例居中显示（水平方向）
        bottom: "bottom" // 设置图例距离底部为容器高度的10%（垂直方向）
    },
    xAxis: {
        type: "category",
        data: [0]
    },
    yAxis: {
        type: "value"
    },
    series: [
        {
            name: "访问量",
            data: [0],
            type: "line",
            smooth: true,
            lineStyle: {
                color: "#1456f0"
            },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        {
                            offset: 0,
                            color: "#ECF5FF"
                        },
                        {
                            offset: 1,
                            color: "#ffffff"
                        }
                    ],
                    global: !1
                }
            },
            color: "#1456f0",
            emphasis: {
                scale: !1
            }
        }
    ]
});
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
        text: "交易趋势",
        left: "left",
        textStyle: {
            color: "#222",
            fontSize: 16
        }
    },
    grid: {
        right: "5.5%"
    },
    tooltip: {
        trigger: "axis"
    },
    legend: {
        data: ["订单金额", "订单数量"],
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
            name: "订单金额",
            data: [], // 填写金额数据
            type: "bar", // 修改为柱状图
            barWidth: "50%", // 柱状图宽度设置
            itemStyle: {
                color: "#1456f0" // 设置柱状图颜色
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
                color: "#fac858" // 设置折线图颜色
            },
            itemStyle: {
                color: "#fac858" // 设置柱状图颜色
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
        accessStatisticsOptons.value.xAxis.data = result.panelStatisticalData.horizontalAxis;
        accessStatisticsOptons.value.series[0].data = result.panelStatisticalData.longitudinalAxisAccess;
        accessStatisticsChart && accessStatisticsChart.setOption(accessStatisticsOptons.value);
        const orderCountData = result.panelStatisticalData.longitudinalAxisOrderNum.map((item: number) => {
            return item === 0 ? 0 : item;
        });
        ordersReceivedStatisticsOptons.value.xAxis.data = result.panelStatisticalData.horizontalAxis;
        ordersReceivedStatisticsOptons.value.series[0].data = result.panelStatisticalData.longitudinalAxisOrderAmount;
        ordersReceivedStatisticsOptons.value.series[1].data = orderCountData;
        ordersReceivedStatisticsChart && ordersReceivedStatisticsChart.setOption(ordersReceivedStatisticsOptons.value);
    } catch (error) {
        console.error(error);
    }
    loading.value = false;
};

const handleChartResize = () => {
    accessStatisticsChart?.resize();
    ordersReceivedStatisticsChart?.resize();
};

const initChart = () => {
    if (adminType === "admin") {
        accessStatisticsChart = echarts.init(accessStatisticsRef.value);
        accessStatisticsChart.setOption(accessStatisticsOptons.value);
    }

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
    window.onresize = () => {
        accessStatisticsChart?.resize();
    };
});
onUnmounted(() => {
    accessStatisticsChart?.dispose();
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
        display: inline-flex;
        cursor: pointer;

        .bar_panel {
            border-bottom-left-radius: 4px;
            border-top-left-radius: 4px;
            padding: 15px;
            height: 100%;
            width: 40%;
            align-items: center;
            justify-content: center;
            display: flex;
            box-sizing: border-box;
        }

        .bar_panel .main_pel_m {
            font-size: 30px;
            color: #fff;
            line-height: 46px;
        }

        &:nth-child(1) .bar_panel {
            background: var(--tig-primary);
        }

        &:nth-child(2) .bar_panel {
            background: #ffb53e;
        }

        &:nth-child(3) .bar_panel {
            background: #1ebfae;
        }

        &:nth-child(4) .bar_panel {
            background: #ff445b;
        }

        &:nth-child(5) .bar_panel {
            background: #24c7f9;
        }

        .data_box {
            border-bottom-right-radius: 4px;
            border-top-right-radius: 4px;
            background: #f7f8fa;
            color: #666;
            line-height: 1.8em;
            font-weight: normal;
            margin: 0;
            padding-left: 20px;
            height: 100%;
            width: 60%;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            flex-direction: column;

            .title {
                font-size: 14px;
            }

            .count {
                color: #666 !important;
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
    min-height: 200px;
    border-radius: 4px;
    overflow: hidden;
    background: #fff;

    .content {
        display: flex;
        flex-wrap: wrap;
        margin: 0;
        row-gap: 20px;
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

    .index-cell {
        width: 33.333%;
        height: 80px;
        display: flex;
        padding: 12px 0;
        justify-content: space-between;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
        position: relative;

        &:after {
            background: #eeeeee;
            content: "";
            height: 55px;
            pointer-events: none;
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 1px;
        }

        &:nth-child(3n) {
            padding-left: 20px;

            &:after {
                display: none;
            }
        }

        &:nth-child(3n-2) {
            padding-right: 20px;
        }

        &:nth-child(3n-1) {
            padding-right: 20px;
            padding-left: 20px;
        }

        &.linetwo {
            width: 50%;
            &:nth-child(2) {
                padding-left: 20px;

                &:after {
                    display: none;
                }
            }
            &:nth-child(3) {
                &:after {
                    display: block;
                }
            }
            &:nth-child(4) {
                padding-left: 20px;

                &:after {
                    display: none;
                }
            }
            &:nth-child(2n-2) {
                padding-right: 20px;
            }

            &:nth-child(2n-1) {
                padding-right: 20px;
                padding-left: 20px;
            }
        }

        .live-wrapper {
            width: 100%;
            padding: 12px;
            position: relative;
            overflow: hidden;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color 0.2s ease-out;
            border-radius: 6px;
            cursor: pointer;

            &:hover {
                background: #f5f7fa;

                .oui-icon {
                    background: #fbfbfb;
                }
            }

            .oui-icon {
                margin-top: 0;
                font-size: 28px;
                margin-right: 16px;
                width: 50px;
                height: 50px;
                line-height: 50px;
                text-align: center;
                color: #fff;
                background-color: #f7f8fa;
                border-radius: 6px;
                flex-shrink: 0;
                transition: background-color 0.2s ease-out;
            }

            .index-detail {
                width: 100%;
                text-align: left;
                display: flex;
                justify-content: space-between;

                .detail-left {
                    .live-counter {
                        margin-top: 12px;
                        color: #333;
                        font-size: 20px;
                        font-weight: 700;
                        transition: color 0.2s ease-out;
                    }
                }

                .detail-right {
                    font-size: 12px;

                    .yesterday-data {
                        color: #999;
                        display: flex;
                        gap: 5px;
                        align-items: center;
                        justify-content: flex-end;

                        .name {
                            color: #999;
                        }

                        .yesterday-value {
                        }
                    }

                    .live-counter {
                        margin-top: 12px;
                        color: #333;
                        font-size: 20px;
                        transition: color 0.2s ease-out;

                        .oui-counter-digit span {
                            margin-left: 5px;
                        }

                        .admin-iconfont.up {
                            display: inline-block;
                            transform: rotate(180deg);
                        }
                    }
                }

                .name {
                    color: #333;
                }
            }
        }

        &.index-cell-0 .live-wrapper .oui-icon {
            color: #278bf5;
        }

        &.index-cell-1 .live-wrapper .oui-icon {
            color: #00c59f;
        }

        &.index-cell-2 .live-wrapper .oui-icon {
            color: #ffbc00;
        }

        &.index-cell-3 .live-wrapper .oui-icon {
            color: #ff8436;
        }

        &.index-cell-4 .live-wrapper .oui-icon {
            color: #ff638f;
        }

        &.index-cell.index-cell-0,
        &.index-cell.index-cell-1,
        &.index-cell.index-cell-2,
        &.index-cell.index-cell-3 {
        }

        .check-more {
            display: flex;
            width: 100%;
            color: #333;
            align-items: center;
            justify-content: center;
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
        width: 48%;
        height: 400px;
        &.full {
            width: 100%;
        }
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
        .live-wrapper{
            padding: 0 !important;
             .index-detail{
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
}
</style>
