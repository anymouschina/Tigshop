<template>
    <div class="product-container">
        <div class="anchor">
            <el-anchor :container="containerRef" :offset="10" direction="horizontal" @change="onChange" @click="handleClick">
                <div class="tab-row">
                    <el-anchor-link
                        v-for="(item, index) in tabList"
                        :key="item.id"
                        :class="{ active: partTab === '' && index === 0 ? true : partTab === '#' + item.id }"
                        :href="'#' + item.id"
                    >
                        <template #default>
                            <div :class="{ active: partTab === '' && index === 0 ? true : partTab === '#' + item.id }" class="item">
                                {{ item.title }}
                            </div>
                        </template>
                    </el-anchor-link>
                </div>
            </el-anchor>
        </div>
        <div ref="containerRef" class="form-container">
            <el-form v-if="!loading" ref="formRef" :model="formState" label-width="110px" name="form_in_modal">
                <div id="part1" class="form-warp">
                    <div class="title">
                        <p class="xian"></p>
                        基本信息
                    </div>
                    <BasicInfo :id="id" :shopId="shopId" :examine="examine" :loading="loading" :action="action" v-model:form-state="formState"></BasicInfo>
                </div>
                <div id="part2" class="form-warp">
                    <div class="title">
                        <p class="xian"></p>
                        价格及库存
                    </div>
                    <PriceInfo ref="priceInfoRef" :id="id" :act="act" :examine="examine" :loading="loading" v-model:form-state="formState"></PriceInfo>
                </div>

                <div id="part3" class="form-warp">
                    <div class="title">
                        <p class="xian"></p>
                        商品详情
                    </div>
                    <DescInfo :id="id" :examine="examine" :loading="loading" v-model:formState="formState"></DescInfo>
                </div>
            </el-form>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef, nextTick, watch } from "vue";
import { BasicInfo, PriceInfo, DescInfo } from "@/views/vendor/supplier/product/src/components";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { ProductFormState, ServiceList } from "@/types/vendor/product.d";
import { getProduct, updateProduct } from "@/api/vendor/product";
import { isPro } from "@/utils/version";
import { getAdminType } from "@/utils/storage";
const adminType = getAdminType();
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close", "closeConfirm"]);
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    shopId: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    examine: {
        type: Number,
        default: 0
    },
    isDialog: Boolean
});
const tabList = [
    {
        title: "基本信息",
        id: "part1"
    },
    {
        title: "价格及库存",
        id: "part2"
    },
    {
        title: "商品详情",
        id: "part3"
    }
];

const containerRef = ref<HTMLElement | null>(null);
const partTab = ref("");
const handleClick = (e: MouseEvent) => {
    e.preventDefault();
};
const onChange = (e: string) => {
    partTab.value = e;
};
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : action.value === "copy" ? "copy" : "update";
const formRef = shallowRef();
const formState = ref<ProductFormState>({
    productType: 1,
    productState: 1,
    skuType: 1,
    productDesc: [],
    productSnGenerateType: 1,
    video: [],
    skus: [],
    skuAttrs: []
});
onMounted(async () => {
    if (action.value === "detail" || action.value === "copy" || action.value === "again") {
        // 获取详情数据
        await fetchProduct();
    } else {
        loading.value = false;
    }
    if (props.examine !== 1) {
        setTimeout(() => {
            emit("closeConfirm", true);
        }, 10000);
    }
});

const fetchProduct = async () => {
    try {
        const result = await getProduct("detail", { id: id.value });
        if (result.video == null) {
            result.video = [];
        }
        if (result.brandId == 0) {
            result.brandId = "";
        }
        console.log("详情数据:", result.skus);
        Object.assign(formState.value, result, result);
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};

function validateSkus(skus: any) {
    for (let i = 0; i < skus.length; i++) {
        const sku = skus[i];
        if (sku.skuStock === null || sku.skuStock === undefined) {
            console.error("请填写完整的规格信息");
            return false;
        }
    }
    return true;
}

const priceInfoRef = ref<any>();
// 表单通过验证后提交
const onSubmit = async () => {
    console.log("表单提交:", formState.value); 
    formState.value.skus.forEach((item:any) => {
        console.log(item); 
        if(item.skuWeight || item.supplyPrice) {
            item.skuWeight = Number(item.skuWeight)
            item.supplyPrice = Number(item.supplyPrice)
        }    
    })
    
    try {
        await formRef.value.validate();
        if (!validateSkus(formState.value.skus)) {
            message.error("请将商品规格的信息填写完整!");
            priceInfoRef.value.skuErrorText = "请将商品规格的信息填写完整";
            await nextTick();
            scrollIntoError(".sku-error");
        } else {
            priceInfoRef.value.skuErrorText = "";
        }
        await priceInfoRef.value.attrForm.validateProductSku();
        try {
            emit("update:confirmLoading", true);
            const result = await updateProduct(operation, { ...formState.value });
            emit("submitCallback", result);
            message.success(result as any);
        } catch (error: any) {
            message.error(error.message);
        } finally {
            console.log("提交完成");
            emit("update:confirmLoading", false);
        }
    } catch (error) {
        await nextTick();
        scrollIntoError();
        console.error("表单验证失败:", error);
    }
};

const scrollIntoError = (selector = ".el-form-item.is-error") => {
    const errorElement = document.querySelector(selector);
    if (errorElement) {
        errorElement.scrollIntoView({
            behavior: "instant",
            block: "center"
        });
        const inputElement = errorElement.querySelector("input, textarea, select");
        if (inputElement) {
            inputElement?.focus();
        }
    }
};

// 表单提交
const onFormSubmit = () => {
    onSubmit();
};
defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.product-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-anchor__marker) {
        display: none !important;
        opacity: 0 !important;
        z-index: -10 !important;
    }

    .inner-item {
        :deep(.el-textarea) {
            width: 450px;
        }

        :deep(.el-select) {
            width: 450px;
        }
    }

    .anchor {
        padding-bottom: 10px;
        background-color: #fff;

        .tab-row {
            display: flex;
            width: 100%;
            height: 38px;
            box-sizing: border-box;

            :deep(.el-anchor__item) {
                height: 100%;
                flex: 1;
                background-color: var(--tig-item-active-bg);
                color: #314f73;
                margin-right: -10px;
                padding-left: 10px;
                clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%);

                &:first-child {
                    padding-left: 0;
                    clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%);
                }

                &:last-child {
                    margin-right: 0 !important;
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 15px 50%);
                }
            }

            :deep(.el-anchor__link) {
                height: 100%;
                width: 100%;
            }

            .item {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
            }

            .active {
                color: #fff;
                background-color: var(--tig-primary);
            }
        }
    }

    .form-container {
        flex: 1;
        overflow-y: auto;

        .title {
            background-color: #f5f7fa;
            font-size: 14px;
            font-weight: bold;
            padding: 12px 10px;
            display: flex;
            align-items: center;
            margin-bottom: 20px;

            .xian {
                width: 3px;
                height: 14px;
                background-color: var(--tig-primary);
                margin-right: 5px;
            }
        }

        .form-warp {
            margin-top: 10px;
        }
    }

    /* 隐藏滚动条 */

    .form-container::-webkit-scrollbar {
        display: none; /* 对于 WebKit 浏览器（如 Chrome 和 Safari） */
    }
    .fixed-shipping-type {
        position: relative;
        .extra {
            position: absolute;
        }
        :deep(.el-form-item__error) {
            // padding-top: 22px !important;
        }
    }
}

@media (max-width: 768px) {
    .inner-item {
        :deep(.el-textarea) {
            width: 100% !important;
        }

        :deep(.el-select) {
            min-width: 0 !important;
            width: 100% !important; /* 如果需要宽度100% */
        }
    }
}
</style>
