<template>
    <div class="container" v-loading="loading">
        <div class="content_wrapper" v-if="!loading">
            <div class="lyecs-form-table">
                <el-table :data="formState.aftersalesItems" style="width: 100%; margin-bottom: 20px" border>
                    <el-table-column label="商品信息" width="400">
                        <template #default="{ row }">
                            <div class="flex">
                                <ProductCard :picThumb="row.picThumb" :productId="row.productId" :productName="row.productName"> </ProductCard>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="商品价格" align="center">
                        <template #default="{ row }">
                            <div>{{ priceFormat(row.price) }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="quantity" label="商品数量" align="center" />
                    <el-table-column prop="number" label="退货数量" align="center" />
                </el-table>
                <div class="container-card">
                    <div class="title flex flex-justify-between">
                        <p>售后明细</p>
                        <div class="btn flex" v-if="type != 2">
                            <div v-if="formState.aftersaleType == 1">
                                <DialogForm
                                    v-if="formState.status === 1 || formState.status === 21 || formState.status === 3"
                                    :params="{ status: 2, formData: formState }"
                                    isDrawer
                                    path="order/aftersales/Handle"
                                    title="处理售后"
                                    width="600px"
                                    :showClose="false"
                                    :showOnOk="false"
                                    @okCallback="fetchBrand"
                                >
                                    <el-button type="primary" style="margin-right: 10px"> 同意并发送退货地址 </el-button>
                                </DialogForm>
                                <DialogForm
                                    v-if="formState.status === 1 || formState.status === 21"
                                    :params="{ status: 3, formData: formState }"
                                    isDrawer
                                    path="order/aftersales/Handle"
                                    title="处理售后"
                                    width="600px"
                                    :showClose="false"
                                    :showOnOk="false"
                                    @okCallback="fetchBrand"
                                >
                                    <el-button> 拒绝退货退款 </el-button>
                                </DialogForm>
                            </div>
                            <div v-if="formState.aftersaleType == 2">
                                <DialogForm
                                    v-if="formState.status === 1 || formState.status === 21 || formState.status === 3"
                                    :params="{ status: 2, formData: formState }"
                                    isDrawer
                                    path="order/aftersales/Handle"
                                    title="处理售后"
                                    width="600px"
                                    :showClose="false"
                                    :showOnOk="false"
                                    @okCallback="fetchBrand"
                                >
                                    <el-button type="primary" style="margin-right: 10px"> 同意仅退款 </el-button>
                                </DialogForm>
                                <DialogForm
                                    v-if="formState.status === 1 || formState.status === 21"
                                    :params="{ status: 3, formData: formState }"
                                    isDrawer
                                    path="order/aftersales/Handle"
                                    title="处理售后"
                                    width="600px"
                                    :showClose="false"
                                    :showOnOk="false"
                                    @okCallback="fetchBrand"
                                >
                                    <el-button> 拒绝仅退款 </el-button>
                                </DialogForm>
                            </div>
                            <div v-if="formState.status == 3">
                                <el-popconfirm width="220" confirm-button-text="确认" cancel-button-text="取消" title="确认永久关闭售后?" @confirm="closeOrder">
                                    <template #reference>
                                        <el-button style="margin-left: 10px"> 关闭售后 </el-button>
                                    </template>
                                </el-popconfirm>
                            </div>
                            <div v-if="formState.aftersaleType == 1 && formState.status == 5 || formState.status == 22">
                                <el-popconfirm width="220" confirm-button-text="确认" cancel-button-text="取消" title="确认已收到货?" @confirm="confirmReceipt">
                                    <template #reference>
                                        <el-button type="primary"> 确认收货 </el-button>
                                    </template>
                                </el-popconfirm>
                            </div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="card-title">
                            <ul>
                                <li class="card-li">
                                    <div>售后方式：</div>
                                    <div class="li-info red">{{ formState.aftersalesTypeName }}</div>
                                </li>
                                <li class="card-li">
                                    <div>售后状态：</div>
                                    <div class="li-info">{{ formState.statusName }}</div>
                                </li>
                                <li class="card-li">
                                    <div>申请时间：</div>
                                    <div class="li-info">{{ formState.addTime ? formState.addTime : "--" }}</div>
                                </li>
                                <!-- <li class="card-li">
                                    联系方式：<span class="li-info">{{ formState.logisticsName ? formState.logisticsName : "--" }}</span>
                                </li> -->
                                <li class="card-li">
                                    <div>退款原因：</div>
                                    <div class="li-info">{{ formState.aftersaleReason }}</div>
                                </li>
                                <li class="card-li">
                                    <div>退款说明：</div>
                                    <div class="li-info">
                                        {{ formState.description ? formState.description : "--" }}
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div class="card-title">
                            <ul>
                                <li class="card-li" v-if="formState.refund">
                                    <div>退款进度：</div>
                                    <div class="li-info">
                                        <el-popover
                                            :width="220"
                                            popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;"
                                        >
                                            <template #reference>
                                                <el-button type="primary" link v-if="formState.refund.refundStatus == 2">退款完成</el-button>
                                                <el-button type="danger" link v-else>退款中</el-button>
                                            </template>
                                            <template #default>
                                                <div class="refund-info flex">
                                                    <div style="color: #666">线上退款：</div>
                                                    <div class="li-info">{{ priceFormat(formState.refund.onlineBalance) || "0" }}</div>
                                                    <div style="margin-left: 10px">
                                                        (
                                                        {{
                                                            formState.refund.isOnline == 2
                                                                ? "退款成功"
                                                                : formState.refund.isOnline == 1
                                                                  ? "退款中"
                                                                  : "无需退款"
                                                        }}
                                                        )
                                                    </div>
                                                </div>
                                                <div class="refund-info flex">
                                                    <div style="color: #666">线下退款：</div>
                                                    <div class="li-info">{{ priceFormat(formState.refund.offlineBalance) || "0" }}</div>
                                                    <div style="margin-left: 10px">
                                                        (
                                                        {{
                                                            formState.refund.isOffline == 2
                                                                ? "退款成功"
                                                                : formState.refund.isOffline == 1
                                                                  ? "退款中"
                                                                  : "无需退款"
                                                        }}
                                                        )
                                                    </div>
                                                </div>
                                                <div class="flex">
                                                    <div style="color: #666">余额退款：</div>
                                                    <div class="li-info">{{ priceFormat(formState.refund.refundBalance) || "0" }}</div>
                                                    <div style="margin-left: 10px">
                                                        (
                                                        {{
                                                            formState.refund.isReceive == 2
                                                                ? "退款成功"
                                                                : formState.refund.isReceive == 1
                                                                  ? "退款中"
                                                                  : "无需退款"
                                                        }}
                                                        )
                                                    </div>
                                                </div>
                                            </template>
                                        </el-popover>
                                    </div>
                                </li>
                                <li class="card-li" v-if="formState.status == 2">
                                    <div>退款金额：</div>
                                    <div class="li-info">{{ priceFormat(formState.suggestRefundAmount) || "0" }}</div>
                                </li>
                                <li class="card-li">
                                    <div>物流公司：</div>
                                    <div class="li-info">{{ formState.logisticsName || "--" }}</div>
                                </li>
                                <li class="card-li">
                                    <div>物流单号：</div>
                                    <div class="li-info">{{ formState.trackingNo || "--" }}</div>
                                </li>
                                <li class="card-li" v-if="formState.aftersalesItems">
                                    订单编号：<span class="li-info">{{ formState.aftersalesItems[0].orderSn }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="negotiation-box">
                    <div class="negotiation-title flex flex-justify-between">
                        <div>协商记录</div>
                        <div class="btn" v-if="formState.status == 1 && type != 2">
                            <el-button bg size="small" text type="primary" :disabled="isMsg" @click="isMsg = true"> 点击发表留言 </el-button>
                        </div>
                    </div>
                    <el-form :model="messageForm" label-width="auto" style="margin-top: 20px" v-if="isMsg">
                        <el-form-item label="留言内容：" prop="logInfo">
                            <TigInput
                                width="100%"
                                v-model="messageForm.logInfo"
                                :rows="4"
                                type="textarea"
                                :maxlength="300"
                                show-word-limit
                                placeholder="你可以在这里给买家留言, 为了保证你的权益, 请尽可能详细的上传留言资料"
                            />
                        </el-form-item>
                        <el-form-item label="上传凭证：" prop="returnPic">
                            <FormAddGallery v-if="!loading" v-model:photos="messageForm.returnPic" :isMultiple="true"> </FormAddGallery>
                        </el-form-item>
                        <el-form-item>
                            <div class="btn-box">
                                <el-button type="primary" @click="postMessage(formState.aftersaleId)">发表留言</el-button>
                                <el-button @click="isMsg = false">取消</el-button>
                            </div>
                        </el-form-item>
                    </el-form>
                    <div class="negotiation-content">
                        <Timeline>
                            <TimelineItem v-for="(item, index) in formState.aftersalesLog">
                                <template #dot>
                                    <div class="logo" v-if="item.userName">买</div>
                                    <div class="logo-b" v-if="item.adminName">商</div>
                                </template>
                                <div class="info-box">
                                    <div class="tit">
                                        <div class="txt" v-if="index + 1 == formState.aftersalesLog?.length">
                                            {{ item.logInfo }}
                                        </div>
                                        <div class="txt" v-else>
                                            <span v-if="item.userName">买家</span>
                                            <span v-if="item.adminName">商家</span> 留言
                                        </div>
                                        <div class="time">
                                            {{ item.addTime }}
                                        </div>
                                    </div>
                                    <div class="detail">
                                        <div class="content" v-if="index + 1 != formState.aftersalesLog?.length">
                                            {{ item.logInfo }}
                                        </div>
                                        <div class="card-li" v-if="index + 1 == formState.aftersalesLog?.length">
                                            <span>售后方式：</span>
                                            <span class="li-info">
                                                {{ formState.aftersalesTypeName }}
                                            </span>
                                        </div>
                                        <div class="card-li" v-if="index + 1 == formState.aftersalesLog?.length">
                                            <span>退款原因：</span>
                                            <span class="li-info">
                                                {{ formState.aftersaleReason }}
                                            </span>
                                        </div>
                                        <div class="card-li" v-if="index + 1 == formState.aftersalesLog?.length">
                                            <span>退款说明：</span>
                                            <span class="li-info">
                                                {{ formState.description }}
                                            </span>
                                        </div>
                                        <div class="card-li" v-if="item.returnPic?.length > 0">
                                            <span>上传凭证：</span>
                                            <span class="li-info">
                                                <Image
                                                    v-for="pic in item.returnPic"
                                                    style="margin-right: 10px; border: 1px solid rgba(5, 5, 5, 0.06)"
                                                    width="60"
                                                    height="60"
                                                    :src="imageFormat(pic.picThumb)"
                                                    :preview-src-list="[imageFormat(pic.picUrl)]"
                                                    fit="cover"
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TimelineItem>
                        </Timeline>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { imageFormat } from "@/utils/format";
import { DialogForm } from "@/components/dialog";
import { Image } from "@/components/image";
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message, Timeline, TimelineItem } from "ant-design-vue";
import { FormAddGallery } from "@/components/gallery";
import { FormState } from "@/types/order/aftersales";
import { getAftersales, addMessage, updataConfirmReceipt, completeAftersales } from "@/api/order/aftersales";
import { ProductCard } from "@/components/list";
import { priceFormat } from "@/utils/format";

// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    type: {
        type: Number,
        default: 0
    },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "insert" : "update";
const formRef = shallowRef();
const formState = ref<FormState>({
    picThumb: "",
    number: 1
});
const isMsg = ref<boolean>(false);
const messageForm = ref<any>({
    logInfo: "",
    returnPic: []
});
const fetchBrand = async () => {
    try {
        const result = await getAftersales(action.value, { id: id.value });
        Object.assign(formState.value, result);
        formState.value.aftersalesTypeConfig = toArray(formState.value.aftersalesTypeConfig);
        formState.value.statusConfig = toArray(formState.value.statusConfig);
        formState.value.modifyNumber = formState.value.number;
        // emit('submitCallback')
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};
const toArray = (arr: any) => {
    if (typeof arr == "object") {
        var newArr = [];

        for (let i in arr) {
            newArr.push(arr[i]);
        }
        return newArr;
    } else {
        return arr;
    }
};
const onInput = (e: number) => {
    if (e > formState.value.number) {
        formState.value.modifyNumber = formState.value.number;
    }
    if (e < 1) {
        formState.value.modifyNumber = 1;
    }
};

const postMessage = async (id: any) => {
    if (messageForm.value.logInfo == "") {
        message.error("请输入留言内容");
        return false;
    }
    try {
        const result = await addMessage({ aftersaleId: id, ...messageForm.value });
        isMsg.value = false;
        let data = {
            logInfo: "",
            returnPic: []
        };
        messageForm.value = data;
        fetchBrand();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // 获取详情数据
    fetchBrand();
});

// 确认收货
const confirmReceipt = async () => {
    try {
        const result = await updataConfirmReceipt({ id: id.value });
        message.success("操作成功");
        // fetchBrand();
        emit("submitCallback");
    } catch (error: any) {
        message.error(error.message);
    }
};
// 关闭订单
const closeOrder = async () => {
    try {
        const result = await completeAftersales({ id: id.value });
        message.success("操作成功");
        // fetchBrand();
        emit("submitCallback");
    } catch (error: any) {
        message.error(error.message);
    }
};
// 表单提交
const onFormSubmit = () => {
    // onSubmit()
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.container-card {
    border: 1px solid #ececec;
    /* 添加淡淡的边框 */
    box-shadow: 2px 2px 5px rgba(203, 193, 193, 0.2);
    border-radius: 2px;
    padding: 20px;
    background: #fff;
    margin-bottom: 20px;

    .border-bottom {
        border-bottom: 1px solid #ececec;
        padding-bottom: 16px;
        margin-bottom: 16px;
    }

    .button-card {
        margin-bottom: 12px;
        margin-top: 20px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        /* 允许换行 */
        gap: 8px;
    }

    .babyBlue {
        background-color: rgba(61, 127, 255, 0.06);
        border-radius: 6px;
    }

    .pd20 {
        padding: 20px;
    }

    .orange {
        color: #ed6a0c;
    }

    .title {
        font-size: 16px;
        line-height: 25px;
        color: #323233;
        margin-bottom: 15px;
        font-weight: 700;
    }

    .info-card {
        display: flex;
        flex-direction: row;
        gap: 20px;
        white-space: nowrap;

        .card-title {
            flex: 1;
            display: flex;
            flex-direction: column;
            font-size: 14px;
            line-height: 30px;
            font-weight: 500;
            color: #646566;
        }

        .min-title {
            margin-bottom: 10px;
        }

        .card-li {
            display: flex;
            font-weight: normal;
            font-size: 12px;
            line-height: 28px;
        }

        .li-info {
            max-width: 300px;
            white-space: wrap;
            color: black;
            :deep(.el-button.is-link) {
                margin-bottom: 2px;
            }
        }
        .red {
            color: var(--tig-red-text-color);
        }
    }

    .total {
        margin: 24px 0;
        width: 100%;
        text-align: right;
    }
}
.negotiation-box {
    .negotiation-title {
        font-size: 16px;
        font-weight: 700;
        padding-bottom: 25px;
    }
    .btn-box {
        display: flex;
        justify-content: flex-end;
        width: 100%;
    }
    .negotiation-content {
        .logo {
            width: 24px;
            height: 24px;
            line-height: 24px;
            display: inline-block;
            border-radius: 50%;
            background-color: #74829d;
            color: #fff;
            text-align: center;
        }
        .logo-b {
            width: 24px;
            height: 24px;
            line-height: 24px;
            display: inline-block;
            border-radius: 50%;
            background-color: #155bd4;
            color: #fff;
            text-align: center;
        }
        .info-box {
            background-color: #f7f8fa;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            .tit {
                display: flex;
                align-items: center;
                justify-content: space-between;
                .txt {
                    color: #323233;
                    font-weight: 500;
                }
                .time {
                    color: #999;
                }
            }
            .detail {
                border-top: 1px solid #ebedf0;
                margin-top: 15px;
                padding-top: 5px;
                font-size: 12px;
                .content {
                    padding: 5px 0;
                }
                .card-li {
                    padding: 5px 0;
                    color: #646566;
                    display: flex;
                    .li-info {
                        color: #333;
                    }
                }
            }
        }
    }
}
.refund-info {
    margin-bottom: 10px;
}
</style>
