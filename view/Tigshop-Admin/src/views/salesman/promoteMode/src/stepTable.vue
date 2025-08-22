p<template>
    <div class="lyecs-form-table">
        <el-form ref="formRef" :rules="rules" :model="form" label-width="auto">
            <el-form-item prop="typeData">
                <div class="flex mb10">
                    <div class="flex">
                        <el-button type="primary" :icon="Plus" link @click="addPreferential" :disabled="form.typeData.length >= 10">
                            {{ form.typeData.length >= 10 ? "最多添加10级" : `添加等级(${form.typeData.length}/10)` }}
                        </el-button>
                    </div>
                </div>
            </el-form-item>
            <el-form-item prop="typeData">
                <el-table :data="form.typeData" style="width: 100%" border>
                    <el-table-column label="序号" width="80">
                        <template #default="{ $index }">
                            {{ $index + 1 }}
                        </template>
                    </el-table-column>
                    <el-table-column label="等级名" prop="name" width="130">
                        <template #default="{ row, $index }">
                            <el-form-item :prop="'typeData.' + $index + '.name'" :rules="rules.name">
                                <div class="flex flex-align-center">
                                    <TigInput v-model="row.name" width="100px"></TigInput>
                                </div>
                            </el-form-item>
                        </template>
                    </el-table-column>
                    <el-table-column label="升级条件" prop="condition" width="170">
                        <template #default="{ row, $index }">
                            <div class="condition">
                                <el-form-item :prop="'typeData.' + $index + '.condition'" :rules="rules.condition">
                                    <div v-if="$index === 0">
                                        <p>初始等级， 无需设置</p>
                                    </div>
                                    <div style="min-width: 110px" v-if="$index > 0 && row.condition">
                                        <p v-if="row.condition.selfBuyAmount?.checked && row.condition.selfBuyAmount?.value > 0">自购金额满{{ row.condition.selfBuyAmount?.value }}元</p>
                                        <p v-if="row.condition.salesAmount?.checked && row.condition.salesAmount?.value > 0">推广金额满{{ row.condition.salesAmount?.value }}元</p>
                                        <p v-if="row.condition.salesInviteUsers?.checked && row.condition.salesInviteUsers?.value > 0">发展客户数满{{ row.condition.salesInviteUsers?.value }}人</p>
                                        <!-- <p v-if="row.condition.inviteSales?.checked">邀请分销员满{{ row.condition.inviteSales?.value }}人</p> -->
                                    </div>
                                    <div style="min-width: 110px" v-if="$index > 0 && !row.condition">
                                        <p class="gray">未设置</p>
                                    </div>
                                    <popover
                                        :index="$index"
                                        :conditionsData="row.condition"
                                        :superiorData="$index > 1 ? form.typeData[$index - 1].condition : null"
                                        @submitCallback="popoverCallback"
                                    >
                                        <el-icon v-if="$index > 0" size="15" color="#333"><Edit /></el-icon>
                                        <span v-else></span>
                                    </popover>
                                </el-form-item>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="rate" width="300">
                        <template #header>
                            <div class="flex flex-align-center">
                                <p>佣金比例</p>
                                <el-tooltip placement="top-end" effect="light">
                                    <template #content>
                                        <div style="width: 450px">
                                            <p>
                                                <el-icon size="12" color="#155bd4"><InfoFilled /></el-icon> 修改后的比例只影响之后升级的佣金发放
                                            </p>
                                            <p>商品佣金比例：分销员推广商品后获得的商品佣金=商品佣金比例*商品实付金额（扣除运费、税费和附加费）。</p>
                                            <p>
                                                下级分销员邀请奖励比例：下级分销员推广后，上级分销员获得邀请奖励=下级分销员邀请奖励比例*商品实付金额（扣除运费、税费和附加费）。
                                            </p>
                                            <p>举例：B是A发展的分销员，B成功推广商品后，B可获得商品佣金，A可获得邀请奖励。</p>
                                            <p>当分销员升至对应等级即会发放对应佣金，降级时不发放，频繁调整分销员等级会导致佣金多次发放。</p>
                                        </div>
                                    </template>
                                    <el-icon size="14" color="#969799"><QuestionFilled /></el-icon>
                                </el-tooltip>
                            </div>
                        </template>
                        <template #default="{ row, $index }">
                            <el-form-item class="rate" :prop="'typeData.' + $index + '.rate'" :rules="rules.rate">
                                <div class="rate-item">
                                    <div class="tit">商品佣金</div>
                                    <div class="inp">
                                        <TigInput type="decimal" v-model="row.rate" style="width: 120px" :min="0">
                                            <template #append>%</template>
                                        </TigInput>
                                    </div>
                                </div>
                            </el-form-item>
                            <el-form-item
                                v-if="distributionLevel == 2"
                                class="down_salesman_rate"
                                :prop="'typeData.' + $index + '.downSalesmanRate'"
                                :rules="rules.downSalesmanRate"
                            >
                                <div class="rate-item mt20">
                                    <div class="tit">下级分销员邀请奖励</div>
                                    <div class="inp">
                                        <TigInput type="decimal" v-model="row.downSalesmanRate" style="width: 120px" :min="0">
                                            <template #append>%</template>
                                        </TigInput>
                                    </div>
                                </div>
                            </el-form-item>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" width="100" align="center">
                        <template #default="{ row, $index }">
                            <div class="btn" v-if="$index > 0 && form.typeData.length > 1">
                                <el-button type="primary" link @click="del($index)">删除</el-button>
                            </div>
                            <div class="btn" v-else>-</div>
                        </template>
                    </el-table-column>
                </el-table>
            </el-form-item>
        </el-form>
    </div>
</template>
<script lang="ts" setup>
import { Plus, QuestionFilled, Edit, InfoFilled } from "@element-plus/icons-vue";
import { onMounted, reactive, watch, shallowRef } from "vue";
import type { FormRules } from "element-plus";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import popover from "./popover.vue";
import { useConfigStore } from "@/store/config";
const config = useConfigStore();
const props = defineProps({
    distributionLevel: {
        //分销等级 1: 一级分销 2: 二级分销
        type: Number,
        default: 1
    },
    typeData: {
        type: Array,
        default: []
    }
});
const formRef = shallowRef();
export interface FormExpose {
    typeData: any[];
}
const form = reactive<FormExpose>({
    typeData: props.typeData
});
const validateCondition = (rule: any, value: any, callback: any, rowIndex: number) => {
    let condition = (form.typeData[rowIndex] as any).condition;
    if (rowIndex > 0) {
        if (condition.salesAmount.checked && condition.salesAmount.value <= 0) {
            callback(new Error("请设置升级条件"));
            return;
        }
        if (condition.salesInviteUsers.checked && condition.salesInviteUsers.value <= 0) {
            callback(new Error("请设置升级条件"));
            return;
        }
        if (condition.selfBuyAmount.checked && condition.selfBuyAmount.value <= 0) {
            callback(new Error("请设置升级条件"));
            return;
        }
        if (!condition.salesAmount.checked && !condition.salesInviteUsers.checked && !condition.selfBuyAmount.checked) {
            callback(new Error("请设置升级条件"));
            return;
        }
        callback();
    } else {
        callback();
    }
};
interface RuleForm {
    name: string;
    condition: any;
    rate: number;
    downSalesmanRate: number;
}
const rules = reactive<FormRules<RuleForm>>({
    name: [{ required: true, message: "请输入等级名", trigger: "blur" },{
        validator: (rule: any, value: string, callback: any) => {
            const currentIndex = form.typeData.findIndex(item => item.name === value);
            const isDuplicate = form.typeData.some((item, index) => item.name === value && index !== currentIndex);
            if (isDuplicate) {
                callback(new Error("等级名不能重复"));
            } else {
                callback();
            }
        },
        trigger: "blur"
    }],
    condition: [
        {
            required: true,
            validator: (rule: any, value, callback) => {
                const regex = /\.(\d+)\./;
                const match: any = rule?.field.match(regex);
                const rowIndex = match[1];
                validateCondition(rule, value, callback, rowIndex);
            },
            trigger: "blur"
        }
    ],
    rate: [{ required: true, message: "请输入", trigger: "blur" }],
    downSalesmanRate: [{ required: true, message: "请输入", trigger: "blur" }]
});
const addPreferential = async () => {
    await formRef.value.validate();
    if (form.typeData.length <= 10) {
        form.typeData.push({
            id: form.typeData.length + 1,
            name: "",
            rate: 0,
            downSalesmanRate: 0,
            condition: {
                selfBuyAmount: { checked: false, disabled: false, value: 0.0, title: "自购金额", unit: config.get("amountUnit") ?? "元" },
                salesAmount: { checked: false, disabled: false, value: 0.0, title: "推广金额", unit: config.get("amountUnit") ?? "元" },
                salesInviteUsers: { checked: false, disabled: false, value: 0, title: "发展客户数", unit: "人" }
                // inviteSales: { checked: false, value: 0, title: "邀请分销员", unit: "人" }
            }
        });
        await formRef.value.validate();
    }
};
const del = (index: number) => {
    form.typeData.splice(index, 1);
};
const popoverCallback = (data: any) => {
    let index: number = data.index;
    form.typeData[index].condition = data.conditionsOpts;
};
onMounted(() => {
    if (form.typeData.length < 1) {
        addPreferential();
    }
});
defineExpose({ formRef, form });
</script>
<style lang="less" scoped>
.lyecs-form-table {
    width: 780px;
    margin-top: 15px;
    font-size: 16px;
    :deep(.el-table .cell) {
        overflow: visible !important;
    }
    :deep(.el-form-item__error) {
        position: absolute !important;
        z-index: 99;
        top: 32px !important;
    }
    :deep(.el-form-item) {
        margin-bottom: 5px;
    }
    :deep(.el-input-group__append, .el-input-group__prepend) {
        padding: 0 10px;
    }
    .rate {
        :deep(.el-form-item__error) {
            position: absolute !important;
            z-index: 99;
            top: 32px !important;
            right: 83px !important;
            left: inherit !important;
        }
    }
    .down_salesman_rate {
        :deep(.el-form-item__error) {
            position: absolute !important;
            z-index: 99;
            top: 52px !important;
            right: 83px !important;
            left: inherit !important;
        }
    }
}
@media (max-width: 1000px) {
    .lyecs-form-table{
        width: 100%;
    }
}
.rate-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.btn {
    text-align: center;
}
.condition {
    :deep(.el-form-item__error) {
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
    }
}
</style>
