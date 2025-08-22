<template>
    <div class="select-shop-warp">
        <div class="head-box flex flex-justify-between flex-align-center">
            <div class="title">选择组织</div>
            <div class="close" @click="close">
                <i class="iconfont icon-cha1"></i>
            </div>
        </div>
        <div v-if="!createShopFlag">
            <a-spin :spinning="loading" style="width: 100%; margin-top: 100px; height: 200px">
                <div class="warp-info" v-if="!loading">
                    <el-scrollbar style="height: 100%">
                        <div class="list-box">
                            <div class="info-item admin" @click="toIndex(0, 'admin')" v-if="userinfo.adminType == 'admin'">
                                <div class="logo">
                                    <img src="@/assets/logo/admin_logo.png" alt="" />
                                </div>
                                <div>
                                    管理后台 <span v-if="userinfo && userinfo.username && userinfo.username !== ''">（{{ userinfo?.username }}）</span>
                                </div>
                            </div>
                            <!-- <div class="info-item supplier" @click="toIndex(0)">
                            <div class="logo">
                                <img src="@/assets/logo/supplier_logo.png" alt="" />
                            </div>
                            <div>供应商后台</div>
                        </div> -->
                            <template v-if="myShopList.length > 0">
                                <div class="info-item" v-for="item in myShopList" :key="item.shopId" @click="toIndex(item.shopId, 'shop')">
                                    <div class="logo">
                                        <el-image v-if="item.shopLogo" class="shop-img" :src="imageFormat(item.shopLogo)" fit="cover" />
                                        <img v-else src="@/assets/logo/merchant_logo.png" alt="" />
                                    </div>
                                    <div class="shop-name">
                                        <p class="label shop">店铺</p>
                                        <p class="line1">{{ item.shopTitle }}</p>
                                    </div>
                                </div>
                            </template>
                            <template v-if="vendorList.length > 0">
                                <div class="info-item" v-for="item in vendorList" :key="item.vendorId" @click="toIndex(item.vendorId, 'vendor')">
                                    <div class="logo">
                                        <img v-if="item.gysLogo" :src="imageFormat(item.gysLogo)" alt="" />
                                        <img v-else src="@/assets/logo/supplier_logo.png" alt="" />
                                    </div>
                                    <div class="shop-name line1">
                                        <p class="label vendor">供应商</p>
                                        <p class="line1">{{ item.vendorName }}</p>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </el-scrollbar>
                </div>
            </a-spin>
            <div class="btn-box" v-if="adminType === 'shop'">
                <el-button type="primary" @click="createShopFlag = true" style="width: 130px">新建店铺</el-button>
            </div>
        </div>
        <div v-else>
            <div style="padding: 40px 0">
                <el-form label-width="80" ref="formRef" :model="formState" class="demo-ruleForm" status-icon>
                    <el-form-item :rules="[{ required: true, message: '店铺名称不能为空!' }]" label="店铺名称" prop="shopTitle">
                        <TigInput classType="tig-form-input" v-model="formState.shopTitle" />
                    </el-form-item>
                    <el-form-item label="">
                        <el-button type="primary" @click="onSubmit()"> 创建 </el-button>
                        <el-button @click="createShopFlag = false">取消</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, shallowRef } from "vue";
import { createShop } from "@/api/merchant/shop";
import { useUserStore } from "@/store/user";
import { urlFormat, imageFormat } from "@/utils/format";
import { message } from "ant-design-vue";
import { getAdminType } from "@/utils/storage";
import gysLogo from "@/assets/logo/gys.png";
const adminType = getAdminType();
const props = defineProps({
    selectShopFlag: {
        type: Boolean,
        default: false
    },
    myShopList: {
        type: Array as () => any[],
        default: () => []
    },
    vendorList: {
        type: Array as () => any[],
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    userinfo: {
        type: Object,
        default: () => {}
    },
    adminType: {
        type: String,
        default: ""
    }
});
const formState = ref({
    shopTitle: "",
    shopLogo: ""
});
const emit = defineEmits(["closePopup", "update:selectShopFlag", "callBack", "changeShopList", "close"]);
const close = () => {
    emit("close");
};
const formLoading = ref(false);
// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        formLoading.value = true;
        const result = await createShop({ ...formState.value });
        message.success("创建成功");
        createShopFlag.value = false;
        emit("changeShopList", true);
    } catch (error: any) {
        message.error(error.message);
    } finally {
        formLoading.value = false;
    }
};
const formRef = shallowRef();
const createShopFlag = ref(false);
const toIndex = async (id: number, type: string) => {
    emit("callBack", { id, type });
};
</script>
<style scoped lang="less">
.select-shop-warp {
    padding: 0px 20px;
    .head-box {
        padding: 10px 0 10px 0;
        font-size: 16px;
        .title {
            color: #1f2026;
            font-weight: 500;
        }
    }
    .btn-box {
        margin-top: 20px;
        text-align: center;
    }
    .warp-info {
        height: 470px;
        overflow-y: auto;
        .list-box {
            padding: 20px 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 25px;
            .info-item {
                width: 200px;
                height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #edf0f5 0%, #fafbfc 100%);
                border: 2px solid #ffffff;
                border-radius: 6px;
                box-shadow: 0px 2px 16px 0px rgba(29, 54, 83, 0.08);
                color: #1f2026;
                font-size: 16px;
                transition: all 0.2s;
                &:hover {
                    margin-top: -5px;
                    box-shadow: 0 20px 40px 0 rgba(2, 31, 65, 0.1);
                    cursor: pointer;
                    border-color: var(--tig-primary);
                    background: #fff;
                }
                .logo {
                    img {
                        width: 90px;
                        height: 90px;
                        border-radius: 50px;
                        margin-bottom: 20px;
                    }
                    .shop-img {
                        width: 85px;
                        height: 85px;
                        border-radius: 50px;
                        margin-bottom: 20px;
                    }
                }
                .shop-name {
                    max-width: 80%;
                    display: flex;
                    align-items: center;
                    line-height: 22px;
                    .label{
                        height: 15px;
                        line-height: 15px;
                        border: 1px solid red;
                        padding: 0 2px;
                        font-size: 10px;
                        margin-right: 5px;
                        border-radius: 2px;
                        margin-top: 3px;
                    }
                    .shop{
                        min-width: 20px;
                        color: #1456F0;
                        border-color: #1456F0;
                    }
                    .vendor{
                        min-width: 30px;
                        color: #A203FC;
                        border-color: #A203FC;
                    }
                    .store{
                        color: #52C41A;
                        border-color: #52C41A;
                    }
                }
            }
        }
    }
}

@media only screen and (max-width: 767px) {
    .select-shop-warp {
        padding: 0;
    }
}
</style>
