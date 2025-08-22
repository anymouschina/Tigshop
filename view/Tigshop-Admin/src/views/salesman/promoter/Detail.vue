<template>
    <div class="container">
        <div class="salesman-info">
            <div class="salesman-tit flex">
                <div class="logo-info flex">
                    <img class="logo" :src="avatarFormat(formState.baseUserInfo.avatar as any)" alt="" />
                    <div class="name">{{ formState.baseUserInfo?.nickname || formState.baseUserInfo?.username || '--' }}</div>
                    <div class="lable">{{ formState.levelText }}</div>
                </div>
                <!-- <div class="btn-row">
                    <DialogForm
                        :maskClose="false"
                        :params="{ act: 'detail', id: 111 }"
                        dialogClass="noPadding"
                        isDrawer
                        path="product/product/Info"
                        title="编辑分销员"
                        width="800px"
                        @okCallback="fetchCoupon"
                    >
                        <a class="btn-link">编辑</a>
                    </DialogForm>
                </div> -->
            </div>
            <div class="row flex">
                <div class="col">
                    <div class="item">手机号：{{ formState.baseUserInfo?.mobile || '--' }}</div>
                    <div class="item">加入时间：{{ formState.addTime }}</div>
                    <!-- <div class="item">结算方式：自动结算</div> -->
                    <!-- <div class="item">加入方式：后台导入</div> -->
                </div>
                <div class="col">
                    <div class="item">分组：{{ formState.groupInfo?.groupName || '--' }}</div>
                    <!-- <div class="item">标识码：fdsf</div> -->
                </div>
                <div class="col">
                    <div class="item">邀请方：{{ formState.pidUserInfo?.baseUserInfo.nickname }}</div>
                    <!-- <div class="item">加入时间：{{ formState.addTime }}</div> -->
                </div>
            </div>
        </div>
        <div class="tit-row">
            <div class="txt">
                业绩概况
            </div>
        </div>
        <div class="num-list flex">
            <div class="item">
                <div class="txt">
                    <p>累计销售额(元)</p>
                    <el-tooltip placement="top-start" effect="light">
                        <template #content>销售额已减去退款金额</template>
                        <el-icon size="14" color="#cacaca"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </div>
                <div class="num">
                    {{ priceFormat(statistical.saleAmount) }}
                </div>
            </div>
            <div class="item">
                <div class="txt">
                    <span>累计订单数</span>
                </div>
                <div class="num">
                    {{ statistical.orderNum }}
                </div>
            </div>
            <div class="item">
                <div class="txt">
                    <span>累计客户数</span>
                </div>
                <div class="num">
                    {{ statistical.customerNum }}
                </div>
            </div>
            <div class="item">
                <div class="txt">
                    <span>累计邀请数</span>
                </div>
                <div class="num">
                    {{ statistical.inviteNum }}
                </div>
            </div>
        </div>
        <div class="tit-row">
            <div class="txt">
                佣金统计
            </div>
        </div>
        <div class="num-list flex">
            <div class="item">
                <div class="txt">
                    <span>累计佣金(元)</span>
                </div>
                <div class="num">
                    {{ priceFormat(statistical.commissionAmount) }}
                </div>
            </div>
            <div class="item">
                <div class="txt">
                    <p>商品佣金(元)</p>
                    <el-tooltip placement="top-start" effect="light">
                        <template #content>含待结算</template>
                        <el-icon size="14" color="#cacaca"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </div>
                <div class="num">
                    {{ priceFormat(statistical.productCommissionAmount) }}
                </div>
            </div>
            <!-- <div class="item">
                <div class="txt">
                    <p>邀请佣金(元)</p>
                    <el-tooltip placement="top-start" effect="light">
                        <template #content>含待结算</template>
                        <el-icon size="14" color="#cacaca"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </div>
                <div class="num">
                    0.00
                </div>
            </div> -->
        </div>
        <!-- <div class="tit-row">
            <div class="txt">
                其他统计
            </div>
        </div>
        <div class="num-list flex">
            <div class="item">
                <div class="txt">
                    <p>推广金额(元)</p>
                    <el-tooltip placement="top-start" effect="light">
                        <template #content>推广金额用于分销员升级，开启等级后进行统计，佣金结算后会统计，清退后会清零</template>
                        <el-icon size="14" color="#cacaca"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </div>
                <div class="num">
                    0.00
                </div>
            </div>
            <div class="item">
                <div class="txt">
                    <p>自购金额(元)</p>
                    <el-tooltip placement="top-start" effect="light">
                        <template #content>自购金额用于分销员升级，创建等级后开始统计，清退后会清零</template>
                        <el-icon size="14" color="#cacaca"><QuestionFilled /></el-icon>
                    </el-tooltip>
                </div>
                <div class="num">
                    0.00
                </div>
            </div>
        </div> -->
    </div>
</template>
<script lang="ts" setup>
import { QuestionFilled } from "@element-plus/icons-vue";
import { ref, shallowRef, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { promoterDetailsFilterState } from "@/types/salesman/promoter.d";
import { getsalesman } from "@/api/salesman/promoter";
import { avatarFormat } from "@/utils/format";
import { priceFormat } from "@/utils/format";
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
    },
    isDialog: {
        type: Boolean,
        default: false
    }
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formState = ref<promoterDetailsFilterState>({
    baseUserInfo:{}
});
const statistical = ref<any>({});
onMounted(() => {
    _getsalesman();
});
const _getsalesman = async () => {
    try {
        const result = await getsalesman(action.value, {
            id: id.value
        });
        Object.assign(formState.value, result.salesmanVO);
        Object.assign(statistical.value, result.statistical);
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
</script>
<style lang="less" scoped>
.container{
    padding: 20px;
    .salesman-info{
        margin-bottom: 20px;
        .salesman-tit{
            justify-content: space-between;
            margin-bottom: 15px;
            .logo-info{
                align-items: center;
                .logo{
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    margin-right: 10px;
                }
                .lable{
                    color: #155bd4;
                    border: #356fd4 1px solid;
                    padding: 3px;
                    margin-left: 10px;
                }
            }
        }
        .row{
            justify-content: space-between;
            padding: 0 40px;
            .item{
                margin-bottom: 15px;
            }
        }
    }
    .tit-row{
        background-color: #f7f7f7;
        padding: 10px;
        margin-bottom: 20px;
        .txt{
            border-left: 3px solid #155bd4;
            padding-left: 10px;
        }
    }
    .num-list{
        .item{
            width: 200px;
            .txt{
                display: flex;
                align-items: center;
                p{
                    margin-right: 5px;
                }
            }
            .num{
                font-size: 20px;
                font-weight: 600;
                margin: 20px 0 30px 0;
            }
        }
    }
}
</style>
