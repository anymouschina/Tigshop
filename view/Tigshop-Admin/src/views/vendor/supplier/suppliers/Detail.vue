<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <a-spin :spinning="loading">
                        <el-tabs v-model="activeName" class="demo-tabs">
                            <el-tab-pane label="基础信息" name="desc">
                                <el-form-item label="供应商状态">
                                    <Switch
                                        v-model:checked="formState.status"
                                        :switchingCode="[1, 2]"
                                        :params="{ id: id, field: 'status' }"
                                        :requestApi="updateSuppliersField"
                                        @callback="updateData"
                                    />
                                </el-form-item>
                                <el-form-item label="供应商名称">
                                    {{ formState.vendorName || "--" }}
                                </el-form-item>
                                <el-form-item label="入驻资质"> {{ formState.type == 1 ? "个人" : "企业" }}入驻 </el-form-item>
                                <el-form-item label="企业名称" v-if="formState.type == 2">
                                    {{ formState.vendorData.companyName || "--" }}
                                </el-form-item>
                                <el-form-item label="联系人姓名">
                                    {{ formState.vendorData.contactName || "--" }}
                                </el-form-item>
                                <el-form-item label="联系人手机">
                                    {{ formState.vendorData.contactPhone || "--" }}
                                </el-form-item>
                                <el-form-item label="联系人邮箱">
                                    {{ formState.vendorData.contactEmail || "--" }}
                                </el-form-item>
                                <el-form-item v-if="formState.vendorData.additionalImg.length > 0" label="补充信息">
                                    <div>
                                        <div class="image-box">
                                            <template v-for="item in formState.vendorData.additionalImg">
                                                <Image class="image" :src="imageFormat(item.picUrl)" fit="contain" style="height: 100px; width: 100px" />
                                            </template>
                                        </div>
                                        <div class="extra">开户许可证或者基本存款账户任</div>
                                    </div>
                                </el-form-item>
                            </el-tab-pane>
                            <el-tab-pane label="企业信息" name="enterprise" v-if="formState.type == 2">
                                <el-form-item label="企业名称">
                                    {{ formState.vendorData.companyName || "--" }}
                                </el-form-item>
                                <el-form-item label="注册地址">
                                    {{ formState.vendorData.licenseAddrProvinceStr || "--" }}
                                </el-form-item>
                                <el-form-item label="详细地址">
                                    {{ formState.vendorData.businessLicenseAddress || "--" }}
                                </el-form-item>
                                <el-form-item label="经营范围">
                                    {{ formState.vendorData.businessScope || "--" }}
                                </el-form-item>
                                <el-form-item label="统一社会信用代码">
                                    {{ formState.vendorData.businessLicenseId || "--" }}
                                </el-form-item>
                                <el-form-item label="营业期限">
                                    <div class="width100">
                                        <template v-if="formState.vendorData.operatingTermType == 1">
                                            {{ formState.vendorData.operatingTermTypeDate[0] + " ～  " + formState.vendorData.operatingTermTypeDate[1] }}
                                        </template>
                                        <template v-else> {{ formState.vendorData.operatingTermTypeEnd }} ～长期 </template>
                                    </div>
                                </el-form-item>
                            </el-tab-pane>
                            <el-tab-pane :label="formState.type == 1 ? '个人' : '法人' + '信息'" name="legalPerson">
                                <el-form-item :label="formState.type == 1 ? '个人' : '法人' + '姓名'">
                                    {{ formState.personData.documentName || "--" }}
                                </el-form-item>
                                <el-form-item label="证件类型">
                                    <div class="width100">
                                        {{ documentTypeOptions.find((option) => option.value === formState.personData.documentType)?.label || "" }}
                                    </div>
                                </el-form-item>
                                <el-form-item label="证件号码">
                                    {{ formState.personData.documentNumber || "--" }}
                                </el-form-item>
                                <el-form-item label="居住地址">
                                    <div class="width100">{{ formState.personData.residentialAddress || "--" }}</div>
                                </el-form-item>
                                <el-form-item label="证件有效期">
                                    <div class="width100" v-if="formState.personData.certificateValidityPeriodDate">
                                        <template v-if="formState.personData.certificateValidityPeriod == 1">
                                            {{
                                                formState.personData.certificateValidityPeriodDate[0] +
                                                " ～ " +
                                                formState.personData.certificateValidityPeriodDate[1]
                                            }}
                                        </template>
                                        <template v-else> {{ formState.personData.certificateValidityPeriodEnd }} ～ 长期 </template>
                                    </div>
                                </el-form-item>
                                <el-form-item label="证件照正面">
                                    <div class="image-box">
                                        <Image
                                            class="image"
                                            :src="imageFormat(formState.personData.frontOfPhoto)"
                                            fit="contain"
                                            style="height: 100px; width: 100px"
                                        />
                                    </div>
                                </el-form-item>
                                <el-form-item label="证件照反面">
                                    <div class="image-box">
                                        <Image
                                            class="image"
                                            :src="imageFormat(formState.personData.backOfPhoto)"
                                            fit="contain"
                                            style="height: 100px; width: 100px"
                                        />
                                    </div>
                                </el-form-item>
                                <el-form-item v-if="formState.personData.additionalImg.length > 0" label="补充信息">
                                    <div class="image-box">
                                        <template v-for="item in formState.personData.additionalImg">
                                            <Image class="image" :src="imageFormat(item.picUrl)" fit="contain" style="height: 100px; width: 100px" />
                                        </template>
                                    </div>
                                </el-form-item>
                            </el-tab-pane>
                            <el-tab-pane label="供应商信息" name="supplier">
                                <el-form-item label="供应商logo">
                                    <div class="image-box">
                                        <Image class="image" :src="imageFormat(formState.vendorLogo)" fit="contain" style="height: 100px; width: 100px" />
                                    </div>
                                </el-form-item>
                                <el-form-item label="客服电话">
                                    {{ formState.vendorData.customerServicePhone || "--" }}
                                </el-form-item>
                                <el-form-item label="供应商地址">
                                    {{ formState.vendorData.vendorAddressStr || "--" }}
                                </el-form-item>
                                <el-form-item label="详细地址">
                                    {{ formState.vendorData.detailedAddress || "--" }}
                                </el-form-item>
                                <el-form-item label="联系人姓名">
                                    {{ formState.vendorData.contactName || "--" }}
                                </el-form-item>
                                <el-form-item label="联系人手机">
                                    {{ formState.vendorData.contactPhone || "--" }}
                                </el-form-item>
                                <el-form-item label="联系人邮箱">
                                    {{ formState.vendorData.contactEmail || "--" }}
                                </el-form-item>
                                <el-form-item label="开户银行">
                                    {{ formState.vendorData.bankDeposit || "--" }}
                                </el-form-item>
                                <el-form-item label="支行名称">
                                    {{ formState.vendorData.bankBranch || "--" }}
                                </el-form-item>
                                <el-form-item label="对公银行账户">
                                    {{ formState.vendorData.bankCard || "--" }}
                                </el-form-item>
                            </el-tab-pane>
                            <el-tab-pane label="管理列表" name="administrators">
                                <SupplersUserAdmin type="detail" :vendorId="id"></SupplersUserAdmin>
                            </el-tab-pane>
                        </el-tabs>
                    </a-spin>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { Switch } from "@/components/list";
import { SuppliersFormState } from "@/types/vendor/suppliers";
import { getSuppliers, updateSuppliersField } from "@/api/vendor/suppliers";
import { imageFormat } from "@/utils/format";
import { Image } from "@/components/image";
import SupplersUserAdmin from "@/views/vendor/setting/adminUser/List.vue";
const radioList = [
    { key: 2, title: "企业", desc: "有限公司/有限责任公司等" },
    { key: 1, title: "个人", desc: "无营业执照" }
];
//证件类型
const documentTypeOptions = [
    {
        value: 1,
        label: "大陆身份证"
    },
    {
        value: 2,
        label: "护照（限境外人士）"
    },
    {
        value: 3,
        label: "来往内地通行证（中国香港居民）"
    },
    {
        value: 4,
        label: "来往内地通行证（中国澳门居民）"
    },
    {
        value: 5,
        label: "来往大陆通行证（中国台湾居民）"
    }
];
const activeName = ref("desc");
// 父组件回调
const emit = defineEmits(["callback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<SuppliersFormState>({
    type: 2,
    vendorLogo: "",
    vendorData: {
        vendorName: "",
        customerServicePhone: "",
        vendorAddress: [],
        detailedAddress: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        bankDeposit: "",
        bankBranch: "",
        bankCard: "",
        additionalImg: [],
        companyName: "",
        licenseAddrProvince: [],
        businessLicenseAddress: "",
        businessScope: "",
        businessLicenseId: "",
        operatingTermType: 1,
        operatingTermTypeDate: [],
        operatingTermTypeEnd: ""
    },
    personData: {
        documentType: "",
        documentName: "",
        documentNumber: "",
        birthday: "",
        certificateValidityPeriod: 1,
        certificateValidityPeriodDate: [],
        residentialAddress: "",
        sex: 1,
        frontOfPhoto: "",
        backOfPhoto: "",
        additionalImg: []
    },
    vendorName: ""
});

watch(
    () => formState.value.type,
    (val) => {
        activeName.value = "desc";
    }
);
const fetchSuppliers = async () => {
    try {
        const result = await getSuppliers(action.value, { id: id.value });
        Object.assign(formState.value, result);
        // @ts-expect-error
        formState.value.personData.certificateValidityPeriodEnd = formState.value.personData.certificateValidityPeriodDate[0]
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchSuppliers();
    } else {
        loading.value = false;
    }
});

const updateData = (data: any) => {
    emit("callback", true);
};
</script>
<style lang="less" scoped>
.content_wrapper {
    padding: 10px 20px;
}
.image-box {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    .image {
        border: 1px solid #e4e7ed;
    }
}
</style>
