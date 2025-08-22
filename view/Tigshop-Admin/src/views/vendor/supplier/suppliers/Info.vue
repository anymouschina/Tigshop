<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <div class="step-section-item">
                    <div class="step-section-item__label">主体类型</div>
                    <div class="zent-form-control">
                        <RadioType v-model:modelValue="formState.type" :radioList="radioList" :disabled="action == 'detail'" width="170px"></RadioType>
                        <div class="cert-type-desc-principal">
                            <div class="extra" v-if="formState.type == 1">“个人”为根据法律法规和相关规定免于办理工商登记，无营业执照的商家。</div>
                            <div class="extra" v-else>“企业”在营业执照上的主体类型一般为：有限公司、有限责任公司等。</div>
                        </div>
                    </div>
                </div>
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="130px">
                    <el-form-item>
                        <template #label> <span class="required">*</span>绑定主账号 </template>
                        <div class="one-item" style="width: 100%">
                            <div class="to-time" style="width: 100%">
                                <el-radio-group v-model="formState.adminData.type">
                                    <el-radio :value="2">管理员</el-radio>
                                </el-radio-group>
                                <el-form-item
                                    style="width: 100%"
                                    :rules="formState.adminData.type == 2 ? [{ required: true, message: '请选择管理员!' }] : []"
                                    label=""
                                    prop="adminData.adminId"
                                >
                                    <el-select
                                        style="width: 300px"
                                        v-model="formState.adminData.adminId"
                                        :disabled="formState.adminData.type !== 2"
                                        filterable
                                        remote
                                        reserve-keyword
                                        placeholder="可输入手机号查询绑定管理员"
                                        :remote-method="remoteMethod"
                                        :loading="loadingVal"
                                    >
                                        <el-option v-for="item in userInfo" :key="item.key" :label="item.label" :value="item.value" />
                                    </el-select>
                                </el-form-item>
                            </div>
                            <div class="to-time">
                                <el-radio-group v-model="formState.adminData.type">
                                    <el-radio :value="1">会&nbsp;&nbsp;&nbsp;&nbsp;员</el-radio>
                                </el-radio-group>
                                <el-form-item
                                    style="width: 100%"
                                    :rules="formState.adminData.type == 1 ? [{ required: true, message: '请选择会员!' }] : []"
                                    label=""
                                    prop="adminData.userId"
                                >
                                    <el-select
                                        style="width: 300px"
                                        v-model="formState.adminData.userId"
                                        :disabled="formState.adminData.type !== 1"
                                        filterable
                                        remote
                                        reserve-keyword
                                        placeholder="可输入手机号查询绑定会员"
                                        :remote-method="remoteMethod"
                                        :loading="loadingVal"
                                    >
                                        <el-option v-for="item in userInfo" :key="item.key" :label="item.label" :value="item.value" />
                                    </el-select>
                                    <DialogForm :params="{ act: 'add' }" isDrawer path="user/user/Info" title="添加会员" width="560px">
                                        <el-button link type="primary" class="ml10">新增会员</el-button>
                                    </DialogForm>
                                </el-form-item>
                            </div>
                        </div>
                        <div class="extra" style="width: 100%; margin-top: 16px">
                            必须绑定一位{{ formState.adminData.type == 2 ? "「管理员」" : "「会员」" }}。
                        </div>
                    </el-form-item>
                    <el-tabs v-model="activeName" class="demo-tabs">
                        <el-tab-pane label="供应商信息" name="first">
                            <el-form-item :rules="[{ required: true, message: '供应商名称不能为空!' }]" label="供应商名称" prop="vendorName">
                                <div>
                                    <TigInput width="260px" v-model="formState.vendorName" placeholder="请输入供应商名称" />
                                    <div class="extra">该名称将在微信支付、支付宝支付时向买家展示</div>
                                </div>
                            </el-form-item>
                            <el-form-item label="供应商logo" prop="vendorLogo">
                                <FormAddGallery v-model:photo="formState.vendorLogo"></FormAddGallery>
                            </el-form-item>
                            <el-form-item label="客服电话" prop="vendorData.customerServicePhone">
                                <TigInput width="260px" v-model="formState.vendorData.customerServicePhone" placeholder="请输入客服电话" />
                                <div class="extra">请注意填写格式，举例（座机：0755-86666666，手机：13512345678，400电话：4008888888）</div>
                            </el-form-item>
                            <el-form-item label="供应商地址" prop="vendorData.vendorAddress">
                                <SelectRegion v-model="formState.vendorData.vendorAddress" style="width: 260px"></SelectRegion>
                            </el-form-item>
                            <el-form-item label="详细地址" prop="vendorData.detailedAddress">
                                <TigInput
                                    classType="tig-form-input"
                                    v-model="formState.vendorData.detailedAddress"
                                    placeholder="请输入详细地址"
                                    :maxlength="50"
                                    showWordLimit
                                />
                                <div class="extra">请填写详细的经营场所地址，如有多个场所，选择一个主要场所填写即可</div>
                            </el-form-item>
                            <el-form-item label="联系人姓名" prop="vendorData.contactName">
                                <TigInput width="260px" v-model="formState.vendorData.contactName" placeholder="请填写联系人姓名" />
                            </el-form-item>
                            <el-form-item label="联系人手机" prop="vendorData.contactPhone">
                                <div>
                                    <TigInput width="260px" v-model="formState.vendorData.contactPhone" placeholder="请填写联系人手机" />
                                </div>
                            </el-form-item>
                            <el-form-item label="联系人邮箱" prop="vendorData.contactEmail">
                                <TigInput width="260px" v-model="formState.vendorData.contactEmail" placeholder="请填写联系人邮箱" />
                            </el-form-item>
                            <el-form-item label="开户银行" prop="vendorData.bankDeposit">
                                <TigInput width="260px" v-model="formState.vendorData.bankDeposit" placeholder="请填写开户银行" />
                            </el-form-item>
                            <el-form-item label="支行名称" prop="vendorData.bankBranch">
                                <TigInput classType="tig-form-input" v-model="formState.vendorData.bankBranch" placeholder="请填写开户银行支行名称" />
                            </el-form-item>
                            <el-form-item label="银行卡号" prop="vendorData.bankCard">
                                <TigInput width="260px" v-model="formState.vendorData.bankCard" placeholder="请填写银行卡号" />
                            </el-form-item>
                            <el-form-item label="补充信息" prop="additionalImg">
                                <FormAddGallery :isMultiple="true" v-model:photos="formState.vendorData.additionalImg"></FormAddGallery>
                                <div class="extra">
                                    开户许可证/基本存款账户任选其一上传，信息需与填写的结算账户信息一致，如无法提供，上传银行对公账户开户业务办理回执
                                    ，或网银截图，或企业盖章的对公账户信息文件即可
                                </div>
                            </el-form-item>
                        </el-tab-pane>

                        <el-tab-pane :label="(formState.type == 1 ? '个人' : '法人') + '信息'" name="second">
                            <el-form-item label="证件类型" prop="personData.documentType">
                                <el-select v-model="formState.personData.documentType" placeholder="请选择证件类型" style="width: 260px">
                                    <el-option v-for="item in documentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                                </el-select>
                            </el-form-item>
                            <el-form-item :rules="[{ required: true, message: '请输入姓名!' }]" :label="formState.type == 1 ? '个人姓名' : '法人姓名'" prop="personData.documentName">
                                <TigInput width="260px" v-model="formState.personData.documentName"></TigInput>
                            </el-form-item>
                            <el-form-item label="证件号码" prop="personData.documentNumber">
                                <TigInput width="260px" v-model="formState.personData.documentNumber"></TigInput>
                            </el-form-item>
                            <el-form-item label="出生日期" prop="personData.birthday">
                                <el-date-picker
                                    v-model="formState.personData.birthday"
                                    placeholder="请选择出生日期"
                                    style="width: 260px"
                                    type="date"
                                    value-format="YYYY-MM-DD"
                                />
                            </el-form-item>
                            <el-form-item>
                                <template #label> 证件有效期 </template>
                                <div class="one-item">
                                    <div class="to-time">
                                        <el-radio-group v-model="formState.personData.certificateValidityPeriod">
                                            <el-radio :value="1">区间有效</el-radio>
                                        </el-radio-group>
                                        <el-form-item label="" prop="personData.certificateValidityPeriodDate">
                                            <el-date-picker
                                                v-model="formState.personData.certificateValidityPeriodDate"
                                                :clearable="false"
                                                :disabled="formState.personData.certificateValidityPeriod === 2"
                                                end-placeholder="结束日期"
                                                range-separator="～"
                                                start-placeholder="开始日期"
                                                type="daterange"
                                                value-format="YYYY-MM-DD"
                                            />
                                        </el-form-item>
                                    </div>
                                    <div class="to-time">
                                        <el-radio-group v-model="formState.personData.certificateValidityPeriod">
                                            <el-radio :value="2">长期有效</el-radio>
                                        </el-radio-group>
                                        <el-form-item label="" prop="personData.certificateValidityPeriodEnd">
                                            <el-date-picker
                                                v-model="formState.personData.certificateValidityPeriodEnd"
                                                :clearable="false"
                                                :disabled="formState.personData.certificateValidityPeriod === 1"
                                                placeholder="请选择日期"
                                                style="width: 168px"
                                                type="date"
                                                value-format="YYYY-MM-DD"
                                            />
                                            <span class="ml10">～ 长期</span>
                                        </el-form-item>
                                    </div>
                                </div>
                            </el-form-item>
                            <el-form-item label="居住地址" prop="personData.residentialAddress">
                                <TigInput
                                    width="100%"
                                    :autosize="{ minRows: 2, maxRows: 6 }"
                                    v-model="formState.personData.residentialAddress"
                                    placeholder="请输入居住地址"
                                    type="textarea"
                                ></TigInput>
                            </el-form-item>
                            <el-form-item label="性别" prop="sex">
                                <el-radio-group v-model="formState.personData.sex">
                                    <el-radio :value="1">男</el-radio>
                                    <el-radio :value="2">女</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="证件照正面" prop="personData.frontOfPhoto">
                                <FormAddGallery v-model:photo="formState.personData.frontOfPhoto"></FormAddGallery>
                                <div class="extra">
                                    <p>如你的证件类型是身份证，请在此处上传人像面，若为复印件，需加盖公司鲜章。注意：证件盖章不支持电子章。</p>
                                    <p>护照需要增加翻译件，加盖公司鲜章，外籍商家姓名需为中文（英文），如张三（Zhangsan）。</p>
                                </div>
                            </el-form-item>
                            <el-form-item label="证件照反面" prop="personData.backOfPhoto">
                                <FormAddGallery v-model:photo="formState.personData.backOfPhoto"></FormAddGallery>
                                <div class="extra">
                                    <p>如你的证件类型是身份证，请在此处上传国徽面，若为复印件，需加盖公司鲜章。注意：证件盖章不支持电子章。</p>
                                    <p>护照需要增加翻译件，加盖公司鲜章，外籍商家姓名需为中文（英文），如张三（Zhangsan）。</p>
                                </div>
                            </el-form-item>
                            <el-form-item label="补充信息">
                                <FormAddGallery :isMultiple="true" v-model:photos="formState.personData.additionalImg"></FormAddGallery>
                                <div class="extra">
                                    <p>在整个申请流程中，遇到需提供资料但无上传入口的情况，都可在此处上传。</p>
                                    <p>必须为彩色图片（文档请截图后上传）。</p>
                                </div>
                            </el-form-item>
                        </el-tab-pane>
                        <el-tab-pane v-if="formState.type == 2" label="企业信息" name="company">
                            <el-form-item
                                :rules="[{ required: true, message: '请输入企业名称!' }]"
                                class="form-item"
                                label="企业名称"
                                prop="vendorData.companyName"
                            >
                                <TigInput width="360px" v-model="formState.vendorData.companyName" :maxlength="50" showWordLimit placeholder="请输入企业名称" />
                            </el-form-item>
                            <el-form-item class="form-item" label="注册地址" prop="vendorData.licenseAddrProvince">
                                <SelectRegion v-if="!loading" v-model="formState.vendorData.licenseAddrProvince" style="width: 260px"></SelectRegion>
                            </el-form-item>
                            <el-form-item label="详细地址" prop="vendorData.businessLicenseAddress">
                                <TigInput
                                    classType="tig-form-input"
                                    v-model="formState.vendorData.businessLicenseAddress"
                                    placeholder="请输入详细地址"
                                    :maxlength="50"
                                    showWordLimit
                                />
                                <div class="extra">注册地址需与营业执照登记地址一致</div>
                            </el-form-item>
                            <el-form-item class="form-item" label="经营范围" prop="vendorData.businessScope">
                                <TigInput
                                    width="100%"
                                    :autosize="{ minRows: 2, maxRows: 6 }"
                                    v-model="formState.vendorData.businessScope"
                                    type="textarea"
                                ></TigInput>
                                <div class="extra">与企业工商营业执照上一致</div>
                            </el-form-item>
                            <el-form-item class="form-item" label="统一社会信用代码" prop="vendorData.businessLicenseId">
                                <TigInput width="100%" v-model="formState.vendorData.businessLicenseId"></TigInput>
                                <div class="extra">请输入营业执照上18位统一社会信用代码</div>
                            </el-form-item>
                            <el-form-item class="form-item">
                                <template #label> 营业期限 </template>
                                <div class="one-item">
                                    <div class="to-time">
                                        <el-radio-group v-model="formState.vendorData.operatingTermType">
                                            <el-radio :value="1">区间有效</el-radio>
                                        </el-radio-group>
                                        <el-form-item label="" prop="vendorData.operatingTermTypeDate">
                                            <el-date-picker
                                                v-model="formState.vendorData.operatingTermTypeDate"
                                                :clearable="false"
                                                :disabled="formState.vendorData.operatingTermType === 2"
                                                end-placeholder="结束日期"
                                                range-separator="～"
                                                start-placeholder="开始日期"
                                                type="daterange"
                                                value-format="YYYY-MM-DD"
                                            />
                                        </el-form-item>
                                    </div>
                                    <div class="to-time">
                                        <el-radio-group v-model="formState.vendorData.operatingTermType">
                                            <el-radio :value="2">长期有效</el-radio>
                                        </el-radio-group>
                                        <el-form-item label="" prop="vendorData.operatingTermTypeEnd">
                                            <el-date-picker
                                                v-model="formState.vendorData.operatingTermTypeEnd"
                                                :clearable="false"
                                                :disabled="formState.vendorData.operatingTermType === 1"
                                                placeholder="请选择日期"
                                                style="width: 168px"
                                                type="date"
                                                value-format="YYYY-MM-DD"
                                            />
                                            <span class="ml10">～ 长期</span>
                                        </el-form-item>
                                    </div>
                                </div>
                            </el-form-item>
                        </el-tab-pane>
                    </el-tabs>
                </el-form>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch } from "vue";
import { DialogForm } from "@/components/dialog";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { SuppliersFormState } from "@/types/vendor/suppliers";
import { getSuppliers, updateSuppliers } from "@/api/vendor/suppliers";
import { SelectRegion } from "@/components/select";
import { FormAddGallery } from "@/components/gallery";
import { RadioType } from "@/components/radio";
import { getAdminUserList } from "@/api/authority/adminUser";
import { getUserList } from "@/api/user/user";
import user from "@/router/asyncRoutes/admin/user";
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
const activeName = ref("first");
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
    vendorName: "",
    adminData: {
        type: 1,
        userId: "",
        adminId: ""
    }
});

const loadingVal = ref(false);
const userInfo = ref<any>([]);
const remoteMethod = async (query: string) => {
    try {
        if (query) {
            loadingVal.value = true;
            const params = { keyword: query };
            // 使用公共方法来获取数据
            const result = await getUserFetch(params);
            // 设置用户信息
            result.records.forEach((item: any) => {
                if (formState.value.adminData.type === 2) {
                    item.value = item.adminId;
                    item.key = item.adminId;
                } else {
                    item.value = item.userId;
                    item.key = item.userId;
                }
                item.label = item.username;
            });
            userInfo.value = result.records;
        } else {
            userInfo.value = [];
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loadingVal.value = false;
    }
};
const getUserFetch = async (params: { keyword: string }) => {
    if (formState.value.adminData.type === 2) {
        return await getAdminUserList(params);
    } else {
        return await getUserList(params);
    }
};

watch(
    () => formState.value.type,
    (val) => {
        activeName.value = "first";
    }
);
const fetchSuppliers = async () => {
    try {
        const result = await getSuppliers(action.value, { id: id.value });
        if(result.adminData){
            if(result.adminData.type == 2){
                result.adminData.userId = ""
            }
            if(result.adminData.type == 1){
                result.adminData.adminId = ""
            }
        }
        Object.assign(formState.value, result);
        if (formState.value.adminData.type === 2) {
            userInfo.value.push({value: formState.value?.adminData?.adminId, key: formState.value?.adminData?.adminId, label: formState.value?.adminData?.accountName})
        } else {
            userInfo.value.push({value: formState.value?.adminData?.userId, key: formState.value?.adminData?.userId, label: formState.value?.adminData?.accountName})
        }
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

// 表单通过验证后提交
const onSubmit = async () => {
    if (formState.value.vendorName == "") {
        message.error("供应商名称不能为空!");
        activeName.value = "first";
        return;
    }
    if (formState.value.personData.documentName == "") {
        message.error("姓名不能为空!");
        activeName.value = "second";
        return;
    }
    if (formState.value.vendorData.companyName == "" && formState.value.type == 2) {
        message.error("企业名称不能为空!");
        activeName.value = "company";
        return;
    }
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        // if(formState.value.personData.certificateValidityPeriodEnd) {
        //       // @ts-expect-error
        //     formState.value.personData.certificateValidityPeriodDate[0] = formState.value.personData.certificateValidityPeriodEnd
        // }
        const result = await updateSuppliers(operation, { id: id.value, ...formState.value });
        emit("submitCallback", result);
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        emit("update:confirmLoading", false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.container {
    :deep(.el-form-item__label-wrap) {
        margin-left: 0 !important;
    }
}
.step-section-item {
    display: flex;
    margin-bottom: 24px;
    margin-left: 35px;

    .step-section-item__label {
        margin-right: 16px;
        min-width: 64px;
        font-size: 14px;
        line-height: 40px;
        color: #333;
        text-align: right;
    }

    .zent-form-control {
        display: flex;
        flex-direction: column;
        gap: 16px;
        .cert-type-desc-principal {
            font-size: 12px;
            color: #9598a6;
            line-height: 20px;
            padding-top: 3px;
        }
    }
}
.one-item {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .to-time {
        display: flex;
        align-items: center;
        gap: 20px;
    }
}
.required {
    color: var(--el-color-danger);
    margin-right: 4px;
}
</style>
