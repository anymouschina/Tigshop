<template>
    <div class="attr-form">
        <el-form-item label="属性模板" prop="type" class="inner-item">
            <el-space>
                <el-select v-model="attrTplId" placeholder="请选择" clearable :disabled="disabled" style="width: 200px">
                    <el-option v-for="item in attrTplList" :label="item.tplName" :key="item.tplId" :value="item.tplId" />
                </el-select>
            </el-space>
            <el-button :disabled="!attrTplId" @click="importAttrTpl" style="margin-left: 10px">确认导入</el-button>
        </el-form-item>
        <el-form-item prop="brandLogo" label="商品属性">
            <div class="attr-list other-attr">
                <div class="attr-warp attr-normal-box" v-for="(item, index) in attrList.normal">
                    <div class="title-box flex align-center">
                        <div class="label">属性名：</div>
                        <div class="tit-value">
                            <BusinessData v-model:modelValue="item.attrName" width="280px" :disabled="disabled" :dataType="8"></BusinessData>
                            <div v-if="!disabled" class="btn-remove3" @click="removeAttrList('normal', index)">
                                <i class="iconfont icon-cha1"></i>
                            </div>
                        </div>
                    </div>
                    <div class="attr-normal-value">
                        <el-space class="attr-row" v-for="(attr, idx) in item.attrList">
                            <BusinessData v-model:modelValue="attr.attrValue" width="310px" :disabled="disabled" :dataType="8"></BusinessData>
                        </el-space>
                    </div>
                </div>
                <div class="attr-warp-title">
                    <el-button :disabled="disabled" @click="addAttrList('normal', '添加商品属性')"><i class="btn-ico">+</i>添加商品属性</el-button>
                </div>
            </div>
        </el-form-item>
        <el-form-item label="商品规格">
            <div class="attr-list">
                <div class="attr-warp" v-for="(item, index1) in attrList.spe">
                    <div v-if="!disabled" class="btn-remove" @click="removeAttrList('spe', index1)">
                        <i class="iconfont icon-cha1"></i>
                    </div>
                    <div class="attr-warp-title">
                        <div class="flex align-center">
                            <div class="label">规格名：</div>

                            <div style="width: 300px">
                                <BusinessData
                                    v-model:modelValue="item.attrName"
                                    :disabled="disabled"
                                    :dataType="8"
                                    placeholder="请输入规格项，如颜色、尺码、大小"
                                    @blur="dragEnd"
                                ></BusinessData>
                            </div>
                        </div>
                        <!-- <el-checkbox v-if="index1 < 1" v-model="isImg" label="添加规格图片" style="margin-left: 50px" /> -->
                    </div>
                    <div class="attr-warp-box">
                        <draggable
                            class="attr-row-box"
                            item-key="deagIndex"
                            :list="item.attrList"
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
                                        <div style="width: 250px">
                                            <BusinessData
                                                v-model:modelValue="element.attrValue"
                                                :disabled="disabled"
                                                :dataType="8"
                                                placeholder="请输入规格值，如：白色"
                                                @blur="dragEnd"
                                                :suffix-icon="Rank"
                                            ></BusinessData>
                                        </div>
                                        <div v-if="item.attrList.length > 1 && !disabled" class="btn-remove2" @click="removeAttr('spe', index1, index)">
                                            <i class="iconfont icon-cha1"></i>
                                        </div>
                                        <div class="upload-img-wrap" v-if="index1 < 1">
                                            <div class="arrow"></div>
                                            <div class="pic-select-con">
                                                <div class="pic-select" v-if="!disabled">
                                                    <DialogForm type="gallery" @okCallback="addPic" :data="{ type: 'spe', index: index1, idx: index }">
                                                        <div class="pic-select-img">
                                                            <img v-if="element.attrPicThumb" :src="imageFormat(element.attrPicThumb)" />
                                                        </div>
                                                    </DialogForm>
                                                    <i
                                                        @click="removePic('spe', index1, index)"
                                                        v-if="element.attrPicThumb"
                                                        class="pic-select-del iconfont icon-cha"
                                                    ></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <el-button
                                        v-if="index === item.attrList.length - 1"
                                        :disabled="disabled"
                                        @click="addAttr('spe', index1)"
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
                    <el-button :disabled="disabled" @click="addAttrSpeList('spe')"><i class="btn-ico">+</i>添加商品规格</el-button>
                </div>
            </div>
            <div class="red">{{ skuErrorText }}</div>
        </el-form-item>
        <el-form-item label="">
            <template #label>
                <el-tooltip class="box-item" effect="light" placement="bottom" show-after="300">
                    <template #content>
                        <div style="width: 300px; padding: 5px 10px">
                            附加规格不仅是商品的详细描述，还能为用户提供额外的服务保障，如保修、
                            安装或技术支持等，这些服务可能涉及附加服务费。通过清晰地列出这些附加规格，
                            您可以帮助用户更好地理解商品的价值，并做出更明智的购买决策，从而提升用户体验和销售转化率。
                        </div>
                    </template>
                    <div class="flex flex-align-center">
                        <div>附加规格</div>
                        <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                    </div>
                </el-tooltip>
            </template>
            <div class="attr-list other-attr">
                <div class="attr-warp-title mb10" v-for="(item, index) in attrList.extra">
                    <div class="btn-remove5" @click="removeAttrList('extra', index)">
                        <i class="iconfont icon-cha1"></i>
                    </div>
                    <div>
                        <div class="title flex">
                            <div class="label">附加规格名：</div>
                            <div class="value">
                                <BusinessData v-model:modelValue="item.attrName" width="260px" :disabled="disabled" :dataType="8"></BusinessData>
                            </div>
                        </div>
                        <div class="attr-extra-value">
                            <el-space class="attr-row mb10" v-for="(attr, idx) in item.attrList" :size="16">
                                <div style="width: 180px">
                                    <BusinessData v-model:modelValue="attr.attrValue" :disabled="disabled" :dataType="8"></BusinessData>
                                </div>
                                <el-space :size="0">
                                    附加金额：
                                    <PriceInput :disabled="disabled" v-model:modelValue="attr.attrPrice" width="150px"></PriceInput>
                                </el-space>
                                <div v-if="item.attrList.length > 1 && !disabled" class="btn-remove4" @click="removeAttr('extra', index, idx)">
                                    <i class="iconfont icon-cha1"></i>
                                </div>
                            </el-space>
                        </div>
                    </div>
                    <el-space class="attr-row mt10" style="margin-left: 85px">
                        <el-button :disabled="disabled" @click="addAttr('extra', index)"><i class="btn-ico">+</i>增加新属性</el-button>
                    </el-space>
                </div>
                <div class="attr-warp-title">
                    <el-button :disabled="disabled" @click="addAttrList('extra', '添加商品附加规格')"><i class="btn-ico">+</i>添加商品附加规格</el-button>
                </div>
            </div>
        </el-form-item>
        <el-form ref="productFormRef" :model="productList" label-width="100px" name="form_in_modal">
            <el-form-item label="规格明细" v-if="productForm.length > 0" prop="productList">
                <div class="lyecs-form-table">
                    <el-table :data="productList" style="width: 100%">
                        <el-table-column v-for="attr in productForm[0].attrs" prop="attrs" :label="attr.attrName" align="center">
                            <template #default="{ row, $index }">
                                {{ getAttrValue(row.attrs, attr.attrName) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuPrice" label="一口价" width="150" fixed="right">
                            <template #header>
                                <el-tooltip effect="light" placement="top">
                                    <template #content>
                                        <div style="width: 100px; padding: 5px 10px">一口价会覆盖除属性价格外的所有价格，慎重设置</div>
                                    </template>
                                    <PopForm
                                        :isDirect="true"
                                        :isHover="false"
                                        :max="100"
                                        type="decimal"
                                        v-model:org-value="batchInput.skuPrice"
                                        @callback="onBatchClick"
                                        label="一口价"
                                    >
                                        <div class="flex flex-align-center flex-justify-center">
                                            <em class="red">*</em>
                                            <div>一口价</div>
                                            <el-icon style="margin-left: 5px" size="14" color="#999"><QuestionFilled /></el-icon>
                                        </div>
                                    </PopForm>
                                </el-tooltip>
                            </template>
                            <template #default="{ row, $index }">
                                <el-form-item label="" :prop="`productList.${$index}.skuPrice`" :rules="[{ required: true, validator: validatePrice }]">
                                    <PriceInput v-model:modelValue="row.skuPrice" :disabled="disabled"></PriceInput>
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuStock" label="库存" width="150" fixed="right">
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
                                    <TigInput type="integer" v-model="row.skuStock" :disabled="disabled" :min="0" />
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuSn" label="商品编码" width="150" fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    v-model:org-value="batchInput.skuSn"
                                    @callback="onBatchClick"
                                    label="商品编码"
                                >
                                    <div class="flex flex-align-center flex-justify-center">商品编码</div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <TigInput v-model="row.skuSn" :disabled="disabled" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuTsn" label="商品条形码" width="150" fixed="right">
                            <template #header>
                                <PopForm
                                    :isDirect="true"
                                    :isHover="false"
                                    :max="100"
                                    v-model:org-value="batchInput.skuTsn"
                                    @callback="onBatchClick"
                                    label="商品条形码"
                                >
                                    <div class="flex flex-align-center flex-justify-center">商品条形码</div>
                                </PopForm>
                            </template>
                            <template #default="{ row, $index }">
                                <TigInput v-model="row.skuTsn" :disabled="disabled" />
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-form-item>
        </el-form>
        <el-form-item v-if="totalStock" label="库存" prop="totalStock">
            <TigInput classType="tig-form-input" type="integer" v-model="totalStock" placeholder="请输入商品库存" :disabled="productList.length > 0" />
        </el-form-item>
        <el-dialog v-model="visible" :title="dialogTitle" width="450">
            <div style="padding-top: 20px">
                <el-form ref="formRef" label-width="auto" :model="newAttrState">
                    <el-form-item prop="name" label="属性名称">
                        <TigInput width="100%" v-model="newAttrState.name" />
                        <div class="extra">提示：添加新的商品规格属性类型，会清空规格库存中的所有设置</div>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="visible = false">关闭</el-button>
                    <el-button type="primary" @click="onOk(formRef)"> 确定 </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import BusinessData from "@/components/multilingual/BusinessData.vue";
import { PopForm } from "@/components/pop-form";
import { Rank, QuestionFilled } from "@element-plus/icons-vue";
import draggable from "vuedraggable";
import { ref, onMounted, watch, computed } from "vue";
import { Modal } from "ant-design-vue";
import { DialogForm } from "@/components/dialog";
import request from "@/utils/request";
import { imageFormat } from "@/utils/format";
import PriceInput from "@/views/product/product/src/PriceInput.vue";
const visible = ref(false);
const props = defineProps({
    attrList: { type: Object, default: { normal: [], spe: [], extra: [] } },
    productList: { type: [Object, Array], default: [] },
    attrChanged: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    action: { type: String, default: "add" },
    attrTplList: {
        type: Array
    }
});
const productFormRef = ref();
const dialogTitle = ref("");
const skuErrorText = defineModel<string>("skuErrorText", { default: "" });
const emit = defineEmits(["update:productList", "update:attrList", "update:attrChanged"]);

const typeId = {
    normal: 0,
    spe: 1,
    extra: 2
};
const attrTplId = ref(null);

const batchInput = ref<any>({});
const attrList = ref<any>(props.attrList);
const productList = ref<any>(props.productList);
const getAttrValue = (attrs: any[], attrName: string) => {
    const attr = attrs.find((attr) => attr.attrName === attrName);
    return attr ? attr.attrValue : "";
};
const totalStock = computed(() => {
    let total = 0;
    for (let i in productList.value) {
        total += Number(productList.value[i].skuStock);
    }
    return total;
});
const isImg = ref<any>(false);
const newAttrState = ref({
    name: "",
    type: ""
});
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
    let price = Number(productList.value[index].skuPrice);
    if (!price) {
        callback(new Error("请输入商品一口价"));
        return;
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
const addAttr = (type: string, index: number) => {
    attrList.value[type][index].attrList.push({
        attrValue: "",
        attrType: (typeId as any)[type],
        attrName: attrList.value[type][index].attrName
    });
};
// 移除属性项
const removeAttr = (type: string, index: number, idx: number) => {
    attrList.value[type][index].attrList.splice(idx, 1);
    // 重新计算 productList
    productList.value = getProductForm();
};
// 移除类型
const removeAttrList = (type: string, index: number) => {
    attrList.value[type].splice(index, 1);
    // 重新计算 productList
    productList.value = getProductForm();
};
// 新增类型
const addAttrList = (type: string, title: string) => {
    visible.value = true;
    dialogTitle.value = title;
    newAttrState.value.name = "";
    newAttrState.value.type = type;
};
const addAttrSpeList = (type: string) => {
    attrList.value[type].push({
        attrName: "",
        attrList: [
            {
                attrType: (typeId as any)[type],
                attrName: "",
                attrValue: ""
            }
        ]
    });
};
// 添加图片
const addPic = (result: any, data: any) => {
    attrList.value[data.type][data.index].attrList[data.idx].attrPic = result[0].picUrl;
    attrList.value[data.type][data.index].attrList[data.idx].attrPicThumb = result[0].picThumb;
};
// 移除图片
const removePic = (type: string, index: number, idx: number) => {
    attrList.value[type][index].attrList[idx].attrPic = "";
    attrList.value[type][index].attrList[idx].attrPicThumb = "";
};
//导入模板
const importAttrTpl = () => {
    Modal.confirm({
        title: "导入模板会清空并重置已设置的属性、规格、规格库存等设置，确认导入吗？",
        async onOk() {
            request({
                url: "product/productAttributesTpl/detail?id=" + attrTplId.value,
                method: "get"
            }).then((result: any) => {
                let data = result.tplData;
                for (let type in data) {
                    attrList.value[type] = [];
                    for (let i in data[type]) {
                        attrList.value[type].push({
                            attrName: data[type][i].attrName,
                            attrList: [
                                {
                                    attrValue: "",
                                    attrType: (typeId as any)[type],
                                    attrName: data[type][i].attrName
                                }
                            ]
                        });
                    }
                }
            });
        }
    });
};
// 批量操作：
const onBatchClick = () => {
    let i = 1;
    for (let index in productList.value) {
        if (batchInput.value.skuStock) productList.value[index].skuStock = batchInput.value.skuStock;
        if (batchInput.value.skuSn) productList.value[index].skuSn = batchInput.value.skuSn + "-" + i;
        if (batchInput.value.skuTsn) productList.value[index].skuTsn = batchInput.value.skuTsn + "-" + i;
        if (batchInput.value.skuPrice) productList.value[index].skuPrice = batchInput.value.skuPrice;
        i++;
    }
};
// 添加属性名称
const formRef = ref();
const onOk = (e: any) => {
    e.validate((valid: any) => {
        if (valid) {
            let isDuplicated = attrList.value[newAttrState.value.type].find((obj: any) => obj.attrName === newAttrState.value.name);
            if (isDuplicated) {
                Modal.error({
                    title: "属性名称“" + newAttrState.value.name + "”已存在"
                });
                return;
            }
            attrList.value[newAttrState.value.type].push({
                attrName: newAttrState.value.name,
                attrList: [
                    {
                        attrType: (typeId as any)[newAttrState.value.type],
                        attrName: newAttrState.value.name,
                        attrValue: ""
                    }
                ]
            });
            visible.value = false;
            dialogTitle.value = "";
        }
    });
};
const productForm = ref<any>([]);
const getProductForm = () => {
    if (attrList.value["spe"].length == 0) {
        return [];
    }
    let list = getCombinations(attrList.value["spe"]);
    let res: any[] = [];
    for (let idx in list) {
        res[idx] = {
            attrNames: [],
            attrValues: [],
            attrs: []
        };
        let arr = [];
        for (let i in list[idx]) {
            res[idx].attrs[i] = {
                attrName: list[idx][i].attrName,
                attrValue: list[idx][i].attrValue
            };
            arr.push(list[idx][i].attrName + ":" + list[idx][i].attrValue);
            res[idx].attrNames.push(list[idx][i].attrName);
            res[idx].attrValues.push(list[idx][i].attrValue);
            res[idx].skuStock = res[idx].skuStock;
        }
        res[idx].skuValue = arr.join("|");
        // 匹配已存在的值
        const match = productList.value.find((item: any) => {
            return res[idx].skuValue == item.skuValue;
        });
        if (match) {
            res[idx].skuStock = match.skuStock;
            res[idx].skuSn = match.skuSn;
            res[idx].skuTsn = match.skuTsn;
            res[idx].skuPrice = match.skuPrice;
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

function getCombinations(attrList: any[]): any[] {
    const combinations: any[] = [];
    if (attrList.length === 0) {
        skuErrorText.value = "";
        combinations.push([]);
        return combinations;
    }
    attrList.map((item: any) => {
        if (item.attrList.length > 0) {
            item.attrList.map((attr: any) => {
                attr.attrName = item.attrName;
            });
        }
    });
    const firstAttr = attrList[0];
    const remainingAttrs = attrList.slice(1);
    for (let i = 0; i < firstAttr.attrList.length; i++) {
        const currentCombination = [firstAttr.attrList[i]];
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
        position: relative;
        .title {
            margin-bottom: 10px;
            // width: 100px;
            .label {
                // width: 100px;
                text-align: right;
            }
        }
        .attr-extra-value {
            margin-left: 85px;
        }
        .btn-remove5 {
            position: absolute;
            top: 10px;
            right: 10px;
            color: #fff;
            background-color: #7b7b7b;
            width: 18px;
            height: 18px;
            line-height: 14px;
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
            .btn-remove5 {
                opacity: 1;
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
            line-height: 14px;
            text-align: center;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            z-index: 10;
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

    .attr-normal-box {
        position: relative;
        .title-box {
            background-color: #f7f8fa;
            padding: 10px;
            margin-bottom: 10px;
            .tit-value {
                display: flex;
                align-items: center;
                .btn-remove3 {
                    margin-left: 10px;
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
            }
        }
        .attr-normal-value {
            margin-left: 65px;
        }
        &:hover {
            .btn-remove3 {
                opacity: 1 !important;
            }
        }
    }
}
.other-attr {
    .attr-warp-title {
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
