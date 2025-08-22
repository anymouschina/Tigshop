<template>
    <div class="attr-form">
        <el-form-item label="商品规格" v-if="skuType === 2">
            <div class="attr-list">
                <div class="attr-warp" v-for="(item, index1) in attrList">
                    <div v-if="!disabled" class="btn-remove" @click="removeAttrList(index1)">
                        <i class="iconfont icon-cha1"></i>
                    </div>
                    <div class="attr-warp-title">
                        <div class="flex align-center">
                            <div class="label">规格名：</div>
                            <TigInput
                                v-model="item.attrName"
                                style="margin-right: 20px"
                                width="250px"
                                :disabled="disabled"
                                @blur="dragEnd"
                                placeholder="请输入规格项，如颜色、尺码、大小"
                            />
                        </div>
                    </div>
                    <div class="attr-warp-box">
                        <draggable
                            class="attr-row-box"
                            item-key="deagIndex"
                            :list="item.attrs"
                            ghost-class="sortable-ghost"
                            chosen-class="toolChosenClass"
                            animation="300"
                            @start=""
                            @end="dragEnd"
                            :group="{ name: 'advanced', pull: false, put: true }"
                        >
                            <template #item="{ element, index }">
                                <div class="draggable-item">
                                    <div class="attr-row">
                                        <TigInput
                                            v-model="element.attrValue"
                                            placeholder="请输入规格值，如：白色"
                                            width="250px"
                                            :disabled="disabled"
                                            :suffix-icon="Rank"
                                        />
                                        <div v-if="item.attrs.length > 1 && !disabled" class="btn-remove2" @click="removeAttr(index1, index)">
                                            <i class="iconfont icon-cha1"></i>
                                        </div>
                                        <div class="upload-img-wrap" v-if="index1 < 1">
                                            <div class="arrow"></div>
                                            <div class="pic-select-con">
                                                <div class="pic-select" v-if="!disabled">
                                                    <DialogForm type="gallery" @okCallback="addPic" :data="{ index: index1, idx: index }">
                                                        <div class="pic-select-img">
                                                            <img v-if="element.attrPicThumb" :src="imageFormat(element.attrPicThumb)" />
                                                        </div>
                                                    </DialogForm>
                                                    <i
                                                        @click="removePic(index1, index)"
                                                        v-if="element.attrPicThumb"
                                                        class="pic-select-del iconfont icon-cha"
                                                    ></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <el-button
                                        v-if="index === item.attrs.length - 1"
                                        :disabled="disabled"
                                        @click="addAttr(index1)"
                                        link
                                        type="primary"
                                        class="ml10"
                                        style="margin-top: 8px"
                                        ><i class="btn-ico">+</i>增加规格值</el-button
                                    >
                                </div>
                            </template>
                        </draggable>
                    </div>
                    <div v-if="index1 < 1" class="extra mt10" style="text-align: center">
                        仅支持为第一组规格设置规格图片，买家选择不同规格会看到对应规格图片，建议尺寸：800 x 800像素
                    </div>
                </div>
                <div class="attr-warp-title">
                    <el-button :disabled="disabled" @click="addAttrSpeList()"><i class="btn-ico">+</i>添加商品规格</el-button>
                </div>
            </div>
            <div class="red">{{ skuErrorText }}</div>
        </el-form-item>
        <el-form ref="productFormRef" :model="productList" label-width="100px" name="form_in_modal">
            <el-form-item label="规格明细" v-if="(skuType === 2 && productForm.length > 0) || (skuType === 1 && productList.length > 0)" prop="productList">
                <div class="lyecs-form-table">
                    <el-table :data="productList" style="width: 100%">
                        <el-table-column v-if="skuType === 2" v-for="attr in productForm[0].attrs" prop="attrs" :label="attr.attrName" align="center">
                            <template #default="{ row, $index }">
                                {{ getAttrValue(row.attrs, attr.attrName) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuSn" label="商品编码" width="120"  fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    v-model:org-value="batchInput.skuSn"
                                    @callback="onBatchClick"
                                    label="商品编码"
                                >
                                    <div class="flex flex-align-center flex-justify-center"><em class="red" v-if="productSnGenerateType== 2">*</em>商品编码</div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <el-form-item label="" :prop="`productList.${$index}.skuStock`" :rules="[{ required: productSnGenerateType== 2, validator: validateSkuSn }]">
                                    <TigInput v-model="row.skuSn" :disabled="disabled" />
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuTsn" label="商品条码" width="120"  fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    v-model:org-value="batchInput.skuTsn"
                                    @callback="onBatchClick"
                                    label="商品条码"
                                >
                                    <div class="flex flex-align-center flex-justify-center">商品条码</div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <TigInput v-model="row.skuTsn" :disabled="disabled" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="supplyPrice" label="供货价" width="150"  fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    type="decimal"
                                    v-model:org-value="batchInput.supplyPrice"
                                    @callback="onBatchClick"
                                    label="供货价"
                                >
                                    <div class="flex flex-align-center flex-justify-center">
                                        <em class="red">*</em>
                                        <div>供货价</div>
                                    </div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <el-form-item label="" :prop="`productList.${$index}.supplyPrice`" :rules="[{ required: true, validator: validatePrice }]">
                                    <PriceInput v-model:modelValue.number="row.supplyPrice" :disabled="disabled"></PriceInput>
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="supplyPriceLimitVal" label="限购金额" width="170" fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    type="decimal"
                                    v-model:org-value="batchInput.supplyPriceLimitVal"
                                    @callback="onBatchClick"
                                    label="限购金额"
                                >
                                    <div class="flex flex-align-center flex-justify-center">
                                        <em class="red">*</em>
                                        <div>限购金额</div>
                                    </div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <el-form-item
                                    label=""
                                    :prop="`productList.${$index}.supplyPriceLimitVal`"
                                    :rules="[{ required: true, validator: validatesupplyPriceLimitVal }]"
                                >
                                    <TigInput type="decimal" v-model.modelValue="row.supplyPriceLimitVal" :disabled="disabled" :min="0">
                                        <template #prepend>
                                            <el-select v-model="row.supplyPriceLimitType" placeholder="请选择" style="width: 88px" :disabled="disabled">
                                                <el-option label="按金额" :value="1" />
                                                <el-option label="按比例" :value="2" />
                                            </el-select>
                                        </template>
                                    </TigInput>
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuWeight" label="重量" min-width="100" fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    v-model:org-value="batchInput.skuWeight"
                                    @callback="onBatchClick"
                                    label="重量"
                                >
                                    <div class="flex flex-align-center flex-justify-center">重量</div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <el-form-item label="" :prop="`productList.${$index}.skuWeight`">
                                    <TigInput type="decimal" v-model="row.skuWeight" :disabled="disabled" :min="0">
                                        <template #append> g </template>
                                    </TigInput>
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuStock" label="库存" min-width="100" fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    v-model:org-value="batchInput.skuStock"
                                    @callback="onBatchClick"
                                    label="库存"
                                >
                                    <div class="flex flex-align-center flex-justify-center"><em class="red">*</em> 库存</div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <el-form-item label="" :prop="`productList.${$index}.skuStock`" :rules="[{ required: true, validator: validateStock }]">
                                    <TigInput type="integer" v-model.number="row.skuStock" :disabled="disabled" :min="0" />
                                </el-form-item>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { PopForm } from "@/components/pop-form";
import { Rank, QuestionFilled } from "@element-plus/icons-vue";
import draggable from "vuedraggable";
import { ref, onMounted, watch, computed, toRaw } from "vue";
import { DialogForm } from "@/components/dialog";
import { imageFormat } from "@/utils/format";
import PriceInput from "@/views/product/product/src/PriceInput.vue";
const props = defineProps({
    attrList: { type: Array, default: [] },
    productList: { type: [Object, Array], default: [] },
    attrChanged: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    action: { type: String, default: "add" },
    skuType: { type: Number, default: 1 },
    productSnGenerateType: { type: Number, default: 1 }
});
const productFormRef = ref();
const skuErrorText = defineModel<string>("skuErrorText", { default: "" });
const emit = defineEmits(["update:productList", "update:attrList", "update:attrChanged"]);
const batchInput = ref<any>({});
const attrList = ref<any>(props.attrList);
const productList = ref<any>(props.productList);
const getAttrValue = (attrs: any[], attrName: string) => {
    const attr = attrs.find((attr) => attr.attrName === attrName);
    return attr ? attr.attrValue : "";
};
let watchLoaded = false;
// 动态规格表单>

onMounted(() => {
    emit("update:productList", productList);
    emit("update:attrList", attrList);
});
const validateStock = (rule: any, value: any, callback: any) => {
    const index = rule.field.split(".")[1];
    let stock = Number(productList.value[index].skuStock);
    productList.value[index].skuStock = stock;
    if (isNaN(stock)) {
        callback(new Error("请输入数字"));
        return;
    } else if (stock == null || stock == undefined || Number.isNaN(stock)) {
        callback(new Error("请输入商品库存"));
        return;
    } else if (props.action != "add" && stock < 0) {
        callback(new Error("库存不能是负数"));
        return;
    } else if (!Number.isInteger(stock)) {
        callback(new Error("商品库存必须是整数"));
        return;
    } else {
        callback();
    }
};
const validatePrice = (rule: any, value: any, callback: any) => {
    const index = rule.field.split(".")[1];
    let price = Number(productList.value[index].supplyPrice);
    if (!price) {
        callback(new Error("请输入商品供货价"));
        return;
    } else {
        callback();
    }
};
const validatesupplyPriceLimitVal = (rule: any, value: any, callback: any) => {
    const index = rule.field.split(".")[1];
    let price = Number(productList.value[index].supplyPriceLimitVal);
    if (!price) {
        callback(new Error("请输入商品限购金额"));
        return;
    } else {
        callback();
    }
};

const validateSkuSn = (rule: any, value: any, callback: any) => {
    const index = rule.field.split(".")[1];
    let skuSn = Number(productList.value[index].skuSn);
    let list = JSON.parse(JSON.stringify(productList.value));
    list.splice(index, 1);
    let i = list?.findIndex((item: any) => item.skuSn == skuSn);
    if(props.productSnGenerateType == 2) {
        if (!skuSn) {
            callback(new Error("请输入商品编码"));
            return;
        } else if (i != -1) {
            callback(new Error("商品编码需要时唯一值"));
            return;
        } else {
            callback();
        }
    } else {
        callback();
    }
};

const validateProductSku = async () => {
    await productFormRef.value.validate();
};
const dragEnd = (event: any) => {
    // 重新计算 productList
    productList.value = getProductForm();
};
// 添加属性项
const addAttr = (index: number) => {
    attrList.value[index].attrs.push({
        attrValue: "",
        attrType: 1,
        attrName: attrList.value[index].attrName
    });
};
// 移除属性项
const removeAttr = (index: number, idx: number) => {
    attrList.value[index].attrs.splice(idx, 1);
    // 重新计算 productList
    productList.value = getProductForm();
};
// 移除类型
const removeAttrList = (index: number) => {
    attrList.value.splice(index, 1);
    // 重新计算 productList
    productList.value = getProductForm();
};
const addAttrSpeList = () => {
    attrList.value.push({
        attrName: "",
        attrs: [
            {
                attrType: 1,
                attrName: "",
                attrValue: ""
            }
        ]
    });
};
// 添加图片
const addPic = (result: any, data: any) => {
    attrList.value[data.index].attrs[data.idx].attrPic = result[0].picUrl;
    attrList.value[data.index].attrs[data.idx].attrPicThumb = result[0].picThumb;
};
// 移除图片
const removePic = (index: number, idx: number) => {
    attrList.value[index].attrs[idx].attrPic = "";
    attrList.value[index].attrs[idx].attrPicThumb = "";
};
// 批量操作：
const onBatchClick = () => {
    let i = 1;
    for (let index in productList.value) {
        if (batchInput.value.skuStock) productList.value[index].skuStock = batchInput.value.skuStock;
        if (batchInput.value.skuWeight) productList.value[index].skuWeight = batchInput.value.skuWeight;
        if (batchInput.value.supplyPriceLimitType) productList.value[index].supplyPriceLimitType = batchInput.value.supplyPriceLimitType;
        if (batchInput.value.skuSn) productList.value[index].skuSn = batchInput.value.skuSn + "-" + i;
        if (batchInput.value.skuTsn) productList.value[index].skuTsn = batchInput.value.skuTsn + "-" + i;
        if (batchInput.value.supplyPrice) productList.value[index].supplyPrice = batchInput.value.supplyPrice;
        if (batchInput.value.supplyPriceLimitVal) productList.value[index].supplyPriceLimitVal = batchInput.value.supplyPriceLimitVal;
        i++;
    }
};
const productForm = ref<any>([]);
const getProductForm = () => {
    if (attrList.value.length == 0) {
        return [];
    }
    let list = getCombinations(attrList.value);
    let res: any[] = [];
    for (let idx in list) {
        res[idx] = {
            attrs: []
        };
        let arr = [];
        for (let i in list[idx]) {
            res[idx].attrs[i] = {
                attrName: list[idx][i].attrName,
                attrValue: list[idx][i].attrValue
            };
            arr.push(list[idx][i].attrName + ":" + list[idx][i].attrValue);
            res[idx].skuStock = res[idx].skuStock || "";
            res[idx].skuWeight = res[idx].skuWeight || "";
            res[idx].supplyPriceLimitVal = res[idx].supplyPriceLimitVal || "";
            res[idx].supplyPrice = res[idx].supplyPrice || "";
            res[idx].supplyPriceLimitType = res[idx].supplyPriceLimitType || 1;
        }
        res[idx].skuValue = arr.join("|");
        // 匹配已存在的值
        const match = productList.value.find((item: any) => {
            return res[idx].skuValue == item.skuAttrVal || res[idx].skuValue == item?.skuValue;
        });
        if (match) {
            res[idx].skuStock = match.skuStock;
            res[idx].skuWeight = match.skuWeight;
            res[idx].supplyPriceLimitType = match.supplyPriceLimitType;
            res[idx].skuSn = match.skuSn;
            res[idx].skuTsn = match.skuTsn;
            res[idx].supplyPrice = match.supplyPrice;
            res[idx].supplyPriceLimitVal = match.supplyPriceLimitVal;
        }
    }
    // 用于匹配修改后的值
    productList.value = res;
    return res;
};
// 监听attrList值是否有变化，如果有，则会更新参数
watch(
    () => attrList.value,
    (newValue, oldValue) => {
        // 判断值是否有变化
        if (watchLoaded == true) {
            emit("update:attrChanged", true);
            // stopWatch()
        }
        productForm.value = getProductForm();
        watchLoaded = true;
    },
    { deep: true, immediate: true }
);
watch(
    () => props.skuType,
    (newValue, oldValue) => {
        if(newValue == 1 && props.action == "add"){
            productList.value = [
                {
                    supplyPriceLimitType: 1
                }
            ]
        }
        if(newValue == 1) {
            attrList.value.length = 0
        }
    },
    { deep: true, immediate: true }
);

function getCombinations(attrList: any[]): any[] {
    const combinations: any[] = [];
    if (attrList.length === 0) {
        skuErrorText.value = "";
        combinations.push([]);
        return combinations;
    }
    attrList.map((item: any) => {
        if (item.attrs.length > 0) {
            item.attrs.map((attr: any) => {
                attr.attrName = item.attrName;
            });
        }
    });
    const firstAttr = attrList[0];
    const remainingAttrs = attrList.slice(1);
    for (let i = 0; i < firstAttr.attrs.length; i++) {
        const currentCombination = [firstAttr.attrs[i]];
        const remainingCombinations = getCombinations(remainingAttrs);
        for (let j = 0; j < remainingCombinations.length; j++) {
            combinations.push([...currentCombination, ...remainingCombinations[j]]);
        }
    }
    return combinations;
}
defineExpose({ skuErrorText, validateProductSku });
</script>

<style lang="less" scoped>
.lyecs-form-table {
    width: 100%;
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
    :deep(.el-select) {
        min-width: 88px;
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

.attr-list {
    width: 100%;
    border: 1px solid #eeeeee;
    padding: 10px;
    .attr-warp-title {
        background-color: #f7f8fa;
        padding: 10px;
        cursor: pointer;
        .title {
            width: 100px;
            .label {
                flex: 1;
                text-align: right;
                white-space: nowrap; /* 防止文字换行 */
                overflow: hidden; /* 隐藏溢出的文字 */
                text-overflow: ellipsis; /* 显示省略号来代替溢出的文字 */
            }
        }
    }
    .attr-warp {
        margin-bottom: 20px;
        position: relative;

        .attr-warp-box {
            display: flex;
            margin-left: 60px;
            .attr-row-box {
                flex: 1;
                margin-top: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                .attr-row {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .draggable-item {
                    display: flex;
                    align-items: flex-start;
                    .attr-row {
                        position: relative;
                        .btn-remove2 {
                            position: absolute;
                            top: -5px;
                            right: -5px;
                            color: #fff;
                            background-color: #7b7b7b;
                            width: 16px;
                            height: 16px;
                            line-height: 14px;
                            text-align: center;
                            border-radius: 50%;
                            cursor: pointer;
                            opacity: 0;
                            i {
                                font-size: 8px;
                                font-weight: bold;
                            }
                        }
                        &:hover {
                            .btn-remove2 {
                                opacity: 1;
                            }
                        }
                    }
                }
            }
            .attr-btn {
                margin-top: 15px;
                margin-left: 10px;
            }
        }
        .btn-remove {
            position: absolute;
            top: 10px;
            right: 10px;
            color: #fff;
            background-color: #7b7b7b;
            width: 18px;
            height: 18px;
            line-height: 16px;
            text-align: center;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            i {
                font-size: 10px;
                font-weight: bold;
            }
        }
        &:hover {
            .btn-remove {
                opacity: 1;
            }
        }
    }
}
.other-attr {
    .attr-warp-title {
        .btn-remove3 {
            margin-right: 10px;
            color: #fff;
            background-color: #7b7b7b;
            width: 16px;
            height: 16px;
            line-height: 11px;
            text-align: center;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            i {
                font-size: 8px;
                font-weight: bold;
            }
        }
        .btn-remove4 {
            margin-right: 10px;
            color: #fff;
            background-color: #7b7b7b;
            width: 16px;
            height: 16px;
            line-height: 11px;
            text-align: center;
            border-radius: 50%;
            cursor: pointer;
            i {
                font-size: 8px;
                font-weight: bold;
            }
        }
        &:hover {
            .btn-remove3 {
                opacity: 1;
            }
        }
    }
}
.upload-img-wrap {
    background: #fff;
    border: 1px solid #dcdcdc;
    border-radius: 4px;
    padding: 2px;
    width: 84px;
    margin-top: 10px;
}
.upload-img-wrap .arrow {
    border-color: transparent;
    border-style: solid;
    border-bottom: 5px solid #dcdcdc;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    height: 0;
    left: 44%;
    position: relative;
    top: -7px;
    width: 0;
    &::after {
        border-color: transparent transparent #fff;
        border-style: solid;
        border-width: 0 10px 10px;
        content: "";
        display: block;
        height: 0;
        margin-left: -10px;
        position: absolute;
        top: 1px;
        width: 0;
    }
}
.pic-select-con :deep(.pic-select) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 0;
    position: relative;
}

.pic-select-con :deep(.pic-select-img) {
    height: 70px;
    width: 70px;
    padding-left: 0;
    background-color: #fff;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.pic-select-con :deep(.pic-select-img:after) {
    content: "\e637";
    font-family: "admin-iconfont";
    font-size: 30px;
    position: absolute;
    top: 0;
    line-height: 70px;
    width: 70px;
    left: 0;
    z-index: 1;
    text-align: center;
    color: #a6a5a5;
}

.pic-select-con :deep(.pic-select .pic-select-del) {
    position: absolute;
    cursor: pointer;
    right: -8px;
    top: -13px;
    color: #fff;
    background: #dbdbdb;
    border-radius: 50%;
    z-index: 2;
    width: 16px;
    height: 16px;
    text-align: center;
    line-height: 16px;
    font-size: 12px;
    display: none;
}

.pic-select-con:hover :deep(.pic-select .pic-select-del) {
    display: block;
    background-color: #7b7b7b;
}

.pic-select-con :deep(.pic-select .pic-select-img img) {
    width: 70px;
    height: 70px;
    position: relative;
    z-index: 2;
}

// .attr-form {
//     .inner-item {
//         :deep(.el-input) {
//             width: 450px;
//         }
//         :deep(.el-textarea) {
//             width: 450px;
//         }
//         :deep(.el-select) {
//             width: 450px;
//         }
//     }
//     @media (max-width: 768px) {
//         .inner-item {
//             :deep(.el-select) {
//                 min-width: 0 !important;
//                 width: 100% !important; /* 如果需要宽度100% */
//             }
//         }
//     }
// }
</style>
