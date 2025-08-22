<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :rules="rules" :model="formState" label-width="auto">
                    <el-form-item prop="unit" label="活动类型" v-if="formState.promotionType !== 3">
                        <RadioType
                            v-model:modelValue="formState.unit"
                            :radioList="[
                                { key: 1, title: '满N元减 元/折', desc: '例：满100元减10元/满100元打8折' },
                                { key: 2, title: '满N件减 元/折', desc: '例：满3件减10元/满3件打8折' }
                            ]"
                        >
                        </RadioType>
                    </el-form-item>
                    <el-form-item prop="promotionName" label="活动名称">
                        <TigInput width="300px" type="text" v-model="formState.promotionName" />
                    </el-form-item>
                    <el-form-item prop="sendType" label="活动时间">
                        <div class="flex flex-align-center">
                            <SelectTimeInterval
                                v-model:end-date="formState.endTime"
                                v-model:start-date="formState.startTime"
                                :clearable="true"
                                width="180px"
                                type="datetime"
                                value-format="YYYY-MM-DD HH:mm:ss"
                                @callback="changeDateType(-1)"
                            ></SelectTimeInterval>
                            <div>
                                <el-radio-group class="itemWidth" v-model="dateType" @change="changeDateType">
                                    <el-radio-button :value="0">1天</el-radio-button>
                                    <el-radio-button :value="1">7天</el-radio-button>
                                    <el-radio-button :value="2">15天</el-radio-button>
                                </el-radio-group>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item prop="rulesType" label="优惠规则">
                        <div>
                            <div v-if="formState.promotionType !== 3">
                                <el-radio-group v-model="formState.rulesType">
                                    <el-radio :value="1">阶梯优惠（例：满1件减10元）</el-radio>
                                    <el-radio :value="0">循环优惠（例：每满1件减10元）</el-radio>
                                </el-radio-group>
                            </div>
                            <div v-if="formState.promotionType == 3">
                                <el-radio-group v-model="formState.rulesType">
                                    <el-radio :value="1">实付满N元赠</el-radio>
                                    <el-radio :value="0">实付每满N元赠</el-radio>
                                </el-radio-group>
                            </div>
                            <div>
                                <stepTable 
                                    v-if="!loading"
                                    ref="stepTableRef" 
                                    :unit="formState.unit" 
                                    :rulesType="formState.rulesType" 
                                    :promotionTypeData="formState.promotionTypeData" 
                                    v-model:promotionType="formState.promotionType"
                                >
                                </stepTable>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item prop="range" label="适用商品">
                        <div>
                            <div>
                                <SelectGoodsRange
                                    v-if="!loading"
                                    v-model:rangeIds="formState.rangeData"
                                    v-model:rangeType="formState.range"
                                    :isSelf="1"
                                />
                            </div>
                            <div v-if="Number(formState.range) > 0 && !isProduct" class="extra red">请选择商品</div>
                        </div>
                    </el-form-item>
                    <el-form-item prop="limitUserRank" label="参与客户限制">
                        <el-select
                            v-model="formState.limitUserRank"
                            multiple
                            placeholder="请选择"
                            style="width: 300px"
                            clearable
                            >
                            <el-option
                                v-for="item in rankList"
                                :key="item.rankId"
                                :label="item.rankName"
                                :value="item.rankId"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
    <el-dialog v-if="conflictList.length > 0" v-model="visible" title="冲突提示" width="600" top="25vh">
        <conflictPopUp :conflictList="conflictList"></conflictPopUp>
    </el-dialog>
</template>
<script lang="ts" setup>
import { ref, shallowRef, onMounted, reactive } from "vue";
import RadioType from "@/components/radio/src/RadioType.vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import type { ProductActivityFilterState, RankList } from "@/types/promotion/productActivity.d";
import { getProductActivity, updateProductActivity, getProductActivityConfig, getProductConflict } from "@/api/promotion/productActivity";
import type { FormRules } from "element-plus";
import { SelectGoodsRange } from "@/components/select";
import { SelectTimeInterval } from "@/components/select";
import { getDays, getDaysBetweenDates } from "@/utils/util";
import { formattedDate } from "@/utils/time";
import stepTable from "./src/stepTable.vue"
import conflictPopUp from "./src/conflictPopUp.vue"
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const rankList = ref<RankList[]>([]); // 允许领取客户等级列表
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    promotionType: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    isDialog: {
        type: Boolean,
        default: false
    }
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const stepTableRef = shallowRef();
const formState = ref<ProductActivityFilterState>({
    promotionType: props.promotionType || 0,
    startTime: formattedDate(new Date(), "YYYY-MM-DD HH:mm:ss"),
    endTime: formattedDate(getDays(1, "add"), "YYYY-MM-DD HH:mm:ss"),
    promotionName: '',
    limitUserRank: [],
    range:0,
    rangeData: [],
    promotionTypeData: [],
    rulesType: 1,
    unit: 1,
});
const isProduct = ref<boolean>(true)
const dateType = ref(0)
const changeDateType = (event: number) => {
    if (event === -1) {
        dateType.value = event;
        return
    }
    formState.value.startTime = formattedDate(new Date(), "YYYY-MM-DD HH:mm:ss");
    if (event === 0) {
        //1
        formState.value.endTime = formattedDate(getDays(1, "add"), "YYYY-MM-DD HH:mm:ss");
    }
    if (event === 1) {
        //7
        formState.value.endTime = formattedDate(getDays(7, "add"), "YYYY-MM-DD HH:mm:ss");
    }
    if (event === 2) {
        //15
        formState.value.endTime = formattedDate(getDays(15, "add"), "YYYY-MM-DD HH:mm:ss");
    }
};
onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchActivity();
    } else {
        loading.value = false;
    }
    fetchActivityConfig()
});
const fetchActivity = async () => {
    try {
        const result = await getProductActivity(action.value, {
            id: id.value,
            promotionType: props.promotionType,
        });
        dateType.value = -1
        if(getDaysBetweenDates(result.productTime) == 1){
            dateType.value = 0
        }
        if(getDaysBetweenDates(result.productTime) == 7){
            dateType.value = 1
        }
        if(getDaysBetweenDates(result.productTime) == 15){
            dateType.value = 2
        }
        Object.assign(formState.value, result);
    } catch (error: any) {
        console.log(error);
        // message.error(error.message);
        // emit("close");
    } finally {
        loading.value = false;
    }
};
const fetchActivityConfig = async () => {
    try {
        const result = await getProductActivityConfig();
        rankList.value = result.rankList;
    } catch (error: any) {
        message.error(error.message);
    } finally {
    }
};
const visible = ref(false)
const conflictList = ref<any[]>([])
const fetchProductConflict = async () => {
    try {
        const result = await getProductConflict({
            range: formState.value.range,
            rangeData: formState.value.rangeData.join(','),
            startTime: formState.value.startTime,
            endTime: formState.value.endTime,
            promotionType: formState.value.promotionType
        });
        visible.value = true;
        conflictList.value = result.records
        return
    } catch (error: any) {
        message.error(error.message);
    }
};

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    await stepTableRef.value.formRef.validate()
    if(Number(formState.value.range) !== 0 && formState.value.rangeData?.length == 0){
        isProduct.value = false
        return
    }else{
        isProduct.value = true
    }
    formState.value.promotionTypeData = stepTableRef.value.form.promotionTypeData;
    try {
        emit("update:confirmLoading", true);
        const result = await updateProductActivity(operation, { id: id.value, ...formState.value });
        emit("submitCallback", result);
        message.success("操作成功");
    } catch (error: any) {
        if(error.code == 1001){
            message.error(error.message);
        }else if(error.code == 5001){
            fetchProductConflict()
        }else{
            message.error(error.message);
        }
    } finally {
        emit("update:confirmLoading", false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};
const validateSendTime = (rule: any, value: any, callback: any) => {
    if(!formState.value.startTime && !formState.value.endTime){
        callback(new Error("请输入用券时间"));
        return
    }
    callback();
}

interface RuleForm {
    promotionName: string;
    sendType: number;
}
const rules = reactive<FormRules<RuleForm>>({
    promotionName: [{ required: true, message: "请输入活动名称", trigger: "blur" }],
    sendType: [{ required: true,  validator: validateSendTime, trigger: "blur" }]
});
defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.container{
    .tig-radio{
        :deep(.el-radio-group){
            display: block;
            font-size: 12px;
        }
        :deep(.el-radio){
            margin-right: 0px;
        }
        .check-box{
            cursor: pointer;
            :deep(.el-input-group__append){
                background-color: #fff !important;
                padding: 0;
                box-shadow: none;
            }
            .item{
                width: 35px;
                height: 25px;
                line-height: 25px;
                text-align: center;
                border: 1px solid #b8b8b8;
            }
            .active{
                border: 1px solid var(--tig-primary);
                color: var(--tig-primary);
                background-color: #e6efff;
            }
            .disabled{
                .item{
                    background-color: #f7f7f7;
                    color: #ccc;
                }
                .active{
                    border: 1px solid #b8b8b8;
                    background-color: #e0e0e0;
                }
            }
        }
    }
    .itemWidth{
        margin-bottom: 3px;
        margin-left: 10px;
    }
    .red{
        color: var(--el-color-danger);
    }
}

</style>
