<template>
    <el-form-item :rules="[{ required: true, validator: validateName }]" class="inner-item" label="商品名称" prop="productName">
        <BusinessData
            v-model:modelValue="formState.productName"
            :dataId="id"
            :dataType="2"
            :disabled="examine == 1"
            :maxlength="100"
            width="390px"
            placeholder="请输入商品名称"
        ></BusinessData>
    </el-form-item>
    <el-form-item :rules="[{ required: true, validator: validateImg }]" label="商品图片" prop="galleries">
        <FormAddGallery v-if="!loading" v-model:photos="formState.galleries" :disabled="examine == 1" :isMultiple="true"></FormAddGallery>
        <div class="extra">您可以通过拖拽来调整相册图片顺序，第一张图将作为商品主图展示</div>
    </el-form-item>
    <el-form-item label="商品视频" prop="video">
        <FormAddGalleryVideo v-if="!loading" v-model:video="formState.video" :disabled="examine == 1"></FormAddGalleryVideo>
        <div class="extra">如有商品视频则商品视频作为商品主图展示</div>
    </el-form-item>
    <el-form-item class="inner-item" label="商品品牌" prop="brandId">
        <SelectBrand v-if="!loading" v-model:brandId="formState.brandId" :disabled="examine == 1" style="width: 200px"></SelectBrand>
    </el-form-item>
    <el-form-item :rules="[{ required: true, message: '请选择商品类目!', validator: validateCate }]" class="inner-item" label="商品类目" prop="productCategoryId">
        <div class="flex flex-justify-between">
            <SelectCategory
                v-if="!loading"
                ref="selectCategory"
                v-model:categoryId="formState.productCategoryId"
                :disabled="examine == 1"
                :multiple="false"
                style="width: 200px"
            ></SelectCategory>
            <div v-if="examine != 1" class="con-btn">
                <template v-if="adminType === 'admin'">
                    <DialogForm
                        :params="{ act: 'add', parentId: 0 }"
                        isDrawer
                        path="product/category/Info"
                        title="添加分类"
                        width="600px"
                        @okCallback="refreshCategory"
                    >
                        <el-button link type="primary">新建</el-button>
                    </DialogForm>
                    <p class="ml10 mr10" style="margin-bottom: 3px">|</p>
                </template>
                <el-button :loading="configLoading" link type="primary" @click="refreshCategory">刷新 </el-button>
            </div>
        </div>
    </el-form-item>
    <el-form-item class="inner-item" label="商品编码" prop="productSnGenerateType">
        <el-radio-group v-model="formState.productSnGenerateType" :disabled="examine == 1" style="width: 100%">
            <el-radio :value="1">系统生成</el-radio>
            <el-radio :value="2">手动输入</el-radio>
        </el-radio-group>
    </el-form-item>
    <el-form-item class="inner-item" extra="" label="商品描述" prop="productBrief">
        <div>
            <TigInput
                v-model="formState.productBrief"
                :disabled="examine == 1"
                :rows="2"
                classType="tig-form-input"
                placeholder="例如：顺丰快递 又快又好"
                type="textarea"
            ></TigInput>
            <div class="extra">该描述一般会高亮出现在商品名称后面</div>
        </div>
    </el-form-item>
    <el-form-item class="inner-item" label="商品状态" prop="productState">
        <el-radio-group v-model="formState.productState" :disabled="examine == 1" style="width: 100%">
            <el-radio :value="1">在售</el-radio>
            <el-radio :value="0">断供</el-radio>
        </el-radio-group>
        <div class="extra">选择在售时，商品新增成功时会自动进入总后台进行审核，审核通过后，店铺才可进行售卖</div>
    </el-form-item>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { FormAddGallery, FormAddGalleryVideo } from "@/components/gallery";
import { ProductFormState } from "@/types/vendor/product.d";
import { getParticiple } from "@/api/vendor/product";
import { RadioType } from "@/components/radio";
import { SelectBrand, SelectCategory, SelectShopProductCategory } from "@/components/select";
import { DialogForm } from "@/components/dialog";
import BusinessData from "@/components/multilingual/BusinessData.vue";
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
    examine: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    },
    action: {
        type: String,
        default: ""
    }
});
const formState = defineModel<ProductFormState>("formState", { default: {} });
const radioList = ref<any[]>([]);
onMounted(async () => {
    if (isPro()) {
        radioList.value = [
            { key: 1, title: "普通商品", desc: "物流配送" },
            {
                key: 3,
                title: "卡密商品",
                tips: "可以在菜单中【营销>电子卡券组】创建卡券组，然后在【查看卡列表】添加单个卡密或通过下载【批量导入模板文件】填好卡密后在通过批量导入电子卡券按钮上传该文件批量导入。",
                desc: "无需物流"
            },
            {
                key: 2,
                title: "虚拟商品",
                tips: "网盘链接、视频链接，在添加商品添加虚拟商品。用户购买后将在订单详情直接展示。",
                desc: "无需物流"
            },
            {
                key: 4,
                title: "付费内容",
                tips: "软件授权、在线课程等。通过简单的操作，即可将这些商品添加到您的商店中，为客户提供更丰富的选择。立即体验，享受便捷的付费内容管理服务。",
                desc: "无需物流"
            }
        ];
    } else {
        radioList.value = [{ key: 1, title: "普通商品" }];
    }
});
// 会员名称
const validateName = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("商品名称不能为空"));
        return;
    } else {
        callback();
    }
};
const validateImg = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("请选择商品图片"));
        return;
    } else {
        callback();
    }
};
const validateCate = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("请选择商品类目"));
        return;
    } else {
        callback();
    }
};
const validateCardGroup = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("请选择电子卡券组"));
        return;
    } else {
        callback();
    }
};

const configLoading = ref(false);
const selectCategory = ref<any>();
const refreshCategory = async () => {
    configLoading.value = true;
    try {
        selectCategory.value.loaded = false;
        await selectCategory.value.loadCategory();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        setTimeout(() => {
            configLoading.value = false;
        }, 200);
    }
};

const onGetParticiple = async () => {
    try {
        const result = await getParticiple({ productName: formState.value.productName });
        formState.value.keywords = result;
    } catch (error: any) {
        message.error(error.message);
    }
};
</script>
<style lang="less" scoped>
.con-btn {
    display: flex;
    align-content: center;
    padding-left: 10px;

    span {
        color: #999;
    }

    a {
        display: block;
        word-break: keep-all;
        padding: 0 5px;
    }
}

.rank {
    display: flex;
    width: 100%;
    flex-wrap: wrap; /* 允许项目换行 */
    justify-content: flex-start; /* 项目在主轴上的对齐方式 */
}

.keywords {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
}
</style>
