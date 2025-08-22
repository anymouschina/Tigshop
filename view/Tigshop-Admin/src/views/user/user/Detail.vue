<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <div v-if="!loading">
                    <div class="container-card">
                        <div class="title">
                            <span class="mr10">基本信息</span>
                            <DialogForm
                                :params="{ act: 'detail', id: formState.userId }"
                                isDrawer
                                path="user/user/Info"
                                title="编辑会员"
                                width="560px"
                                @okCallback="updateData"
                            >
                                <a class="btn-link">编辑</a>
                            </DialogForm>
                        </div>
                        <div class="info-card">
                            <el-avatar :size="60" :src="imageFormat(formState.avatar)"></el-avatar>
                            <div class="card-info">
                                <div class="name">
                                    <UserCard :user="formState.username"></UserCard>
                                </div>
                                <div class="gr">
                                    等级：<span class="rank">{{ formState.rankName }}</span>
                                </div>
                                <el-row>
                                    <el-col :span="8">
                                        <div class="line1">{{ "昵称：" + formState.nickname }}</div>
                                    </el-col>
                                    <el-col :span="8">
                                        手机号：
                                        <MobileCard :mobile="formState.mobile"></MobileCard>
                                    </el-col>
                                    <el-col :span="8"> 邮箱地址：{{ formState.email }} </el-col>
                                </el-row>
                            </div>
                        </div>
                    </div>
                    <div class="container-card">
                        <div class="title">会员资料</div>
                        <div class="info-card">
                            <el-row style="width: 100%">
                                <el-col :span="8"> 生日：{{ formState.birthday }} </el-col>
                                <el-col :span="8"> 注册时间：{{ formState.regTime }} </el-col>
                            </el-row>
                        </div>
                    </div>
                    <div class="container-card">
                        <div class="title"><span class="mr10">收货信息</span></div>
                        <div class="info-card">
                            <el-row style="width: 100%; line-height: 30px">
                                <el-col :span="8"> 收货人：{{ formState.userAddress?.consignee || "--" }} </el-col>
                                <el-col :span="8"> 联系方式：{{ formState.userAddress?.mobile || "--" }} </el-col>
                                <el-col :span="8"> 邮箱地址：{{ formState.userAddress?.email || "--" }} </el-col>
                                <el-col :span="8">
                                    所在地区：
                                    <template v-for="item in formState.userAddress?.regionNames" :key="item">
                                        <span>{{ item }}</span>
                                    </template>
                                    {{ formState.userAddress?.address || "--" }}
                                </el-col>
                            </el-row>
                        </div>
                    </div>
                    <div class="container-card">
                        <div class="title">
                            <span class="mr10">资金信息</span>
                            <DialogForm
                                :params="{ act: 'detail', id: formState.userId, type: 1 }"
                                isDrawer
                                path="user/user/EditAccount"
                                title="资金管理"
                                width="600px"
                                @okCallback="onSubmit"
                            >
                                <a class="btn-link mr10">管理</a>
                            </DialogForm>
                            <DialogForm
                                :params="{ act: 'detail', id: formState.userId, type: 1 }"
                                isDrawer
                                path="user/user/AccountLog"
                                title="资金管理"
                                width="资金明细"
                                :showClose="false"
                                :showOnOk="false"
                            >
                                <a class="btn-link">明细</a>
                            </DialogForm>
                        </div>
                        <div class="info-card">
                            <div class="zj-info">
                                <div>可用资金</div>
                                <div class="rank fz20">
                                    <a class="btn-link">{{ priceFormat(formState.balance) }}</a>
                                </div>
                            </div>
                            <div class="zj-info">
                                <div>冻结资金</div>
                                <div class="rank fz20">
                                    <a class="btn-link">{{ priceFormat(formState.frozenBalance) }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="container-card">
                        <div class="title">
                            <span class="mr10">积分信息</span>
                            <DialogForm
                                :params="{ act: 'detail', id: formState.userId, type: 3 }"
                                isDrawer
                                path="user/user/EditAccount"
                                title="资金管理"
                                width="600px"
                                @okCallback="onSubmit"
                            >
                                <a class="btn-link mr10">管理</a>
                            </DialogForm>
                            <DialogForm
                                :params="{ act: 'detail', id: formState.userId, type: 3 }"
                                isDrawer
                                path="user/user/AccountLog"
                                title="资金管理"
                                width="资金明细"
                                :showClose="false"
                                :showOnOk="false"
                            >
                                <a class="btn-link">明细</a>
                            </DialogForm>
                        </div>
                        <div class="info-card">
                            <div class="zj-info">
                                <div>成长积分</div>
                                <div class="rank fz20">
                                    <a class="btn-link">{{ formState.growthPoints }}</a>
                                </div>
                            </div>
                            <div class="zj-info">
                                <div>消费积分</div>
                                <div class="rank fz20">
                                    <a class="btn-link">{{ formState.points }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { UserFormState } from "@/types/user/user.d";
import { getUser, updateUser, updateUserField } from "@/api/user/user";
import { imageFormat, priceFormat } from "@/utils/format";
import { PopForm } from "@/components/pop-form";

import { DialogForm } from "@/components/dialog";
import MobileCard from "@/components/list/src/MobileCard.vue";
import UserCard from "@/components/list/src/UserCard.vue";
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "callback", "close"]);

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
const operation = action.value === "add" ? "insert" : "update";
const formRef = shallowRef();
const formState = ref<UserFormState>({
    balance: 0,
    frozenBalance: 0,
    avatar: ""
});
const fetchUser = async () => {
    try {
        const result = await getUser(action.value, { id: id.value });
        Object.assign(formState.value, result);
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    // 获取详情数据
    fetchUser();
});

const updateData = (result: any) => {
    fetchUser();
    emit("callback", result);
};

// 表单通过验证后提交
const onSubmit = () => {
    emit("submitCallback", true);
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};

defineExpose({ onFormSubmit });
</script>
<style lang="less" scoped>
.container-card {
    border: 1px solid #ececec;
    /* 添加淡淡的边框 */
    box-shadow: 2px 2px 5px rgba(203, 193, 193, 0.2);
    border-radius: 2px;
    padding: 20px;
    background: #fff;
    margin-bottom: 20px;

    .title {
        font-size: 14px;
        line-height: 14px;
        color: #323233;
        margin-bottom: 15px;
        border-left: 4px solid var(--tig-primary);
        padding-left: 10px;
    }

    .info-card {
        font-size: 14px;
        display: flex;
        flex-direction: row;
        gap: 20px;
        white-space: nowrap;

        .card-info {
            display: flex;
            line-height: 30px;
            flex-direction: column;
            flex: 1;

            .name {
                font-weight: 700;
                font-size: 16px;
            }

            .gr {
                color: #6f7071;
                font-size: 12px;
            }
        }

        .zj-info {
            flex: 1;
            height: 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            line-height: 30px;
        }
    }

    .rank {
        cursor: pointer;
        color: var(--tig-primary);
    }

    .fz20 {
        font-size: 20px;
    }
}
</style>
