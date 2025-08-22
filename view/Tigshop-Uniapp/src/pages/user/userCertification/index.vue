<template>
    <tig-layout title="实名认证">
        <steps :current-step="currentStep - 1" :step-list="stepList" />
        <block v-if="!loadStatus">
            <block v-if="formState.status == 0">
                <view class="form-box">
                    <up-form ref="formStateRef" label-position="left" :model="formState" :rules="formStateRules" label-width="100" error-type="toast">
                        <up-form-item :required="true" :label="$t('主体类型') + '：'" prop="type">
                            <view class="sex-box">
                                <up-radio-group v-model="formState.type" style="width: 485rpx; justify-content: end" placement="row">
                                    <up-radio
                                        v-if="configStore.companyDataType != 1"
                                        style="padding-right: 15rpx"
                                        active-color="var(--general)"
                                        shape="circle"
                                        :name="1"
                                        :label="$t('个人')"
                                    />
                                    <up-radio active-color="var(--general)" shape="circle" :name="2" :label="$t('企业')" />
                                </up-radio-group>
                            </view>
                        </up-form-item>
                        <up-form-item v-if="formState.type == 1" :required="true" :label="$t('姓名') + '：'" prop="companyData.corporateName">
                            <up-input v-model="formState.companyData.corporateName" input-align="right" :placeholder="$t('请输入姓名')" border="none" />
                        </up-form-item>
                        <up-form-item v-if="formState.type == 2" :required="true" :label="$t('法人姓名') + '：'" prop="companyData.corporateName">
                            <up-input v-model="formState.companyData.corporateName" input-align="right" :placeholder="$t('请输入姓名')" border="none" />
                        </up-form-item>
                        <up-form-item :required="true" :label="$t('联系人手机') + '：'" prop="companyData.contactPhone">
                            <up-input v-model="formState.companyData.contactPhone" input-align="right" :placeholder="$t('请输入联系人手机')" border="none" />
                        </up-form-item>
                        <up-form-item :required="true" :label="$t('居住地址') + '：'" prop="companyData.residentialAddress">
                            <up-input
                                v-model="formState.companyData.residentialAddress"
                                input-align="right"
                                :placeholder="$t('请输入居住地址')"
                                border="none"
                            />
                        </up-form-item>
                        <!-- <up-form-item :required="true" :label="$t('性别') + '：'" prop="companyData.sex">
                                <view class="sex-box">
                                    <up-radio-group style="width: 485rpx; justify-content: end" v-model="formState.companyData.sex" placement="row">
                                        <up-radio
                                            style="padding-right: 15rpx"
                                            activeColor="var(--general)"
                                            shape="circle"
                                            :name="1"
                                            :label="$t('男')"
                                        ></up-radio>
                                        <up-radio activeColor="var(--general)" shape="circle" :name="2" :label="$t('女')"></up-radio>
                                    </up-radio-group>
                                </view>
                            </up-form-item> -->
                        <up-form-item :required="true" :label="$t('出生日期') + '：'" prop="companyData.birthday">
                            <uni-datetime-picker v-model="formState.companyData.birthday" type="date" :clear-icon="false" />
                        </up-form-item>
                        <up-form-item :required="true" :label="$t('证件类型') + '：'" prop="companyData.documentType" @click="showDocumentType = true">
                            <up-input
                                v-model="documentTypeText"
                                input-align="right"
                                disabled
                                disabled-color="#ffffff"
                                :placeholder="$t('请选择证件类型')"
                                border="none"
                            />
                            <template #right>
                                <up-icon name="arrow-right" />
                            </template>
                        </up-form-item>
                        <up-form-item :required="true" :label="$t('证件号码') + '：'" prop="companyData.documentNumber">
                            <up-input v-model="formState.companyData.documentNumber" input-align="right" :placeholder="$t('请输入证件号码')" border="none" />
                        </up-form-item>

                        <up-form-item
                            :required="true"
                            class="special-item"
                            label-position="top"
                            prop="companyData.certificateValidityPeriod"
                            :label="$t('证件有效期') + '：'"
                        >
                            <view>
                                <view class="certificate-validity-item">
                                    <up-radio-group v-model="formState.companyData.certificateValidityPeriod" placement="column" @change="getValidity">
                                        <up-radio active-color="var(--general)" shape="circle" :name="1" :label="$t('区间有效')" />
                                    </up-radio-group>
                                    <view class="validity-item-text">
                                        <uni-datetime-picker
                                            v-model="formState.companyData.certificateValidityPeriodDate"
                                            :clear-icon="false"
                                            :disabled="formState.companyData.certificateValidityPeriod == 2"
                                            type="daterange"
                                        />
                                    </view>
                                </view>

                                <view class="certificate-validity-item">
                                    <up-radio-group v-model="formState.companyData.certificateValidityPeriod" placement="column" @change="getValidity">
                                        <up-radio active-color="var(--general)" shape="circle" :name="2" :label="$t('长期有效')" />
                                    </up-radio-group>
                                    <view class="period_end-box">
                                        <view style="width: 70%">
                                            <uni-datetime-picker
                                                v-model="formState.companyData.certificateValidityPeriodEnd"
                                                type="date"
                                                :disabled="formState.companyData.certificateValidityPeriod == 1"
                                                :clear-icon="false"
                                            />
                                        </view>
                                        <view style="padding-left: 10rpx">- {{ $t("长期") }}</view>
                                    </view>
                                </view>
                            </view>
                        </up-form-item>

                        <up-form-item
                            :required="true"
                            prop="companyData.frontOfPhoto"
                            class="special-item"
                            label-position="top"
                            :label="$t('证件照正面') + '：'"
                        >
                            <view class="upload-box">
                                <upload v-model="formState.companyData.frontOfPhoto" :is-value-array="true" />
                            </view>
                        </up-form-item>
                        <up-form-item :required="true" prop="companyData.backOfPhoto" class="special-item" label-position="top" :label="$t('证件照反面') + ':'">
                            <view class="upload-box">
                                <upload v-model="formState.companyData.backOfPhoto" :is-value-array="true" />
                            </view>
                        </up-form-item>
                        <block v-if="formState.type == 2">
                            <up-form-item :required="true" :label="$t('企业名称') + '：'" prop="companyData.companyName">
                                <up-input v-model="formState.companyData.companyName" input-align="right" :placeholder="$t('请输入企业名称')" border="none" />
                            </up-form-item>
                            <up-form-item
                                :required="true"
                                :label="$t('注册地址') + '：'"
                                prop="companyData.licenseAddrProvince"
                                @click="handleShowRegisteredAddress"
                            >
                                <up-input
                                    v-model="registeredAddress"
                                    input-align="right"
                                    disabled
                                    disabled-color="#ffffff"
                                    :placeholder="$t('请选择注册地址')"
                                    border="none"
                                />
                                <template #right>
                                    <up-icon name="arrow-right" />
                                </template>
                            </up-form-item>
                            <up-form-item :required="true" :label="$t('详细地址') + '：'" prop="companyData.businessLicenseAddress">
                                <up-input
                                    v-model="formState.companyData.businessLicenseAddress"
                                    input-align="right"
                                    :placeholder="$t('请输入详细地址')"
                                    border="none"
                                />
                            </up-form-item>
                            <up-form-item :required="true" :label="$t('经营范围') + '：'" prop="companyData.businessScope">
                                <up-input v-model="formState.companyData.businessScope" input-align="right" :placeholder="$t('请输入经营范围')" border="none" />
                            </up-form-item>
                            <up-form-item :required="true" :label="$t('社会信用代码') + '：'" prop="companyData.businessLicenseId">
                                <up-input
                                    v-model="formState.companyData.businessLicenseId"
                                    input-align="right"
                                    :placeholder="$t('请输入统一社会信用代码')"
                                    border="none"
                                />
                            </up-form-item>
                            <up-form-item
                                :required="true"
                                class="special-item"
                                label-position="top"
                                prop="companyData.operatingTermType"
                                :label="$t('营业期限') + '：'"
                            >
                                <view>
                                    <view class="certificate-validity-item">
                                        <up-radio-group v-model="formState.companyData.operatingTermType" placement="column" @change="getValidity">
                                            <up-radio active-color="var(--general)" shape="circle" :name="1" :label="$t('区间有效')" />
                                        </up-radio-group>
                                        <view class="validity-item-text">
                                            <uni-datetime-picker
                                                v-model="formState.companyData.operatingTermTypeDate"
                                                :clear-icon="false"
                                                :disabled="formState.companyData.operatingTermType == 2"
                                                type="daterange"
                                            />
                                        </view>
                                    </view>
                                    <view class="certificate-validity-item">
                                        <up-radio-group v-model="formState.companyData.operatingTermType" placement="column" @change="getValidity">
                                            <up-radio active-color="var(--general)" shape="circle" :name="2" :label="$t('长期有效')" />
                                        </up-radio-group>
                                        <view class="period_end-box">
                                            <view style="width: 70%">
                                                <uni-datetime-picker
                                                    v-model="formState.companyData.operatingTermTypeEnd"
                                                    type="date"
                                                    :disabled="formState.companyData.operatingTermType == 1"
                                                    :clear-icon="false"
                                                />
                                            </view>
                                            <view style="padding-left: 10rpx">- {{ $t("长期") }}</view>
                                        </view>
                                    </view>
                                </view>
                            </up-form-item>
                            <up-form-item
                                :required="true"
                                prop="companyData.businessLicenseImg"
                                class="special-item"
                                label-position="top"
                                :label="$t('营业执照') + '：'"
                            >
                                <view class="upload-box">
                                    <upload v-model="formState.companyData.businessLicenseImg" :is-value-array="true" />
                                </view>
                            </up-form-item>
                        </block>
                    </up-form>
                </view>
            </block>
            <block v-if="formState.status != 0">
                <view class="status-box">
                    <view class="status-text">
                        <block v-if="formState.status == 1">
                            <view>
                                {{ $t("申请已受理") }}（{{ formState.addTime }}），{{ $t("将在") }} {{ configStore.companyDataTips || 3 }}
                                {{ $t("个工作日内完成审核") }}。{{ $t("以下为本次申请内容") }}：</view
                            >
                        </block>
                        <block v-if="formState.status == 2">
                            <view
                                >{{ $t(" 恭喜您") }}，{{ $t("您的申请审核") }}<text class="specaial-text">{{ $t("已通过") }}</text
                                >。
                            </view>
                            <view v-if="formState.auditRemark"> {{ $t("备注") }}：{{ formState.auditRemark }} </view>
                        </block>
                        <block v-if="formState.status == 3">
                            <view>
                                {{ $t("很遗憾") }}，{{ $t("您的申请审核") }}<text class="specaial-text">{{ $t("未通过") }}</text
                                >。</view
                            >
                            <div v-if="formState.auditRemark">{{ $t("备注") }}：{{ formState.auditRemark }}</div>
                        </block>
                    </view>
                </view>
                <up-form label-position="left" label-width="100">
                    <view class="form-box">
                        <view class="form-title">{{ $t("个人信息") }}</view>
                        <up-form-item :label="formState.type == 1 ? $t('个人姓名') + '：' : $t('法人姓名') + '：'">
                            <up-input v-model="formState.companyData.corporateName" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('证件类型') + '：'">
                            <up-input v-model="documentTypeText" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('证件号码') + '：'">
                            <up-input v-model="formState.companyData.documentNumber" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('出生日期') + '：'">
                            <up-input v-model="formState.companyData.birthday" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('证件有效期') + '：'">
                            <up-input v-model="certificateValidityPeriodText" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('手机号') + '：'">
                            <up-input v-model="formState.companyData.contactPhone" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <!-- <up-form-item :label="$t('性别') + '：'">
                                <up-input inputAlign="right" disabled disabledColor="#ffffff" v-model="sexText" border="none"></up-input>
                            </up-form-item> -->
                        <up-form-item :label="$t('居住地址') + '：'">
                            <view class="input-text">{{ formState.companyData.residentialAddress }}</view>
                        </up-form-item>
                    </view>
                    <view class="form-box">
                        <view class="form-title">{{ $t("证件照") }}</view>
                        <up-form-item class="noflex" :label="$t('证件照正面：')" label-position="top">
                            <image class="image-box" :src="staticResource('common/lock@3x.png')" />
                            <view style="padding-top: 10rpx; width: 100%">
                                <up-alert show-icon type="info" :description="$t('为了保护个人隐私信息不泄露，该照片不予展示')" />
                            </view>
                        </up-form-item>
                        <up-form-item class="noflex" :label="$t('证件照反面：')" label-position="top">
                            <image class="image-box" :src="staticResource('common/lock@3x.png')" />
                            <view style="padding-top: 10rpx">
                                <up-alert show-icon type="info" :description="$t('为了保护个人隐私信息不泄露，该照片不予展示')" />
                            </view>
                        </up-form-item>
                    </view>
                    <view v-if="formState.type == 2" class="form-box">
                        <view class="form-title">{{ $t("企业信息") }}</view>
                        <up-form-item :label="$t('企业名称') + '：'">
                            <up-input v-model="formState.companyData.companyName" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('注册地址') + '：'">
                            <view class="input-text">
                                <view
                                    v-if="formState.companyData.licenseAddrProvinceName || formState.companyData.businessLicenseAddress"
                                    class="input-content"
                                >
                                    {{ formState.companyData.licenseAddrProvinceName + formState.companyData.businessLicenseAddress }}
                                </view>
                            </view>
                        </up-form-item>
                        <up-form-item :label="$t('经营范围') + '：'">
                            <view class="input-text">
                                <view class="input-content">
                                    {{ formState.companyData.businessScope }}
                                </view>
                            </view>
                        </up-form-item>
                        <up-form-item :label="$t('社会信用代码') + '：'">
                            <up-input v-model="formState.companyData.businessLicenseId" input-align="right" disabled disabled-color="#ffffff" border="none" />
                        </up-form-item>
                        <up-form-item :label="$t('营业期限') + '：'">
                            <view class="type-text" style="font-size: 15px">
                                <template v-if="formState.companyData.operatingTermType == 1">
                                    {{ formState.companyData.operatingTermTypeDate[0] + " ～  " + formState.companyData.operatingTermTypeDate[1] }}
                                </template>
                                <template v-else> {{ formState.companyData.operatingTermTypeEnd }} ～{{ $t("长期") }} </template>
                            </view>
                        </up-form-item>
                        <up-form-item v-if="formState.companyData.businessLicenseImg.length > 0" :label="$t('营业执照') + '：'" label-position="top">
                            <block v-for="(item, index) in formState.companyData.businessLicenseImg" :key="index">
                                <tig-image class="image-box" :src="item.picUrl" />
                            </block>
                        </up-form-item>
                    </view>
                </up-form>
            </block>
        </block>
        <up-action-sheet
            :round="true"
            :show="showDocumentType"
            :actions="documentType"
            :title="$t('证件类型')"
            @close="showDocumentType = false"
            @select="documentTypeSelect"
        />
        <selectRegion v-model:show="showRegisteredAddress" v-model="formState.companyData.licenseAddrProvince" @send-region-names="getregisteredAddress" />
        <template v-if="!loadStatus && formState.status != 1">
            <tig-fixed-placeholder background-color="#fff">
                <view class="btn-box">
                    <template v-if="formState.status == 0">
                        <tig-button class="btn" @click="handlBtn('next')">{{ $t("提交") }} </tig-button>
                    </template>
                    <template v-if="formState.status == 3">
                        <tig-button class="btn" @click="handlReapply">{{ $t("重新申请") }} </tig-button>
                    </template>
                </view>
            </tig-fixed-placeholder>
        </template>
    </tig-layout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import selectRegion from "@/components/region/selectRegion.vue";
import upload from "@/components/upload/index.vue";
import steps from "@/pages/user/merchantEnter/src/steps.vue";
import { staticResource } from "@/utils";
import { getMyApply, getApplyInfo, applyApply } from "@/api/user/userCertification";
import type { ApplyDetailItem } from "@/types/user/userCertification";
import { useI18n } from "vue-i18n";
import { useConfigStore } from "@/store/config";

const configStore = useConfigStore();

const { t } = useI18n();

const emit = defineEmits(["sendRefresh"]);

const currentStep = ref(1);

const stepList = ref(["资料填写", "审核及公示"]);

const formStateRef = ref();

const formStateRules = {
    "companyData.certificateValidityPeriod": [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (formState.companyData.certificateValidityPeriodDate.length > 0 || formState.companyData.certificateValidityPeriodEnd) {
                    return true;
                }
                return false;
            },
            message: t("请选择证件有效期!"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ],
    "companyData.contactPhone": [
        {
            required: true,
            message: t("请输入手机号码!"),
            trigger: ["blur", "change"]
        },
        { pattern: /^1[3456789]\d{9}$/, message: t("请输入有效的手机号码"), trigger: ["blur", "change"] }
    ],
    "companyData.birthday": {
        required: true,
        message: t("请选择出生日期!"),
        trigger: ["blur", "change"]
    },
    "companyData.frontOfPhoto": [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (value.length > 0 && value[0].picUrl) {
                    return true;
                }
                return false;
            },
            message: t("请上传证件正面照"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ],
    "companyData.backOfPhoto": [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (value.length > 0 && value[0].picUrl) {
                    return true;
                }
                return false;
            },
            message: t("请上传证件反面照"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ],
    "companyData.businessLicenseImg": [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (value.length > 0 && value[0].picUrl) {
                    return true;
                }
                return false;
            },
            message: t("请上传营业执照照"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ],
    "companyData.documentType": {
        validator: (rule: any, value: any, callback: any) => {
            return value > 0;
        },
        message: t("请选择证件类型"),
        // 触发器可以同时用blur和change
        trigger: ["change", "blur"]
    },
    "companyData.corporateName": {
        required: true,
        message: t("请输入姓名!"),
        trigger: ["blur", "change"]
    },
    "companyData.documentNumber": {
        required: true,
        message: t("请输入证件号码!"),
        trigger: ["blur", "change"]
    },
    "companyData.residentialAddress": {
        required: true,
        message: t("请输入居住地址!"),
        trigger: ["blur", "change"]
    },
    "companyData.businessAddress": [
        {
            required: true,
            message: t("请选择经营地址")
        },
        {
            validator: (rule: any, value: any, callback: any) => {
                if (value.length === 0) {
                    return false;
                }
                return true;
            },
            message: t("请选择经营地址"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ],
    "companyData.detailedAddress": {
        required: true,
        message: t("请输入详细地址!"),
        trigger: ["blur", "change"]
    },
    "companyData.companyName": {
        required: true,
        message: t("请输入企业名称!"),
        trigger: ["blur", "change"]
    },
    "companyData.businessLicenseAddress": {
        required: true,
        message: t("请输入详细地址!"),
        trigger: ["blur", "change"]
    },
    "companyData.licenseAddrProvince": [
        {
            required: true,
            message: t("请选择注册地址")
        },
        {
            validator: (rule: any, value: any, callback: any) => {
                if (value.length < 4) {
                    return false;
                }
                return true;
            },
            message: t("请选择注册地址"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ],
    "companyData.businessScope": {
        required: true,
        message: t("请输入经营范围!"),
        trigger: ["blur", "change"]
    },
    "companyData.businessLicenseId": {
        required: true,
        message: t("请输入统一社会信用代码!"),
        trigger: ["blur", "change"]
    },
    "companyData.operatingTermType": [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (formState.companyData.operatingTermTypeDate.length > 0 || formState.companyData.operatingTermTypeEnd) {
                    return true;
                }
                return false;
            },
            message: t("请选择营业期限!"),
            // 触发器可以同时用blur和change
            trigger: ["change", "blur"]
        }
    ]
};
const formState = reactive<ApplyDetailItem>({
    type: configStore.companyDataType == 1 ? 2 : 1,
    status: 0,
    companyData: {
        frontOfPhoto: [],
        backOfPhoto: [],
        licenseAddrProvince: [],
        supplementaryInformation: [],
        businessLicenseImg: [],
        // sex: 1,
        operatingTermType: 1,
        operatingTermTypeDate: [] as string[],
        operatingTermTypeEnd: "",
        certificateValidityPeriod: 1,
        certificateValidityPeriodDate: [] as string[],
        certificateValidityPeriodEnd: ""
    }
});

const documentType = [
    {
        value: 1,
        name: t("大陆身份证")
    },
    {
        value: 2,
        name: t("护照（限境外人士）")
    },
    {
        value: 3,
        name: t("来往内地通行证（中国香港居民）")
    },
    {
        value: 4,
        name: t("来往内地通行证（中国澳门居民）")
    },
    {
        value: 5,
        name: t("来往大陆通行证（中国台湾居民）")
    }
];
const showDocumentType = ref(false);
const documentTypeText = ref("");
const documentTypeSelect = (val: { value: number; name: string }) => {
    formState.companyData.documentType = val.value;
    documentTypeText.value = val.name;
};
const getValidity = (e: any) => {
    formState.companyData.certificateValidityPeriodDate = [new Date().toISOString().split("T")[0], new Date().toISOString().split("T")[0]];
    formState.companyData.certificateValidityPeriodEnd = new Date().toISOString().split("T")[0];
};
const regionNames = ref("");
const getRegionNames = (val: string[]) => {
    regionNames.value = val.join(" ");
};

const handlBtn = async (val: string) => {
    handleSubmit();
};

const handleSubmit = async () => {
    await formStateRef.value.validate();
    try {
        const result = await applyApply(formState);
        uni.showToast({
            title: t("提交成功")
        });
        await getDetail();
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none"
        });
    }
};

const loadStatus = ref(false);
const sexText = ref("");
const certificateValidityPeriodText = ref("");
const apply = ref({
    id: 0,
    status: 0,
    type: 0
});
const getDetail = async () => {
    loadStatus.value = true;
    try {
        const result = await getMyApply();
        if (result && result.id) {
            currentStep.value = 2;
            Object.assign(apply.value, result);
            await getData(apply.value.id);
        }
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none"
        });
    } finally {
        loadStatus.value = false;
    }
};
const getData = async (id: number) => {
    try {
        const result = await getApplyInfo(id);
        certificateValidityPeriodText.value =
            result.companyData.certificateValidityPeriod == 1
                ? result.companyData.certificateValidityPeriodDate.join(" ～  ")
                : result.companyData.certificateValidityPeriodEnd + " ～  " + t("长期");
        documentTypeText.value = documentType.find((item) => item.value == result.companyData.documentType)?.name!;
        Object.assign(formState, result);
    } catch (error: any) {
        uni.showToast({
            title: error.message,
            icon: "none"
        });
    }
};

onMounted(async () => {
    await getDetail();
});

const showRegisteredAddress = ref(false);
const handleShowRegisteredAddress = () => {
    showRegisteredAddress.value = true;
};
const registeredAddress = ref("");
const getregisteredAddress = (val: string[]) => {
    registeredAddress.value = val.join(" ");
};
const handlReapply = () => {
    formState.type = configStore.companyDataType == 1 ? 2 : 1;
    formState.status = 0;
};
</script>

<style>
.form-box :deep(.uni-datetime-picker--btn) {
    background-color: var(--general);
}
.form-box :deep(.uni-calendar-item__weeks-box .uni-calendar-item--checked) {
    background-color: var(--general);
}
.form-box :deep(.uni-calendar-item--multiple .uni-calendar-item--after-checked) {
    background-color: var(--general);
}
.form-box :deep(.u-form-item__body) {
    padding: 15px 0;
}
.form-box .special-item :deep(.u-form-item__body) {
    padding-bottom: 5px;
}
.form-box .noflex :deep(.u-form-item__body__right__content__slot) {
    display: block;
}
</style>

<style lang="scss" scoped>
:deep(.uni-progress-bar) {
    display: none;
}

.input-text {
    font-size: 15px;
    width: 100%;
    text-align: right;
}

.upload-box {
    width: 80%;
    padding-top: 20rpx;
}
.steps {
    padding: 20rpx 0;
    background-color: #fff;
}
.btn-box {
    padding: 25rpx 15rpx;
    height: 100%;

    .btn {
        height: 100%;
        font-size: 28rpx;
    }
}

.status-box {
    background: none repeat scroll 0 0 #fffdee;
    border: 1px solid #edd28b;
    padding: 20rpx;
    font-size: 28rpx;
    margin: 20rpx 20rpx;
    .status-text {
        padding-bottom: 15rpx;
        &:last-child {
            padding-bottom: 0;
        }
    }
}

.specaial-text {
    color: var(--general);
}

.form-box {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 20rpx 30rpx;
    margin: 20rpx;
    .type-text {
        width: 100%;
        display: flex;
        justify-content: end;
    }

    .form-upload {
        width: 149rpx;
        height: 150rpx;
        background: #fafafa;
        border-radius: 20rpx;
        margin-top: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .certificate-validity-item {
        display: flex;
        height: 100rpx;
        align-items: center;
        padding-top: 10px;
        &:first-child {
            padding-top: 10px;
        }
    }

    .validity-item-text {
        display: flex;
        align-items: center;
        justify-content: end;
        width: 485rpx;
        padding-left: 20rpx;
    }
    .period_end-box {
        display: flex;
        align-items: center;
        width: 485rpx;
        padding-left: 20rpx;
    }

    .form-title {
        font-size: 30rpx;
        font-weight: 600;
        color: #333333;
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        &::before {
            content: "";
            display: inline-block;
            width: 6rpx;
            height: 30rpx;
            background: var(--general);
            border-radius: 3rpx;
            margin-right: 10rpx;
        }
    }
    .image-box {
        padding-top: 30rpx;
        height: 200rpx;
        width: 200rpx;
    }
}
</style>
