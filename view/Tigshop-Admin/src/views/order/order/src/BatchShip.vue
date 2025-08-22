<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <div class="button-card babyBlue pd15">提示：如果订单分开发货，系统会自动将订单拆分为不同订单！</div>
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="配送方式" prop="shippingMethod">
                        <el-radio-group v-model="formState.shippingMethod">
                            <el-radio :value="1">物流配送</el-radio>
                            <el-radio :value="2">商家配送</el-radio>
                            <el-radio :value="3">无需配送</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <div v-if="formState.shippingMethod === 1">
                        <!-- <el-form-item label="配送类型" prop="shippingTypeId" :rules="[{ required: true, message: '请选择配送类型!' }]">
                            <ShippingType v-model:id="formState.shippingTypeId" @change="onChangeShippingType"></ShippingType>
                        </el-form-item> -->
                        <el-form-item label="物流公司" prop="logisticsId" :rules="[{ required: true, message: '请选择物流公司!' }]">
                            <SelectLogisticsCompany v-model:logisticsId="formState.logisticsId"></SelectLogisticsCompany>
                        </el-form-item>
                    </div>
                    <el-button @click="handleAllCheck(1)">全选</el-button>
                    <el-button @click="handleAllCheck(0)">取消全部选择</el-button>
                    <div v-for="(item, index) in formState.items" style="margin-top: 20px; border: 1px solid #e8e8e8; padding: 10px">
                        <div class="flex flex-justify-between">
                            <el-form-item label="订单编号" prop="orderSn">
                                {{ item.orderSn }}
                            </el-form-item>
                            <el-form-item label="快递单号" v-if="formState.shippingMethod === 1">
                                <TigInput v-model="item.trackingNo" width="500px" :disabled="item.orderStatus != 1" />
                            </el-form-item>
                        </div>
                        <el-table :data="item.items" style="width: 100%" :selection.sync="selectedRows">
                            <el-table-column prop="check" width="50">
                                <template #default="{ row }">
                                    <el-checkbox :model-value="deliverDataChecked(row.itemId)" @change="toggleCheck(row)" :disabled="item.orderStatus != 1 || row.toDeliveryQuantity <= 0" />
                                </template>
                            </el-table-column>
                            <el-table-column label="商品名称" prop="productId" width="230">
                                <template #default="{ row }">
                                    <ProductCard
                                        :picThumb="row.picThumb"
                                        :productId="row.productId"
                                        :productName="row.productName"
                                        :productType="row.productType"
                                        :url="row.url"
                                    ></ProductCard>
                                </template>
                            </el-table-column>
                            <el-table-column label="属性" prop="productAttr">
                                <template #default="{ row }">
                                    {{ row.skuValue || "无属性" }}
                                </template>
                            </el-table-column>
                            <el-table-column label="附加规格" prop="extraSkuData">
                                <template #default="{ row }">
                                    <div
                                        v-if="row.extraSkuData && row.extraSkuData.length > 0"
                                        class="extraskudata"
                                        v-for="item in row.extraSkuData"
                                        :key="item"
                                    >
                                        {{ item.attrName + item.attrValue + priceFormat(item.totalAttrPrice) }}
                                    </div>
                                    <div v-else>无附加规格</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="商品信息" prop="productSn" />
                            <el-table-column label="库存" prop="productStock"></el-table-column>
                            <el-table-column label="数量" prop="quantity"> </el-table-column>
                            <el-table-column label="待发货数量" prop="toDeliveryQuantity" width="120">
                                <template #default="{ row }">
                                    <el-input-number
                                        class="input-number"
                                        controls-position="right"
                                        v-model="row.toDeliveryQuantity"
                                        @change="updateQuantity(row)"
                                        type="number"
                                        :min="0"
                                        :max="row.allowDeliverNum"
                                        :disabled="item.orderStatus != 1 || row.toDeliveryQuantity <= 0"
                                    />
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-form>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { imageFormat, priceFormat } from "@/utils/format";
import { computed, onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message, Modal } from "ant-design-vue";
import type { OrderToShipFormState } from "@/types/order/order.d";
import { getOrder, orderDeliverBatch } from "@/api/order/order";
import { ProductCard } from "@/components/list";
import { SelectLogisticsCompany, ShippingType } from "@/components/select";

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close", "okType"]);

emit("okType", false);
const props = defineProps({
    ids: { type: Array, default: [] },
    act: { type: String, default: "" },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const ids = ref<any[]>(props.ids);
const operation = "batch";
const formRef = shallowRef();
// 这里不要用OrderFormState
const formState = ref<OrderToShipFormState>({
    items: [],
    shippingMethod: 1,
    shippingTypeId: 1
});
const warnSplitNeed = ref(false);
const selectedRows = ref<any[]>([]);
const deliverData = ref<any[]>([]);
onMounted(() => {
    // 获取详情数据
    fetchOrder();
});
const handleAllCheck = (allCheck: number) => {
    if (allCheck === 1) {
        formState.value.items.forEach((item: any) => {
            item.items.forEach((i: any) => {
                if (item.orderStatus === 1 && i.allowDeliverNum > 0) {
                    deliverData.value.push({
                        id: item.orderId,
                        itemId: i.itemId,
                        toDeliveryQuantity: i.toDeliveryQuantity,
                        quantity: i.allowDeliverNum
                    });
                }
            });
        });
        updateDeliverData();
    } else {
        deliverData.value = [];
        updateDeliverData();
    }
};
const deliverDataChecked = (id: any) => {
    return deliverData.value.some((item: any) => item.itemId === id);
};
const toggleCheck = (row: any) => {
    const index = deliverData.value.findIndex((item: any) => item.itemId === row.itemId);
    if (index === -1) {
        deliverData.value.push({
            id: row.orderId,
            itemId: row.itemId,
            toDeliveryQuantity: row.toDeliveryQuantity,
            quantity: row.allowDeliverNum
        });
    } else {
        deliverData.value.splice(index, 1);
    }
    updateDeliverData();
};
const productIds = ref<any[]>([]);
const fetchOrder = async () => {
    try {
        loading.value = true;
        const result = (await getOrder(action.value, { ids: ids.value.join(",") })) as any;
        result.forEach((item: any) => {
            if (item.orderStatus == 1) {
                formState.value.items.push(item);
            }
        });
        // Object.assign(formState.value.items, result);
        if (formState.value.items) {
            formState.value.items.forEach((item: any) => {
                item.items.forEach((i: any) => {
                    i.toDeliveryQuantity = i.allowDeliverNum;
                    productIds.value.push(i.itemId);
                });
            });
        }
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};
const updateQuantity = (row: any) => {
    const index = deliverData.value.findIndex((item: any) => item.itemId === row.itemId);
    if (index !== -1) {
        deliverData.value[index].toDeliveryQuantity = row.toDeliveryQuantity;
        updateDeliverData();
    }
};
const updateDeliverData = () => {
    const arr = <any[]>[];
    warnSplitNeed.value = false;
    if (deliverData.value.length > 0) {
        deliverData.value.forEach((i: any) => {
            if (i.toDeliveryQuantity < i.allowDeliverNum) {
                warnSplitNeed.value = true;
            }
            arr.push({
                id: i.id,
                itemId: i.itemId,
                toDeliveryQuantity: i.toDeliveryQuantity,
                quantity: i.allowDeliverNum
            });
        });
    }
    deliverData.value = arr;
    if (warnSplitNeed.value === false) {
        warnSplitNeed.value = deliverData.value.length < productIds.value.length;
    }
    emit("okType", deliverData.value.length > 0);
};
const transformData = () => {
    const result: any = {};
    let ids = <any[]>[];
    // 使用 Set 来去重
    const uniqueIds = new Set();
    deliverData.value.forEach((item: any) => {
        const id = item.id;
        const foundItem = formState.value.items.find((i: any) => i.orderId === id);
        const trackingNo = foundItem ? foundItem.trackingNo : "";
        const itemInfo = {
            itemId: item.itemId,
            toDeliveryQuantity: item.toDeliveryQuantity
        };
        uniqueIds.add(id);
        if (!result[id]) {
            result[id] = {
                id: id,
                trackingNo: trackingNo,
                deliverInfo: []
            };
        }
        result[id].deliverInfo.push(itemInfo);
    });
    ids = Array.from(uniqueIds);
    let data = {
        ids: ids,
        type: "deliver",
        data: {
            logisticsId: formState.value.logisticsId,
            shippingMethod: formState.value.shippingMethod,
            deliverData: Object.values(result)
        }
    };
    return data;
};
// 表单通过验证后提交
const onSubmit = async () => {
    if (warnSplitNeed.value === false) {
        deliverDo(transformData());
    } else {
        Modal.confirm({
            title: "您当前只选择了部份商品发货，系统将会自动将订单进行拆分，是否确认继续发货？",
            onOk: async () => {
                deliverDo(transformData());
            }
        });
    }
};
const deliverDo = async (data: any) => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await orderDeliverBatch(data);
        emit("submitCallback", result);
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        emit("update:confirmLoading", false);
    }
};
const onChangeShippingType = (defaultLogisticsId: number) => {
    formState.value.logisticsId = defaultLogisticsId;
};

// 表单提交
const onFormSubmit = () => {
    onSubmit();
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.button-card {
    margin-top: 12px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; /* 允许换行 */
    gap: 8px;
    line-height: 24px;
}

.babyBlue {
    background-color: rgba(61, 127, 255, 0.06);
    border-radius: 9px;
}

.pd15 {
    padding: 15px;
}
.input-number {
    width: 85px;
}
</style>
