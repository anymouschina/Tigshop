<template>
    <div class="attr-form">
        <el-form-item label="商品规格" v-if="attrList.spe.length > 0">
            <div class="attr-list">
                <div class="attr-warp" v-for="(item, index1) in attrList.spe">
                    <div v-if="!disabled" class="btn-remove" @click="removeAttrList('spe', index1)">
                        <i class="iconfont icon-cha1"></i>
                    </div>
                    <div class="attr-warp-title">
                        <div class="flex align-center">
                            <div class="label">规格名：</div>
                            <div>
                                <TigInput
                                    v-model="item.attrName"
                                    style="margin-right: 20px"
                                    width="250px"
                                    :disabled="disabled"
                                    @blur="dragEnd"
                                    placeholder="请输入规格项，如颜色、尺码、大小"
                                />
                                <div class="extra mt10">该商品为供应商商品，暂不支持修改规格</div>
                            </div>
                        </div>
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
                                        <TigInput
                                            v-model="element.attrValue"
                                            placeholder="请输入规格值，如：白色"
                                            width="250px"
                                            :disabled="disabled"
                                            :suffix-icon="Rank"
                                        />
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
                                                <div class="pic-select" v-else>
                                                    <div class="pic-select-img">
                                                        <img v-if="element.attrPicThumb" :src="imageFormat(element.attrPicThumb)" />
                                                    </div>
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
        <el-form ref="productFormRef" :model="productList" label-width="100px" name="form_in_modal">
            <el-form-item label="规格明细" prop="productList">
                <div class="lyecs-form-table">
                    <el-table :data="productList" style="width: 100%">
                        <el-table-column v-if="productForm.length > 0" v-for="attr in productForm[0].attrs" prop="attrs" :label="attr.attrName" align="center">
                            <template #default="{ row, $index }">
                                {{ getAttrValue(row.attrs, attr.attrName) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuSn" label="商品编码" fixed="right" align="center" min-width="120">
                            <template #default="{ row, $index }">
                                {{ row.skuSn || "-" }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuTsn" label="商品条形码" fixed="right" align="center" min-width="100">
                            <template #default="{ row, $index }">
                                {{ row.skuTsn || "-" }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="supplyPrice" label="供货价" fixed="right" align="center" min-width="100">
                            <template #default="{ row, $index }">
                                {{ row.supplyPrice || "-" }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuPrice" label="售价" fixed="right" min-width="120">
                            <template #default="{ row, $index }">
                                <el-form-item label="" :prop="`productList.${$index}.skuPrice`" :rules="[{ required: true, validator: validatePrice }]">
                                    <TigInput
                                        type="decimal"
                                        v-model="row.skuPrice"
                                        @focus="_getVendorMaxPrice($index, row.vendorProductSkuId)"
                                        :max="row.maxPrice"
                                    >
                                        <template #append> {{ config.dollarSign }} </template>
                                    </TigInput>
                                </el-form-item>
                            </template>
                        </el-table-column>
                        <el-table-column prop="skuStock" label="库存" fixed="right" align="center" min-width="100">
                            <template #header>
                                <div class="flex flex-align-center flex-justify-center">库存</div>
                            </template>
                            <template #default="{ row, $index }">
                                {{ row.skuStock }}
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
import { ref, onMounted, watch, computed } from "vue";
import { Modal } from "ant-design-vue";
import { DialogForm } from "@/components/dialog";
import request from "@/utils/request";
import { imageFormat } from "@/utils/format";
import PriceInput from "@/views/product/product/src/PriceInput.vue";
import { getVendorMaxPrice } from "@/api/vendor/product";
import { useConfigStore } from "@/store/config";
const config = useConfigStore().config;
const visible = ref(false);
const props = defineProps({
    attrList: { type: Object, default: { normal: [], spe: [], extra: [] } },
    productList: { type: [Object, Array], default: [] },
    attrChanged: { type: Boolean, default: false },
    disabled: { type: Boolean, default: true },
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
    let maxPrice = Number(productList.value[index].maxPrice);
    let supplyPrice = Number(productList.value[index].supplyPrice);
    if (!price) {
        callback(new Error("请输入商品售价"));
        return;
    } else if (price > maxPrice) {
        callback(new Error("价格最大不可超过" + maxPrice));
        return;
    } else if (price < supplyPrice) {
        callback(new Error("售价不可小于供货价" + supplyPrice));
        return;
    } else {
        callback();
    }
};
const _getVendorMaxPrice = async (index: number, vendorProductSkuId: any) => {
    try {
        const result = await getVendorMaxPrice({ vendorProductSkuId });
        console.log(result);
        productList.value[index].maxPrice = result;
    } catch (error: any) {
        console.log(error);
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
            // if (list[idx][i].attrName == "") {
            //     continue;
            // }
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
        // console.log("处理后：", res[idx]);
        // console.log("接口返回的数据第一条：", productList.value[0]);
        // 匹配已存在的值
        const match = productList.value.find((item: any) => {
            return res[idx].skuValue == item.skuValue;
        });
        if (match) {
            res[idx].skuStock = match.skuStock;
            res[idx].skuSn = match.skuSn;
            res[idx].skuTsn = match.skuTsn;
            res[idx].skuPrice = match.skuPrice;
            res[idx].supplyPrice = match.supplyPrice;
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
</style>
