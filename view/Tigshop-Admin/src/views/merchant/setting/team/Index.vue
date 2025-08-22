<template>
    <div class="container">
        <div class="content_wrapper">
            <!-- <el-tabs v-model="activeKey" class="lyecs-tabs" tab-position="top" @tab-change="onTabChange">
                <el-tab-pane :key="1" label="店铺设置" name="店铺设置"></el-tab-pane>
                <el-tab-pane :key="2" label="商品设置" name="商品设置"></el-tab-pane>
                <el-tab-pane :key="3" label="订单/交易设置" name="订单/交易设置"></el-tab-pane>
                <el-tab-pane :key="4" label="资产/支付设置" name="资产/支付设置"></el-tab-pane>
            </el-tabs> -->
            <el-form ref="formRef" :model="formState" label-width="160px">
                <div v-show="activeKey === '店铺设置'" class="content">
                    <div class="title">
                        <span>
                            经营设置
                        </span>
                        <span class="tips">
                            设置你的网点经营模式；
                        </span>
                    </div>
                    <el-form-item label="经营状态" prop="status">
                        <div>
                            <el-radio-group v-model="formState.status" class="itemWidth">
                                <el-radio :value="1" v-if="formState.status != 4">开业</el-radio>
                                <el-radio :value="4">暂停运营</el-radio>
                                <el-radio :value="10" v-if="formState.status != 4">打烊</el-radio>
                            </el-radio-group>
                            <div class="extra">
                                <text v-if="formState.status == 4" class="red">暂停营业中，请联系平台处理。</text>
                                <text v-else>设置休息后，买家将无法在店内消费，请谨慎操作。</text>
                            </div>
                        </div>
                    </el-form-item>
                    <!-- <div class="title">
                        <span>
                            基础设置
                        </span>
                    </div> -->
                    <!-- <el-form-item label="联系电话" prop="contactMobile">
                        <TigInput v-model="formState.contactMobile" width="300px;" />
                    </el-form-item> -->
                    <el-form-item label="客服电话" prop="kefuPhone">
                        <TigInput v-model="formState.kefuPhone" width="300px;" />
                    </el-form-item>
                    <!-- <el-form-item label="客服微信" prop="kefuWeixin">
                        <TigInput v-model="formState.kefuWeixin" width="300px;" />
                    </el-form-item> -->
                    <el-form-item label="客服入口页面" prop="kefuInlet">
                        <el-checkbox-group v-model="formState.kefuInlet">
                            <el-checkbox :value="1" label="商品详情页" />
                            <el-checkbox :value="2" label="订单详情页" />
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item  :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button  :loading="confirmLoading" ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
                    </el-form-item>
                    <!-- <el-form-item label="客服链接" prop="kefuLink">
                        <TigInput v-model="formState.kefuLink" width="300px;" />
                    </el-form-item> -->
                    <!-- <el-form-item label="购物车" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">开启</el-radio>
                                <el-radio :value="0">关闭</el-radio>
                            </el-radio-group>
                            <div class="extra">关闭购物车后，商品仅支持单独购买并结算，请谨慎操作。购物车样式请前往<a>悬浮窗</a>配置。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="显示加购数" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">开启</el-radio>
                                <el-radio :value="0">关闭</el-radio>
                            </el-radio-group>
                            <div class="extra">开启后，商品加购图标均会显示用户已加购数量。注：仅支持小程序2.163,零售3.118版本及以上展示。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="联系客服" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">开启</el-radio>
                                <el-radio :value="0">关闭</el-radio>
                            </el-radio-group>
                            <div class="extra">开启后，买家可在你勾选的页面通过客服入口与你取得联系。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="客服入口页面" prop="shopTitleSuffix">
                        <div>
                            <div>
                                <div>
                                    <el-checkbox v-model="shopTitleSuffix" label="商品详情页" />
                                </div>
                                <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                    <el-radio :value="1">默认名称</el-radio>
                                    <el-radio :value="0">自定义名称</el-radio>
                                </el-radio-group>
                                <div class="extra">默认名称为客服，可自定义，如：咨询顾问。</div>
                            </div>
                            <div>
                                <div>
                                    <el-checkbox v-model="shopTitleSuffix" label="订单详情页" />
                                </div>
                                <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                    <el-radio :value="1">默认名称</el-radio>
                                    <el-radio :value="0">自定义名称</el-radio>
                                </el-radio-group>
                                <div class="extra">默认名称为客服，可自定义，如：咨询顾问。</div>
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item label="悬浮滚动栏" prop="shopTitle">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">展示</el-radio>
                                <el-radio :value="0">不展示</el-radio>
                            </el-radio-group>
                            <div class="extra">开启悬浮滚动栏将在商品详情页及确认订单页展示。注：确认订单页仅支持在小程序展示。查看示例你当前的小程序版本较低，若需要确认订单页展示悬浮滚动栏，需要升级小程序版本</div>
                            <div>
                                <el-checkbox v-model="shopTitleSuffix" label="浏览行为" />
                                <el-checkbox v-model="shopTitleSuffix" label="购买行为" />
                                <el-checkbox v-model="shopTitleSuffix" label="好评行为" />
                            </div>
                            <div class="extra">勾选后，将在悬浮滚动栏中展示勾选的行为数据。选中“展示”后，至少选中一种行为。注：浏览行为，仅支持在商品详情页展示。你当前的小程序版本较低，若需要使用购买行为和好评行为，需要升级小程序版本</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="会员招募入口" prop="shopTitle">
                        <el-checkbox v-model="shopTitleSuffix" label="商品详情页" />
                        <el-checkbox v-model="shopTitleSuffix" label="提交订单页" />
                        <el-checkbox v-model="shopTitleSuffix" label="限会员参与活动" />
                    </el-form-item>
                    <el-form-item label="优先引导办理" prop="shopKeywords">
                        <InputTag v-if="!loading" v-model.modelValue="formState.shopKeywords" placeholder="请输入关键字，按回车键确认"></InputTag>
                        <div class="extra">同时开启会员等级和多张权益卡时优先引导办理</div>
                    </el-form-item>
                    <el-form-item label="店铺黑名单" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">开启</el-radio>
                                <el-radio :value="0">关闭</el-radio>
                            </el-radio-group>
                            <div class="extra">开启后，你可以在后台客户管理模块将客户添加进黑名单，黑名单客户将禁止在店铺内下单。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="同城服务" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">开启</el-radio>
                                <el-radio :value="0">关闭</el-radio>
                            </el-radio-group>
                        </div>
                    </el-form-item>
                    <el-form-item label="店铺后台水印" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">开启(推荐)</el-radio>
                                <el-radio :value="0">关闭</el-radio>
                            </el-radio-group>
                            <div class="extra">开启后，员工进入店铺管理后台会显示水印，PC端水印展示该员工姓名和日期，移动端水印展示该员工姓名</div>
                        </div>
                    </el-form-item>

                    <div class="title">
                        <span>
                            页面设置
                        </span>
                    </div>
                    <el-form-item label="店铺营销标签" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">展示</el-radio>
                                <el-radio :value="0">不展示</el-radio>
                            </el-radio-group>
                            <div class="extra">在商品列表展示活动及优惠券信息，有利于提升下单转化。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="会员价标签" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">展示</el-radio>
                                <el-radio :value="0">不展示</el-radio>
                            </el-radio-group>
                            <div class="extra">在商品列表展示会员价标签，刺激会员客户下单转化。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="店铺底部Logo" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">默认</el-radio>
                                <el-radio :value="0">自定义</el-radio>
                            </el-radio-group>
                        </div>
                    </el-form-item>
                    <el-form-item label="微页面默认背景色" prop="shopName">
                        <div>
                            <SelectColor v-model:color="formState.textColor"></SelectColor>
                            <div class="extra">创建新的微页面时默认选择的背景色，创建/编辑微页面时可以自定义背景色。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="售罄商品" prop="shopName">
                        <div>
                            <el-radio-group v-model="formState.closeOrder" class="itemWidth">
                                <el-radio :value="1">展示</el-radio>
                                <el-radio :value="0">不展示</el-radio>
                            </el-radio-group>
                            <div class="extra">展示后，售罄商品会在店铺中展示，并显示“已售罄”标记。</div>
                        </div>
                    </el-form-item>
                    <el-form-item label="售罄标识" prop="shopName">
                        <div>
                            上传图片
                            <div class="extra">展示后，售罄商品会在店铺中展示，并显示“已售罄”标记。</div>
                        </div>
                    </el-form-item> -->
                </div>
                <!-- <div v-show="activeKey === '商品设置'" class="content"></div> -->
                <!-- <div v-show="activeKey === '订单/交易设置'" class="content"></div> -->
                <!-- <div v-show="activeKey === '资产/支付设置'" class="content"></div> -->
            </el-form>

        </div>
    </div>
<!--    <div class="selected-action-warp selected-warp-left">-->
<!--        <div class="selected-action" style="padding-left: 80px">-->
<!--            <a-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</a-button>-->
<!--        </div>-->
<!--    </div>-->
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { SelectColor } from "@/components/select";
import { onMounted, ref, shallowRef, computed } from "vue";
import { FormAddGallery } from "@/components/gallery";
import { InputTag } from "@/components/form";
import { SelectRegion } from "@/components/select";
import { message } from "ant-design-vue";
import { useUserStore } from "@/store/user";
import type {ShopInfoFormState} from "@/types/merchant/setting/team.d";
import {saveShopSetting} from "@/api/merchant/setting/team";
import { getShopInfo } from "@/api/authority/accountEditing";
const formRef = shallowRef();
// 基本参数定义
const activeKey = ref<string>("店铺设置");
const confirmLoading = ref<boolean>(false);
const formState = ref<ShopInfoFormState>({
    kefuInlet:[]
});
// 表单通过验证后提交
const onSubmit = async () => {
    confirmLoading.value = true;
    console.log(formState.value)
    try {
        const result = await saveShopSetting({
            ...formState.value
        });
        message.success("操作成功");
        // 更新后台设置项
        const userStore = useUserStore() as any;
        userStore.updateUserInfo();
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
const loading = ref<boolean>(true);
    const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getShopInfo();
        Object.assign(formState.value, result)
    } catch (error:any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}
onMounted(() => {
    loadFilter();
});
</script>
<style lang="less" scoped>
.container{
    background-color: #fff;
    margin: 20px;
    .content{
        .title{
            margin:20px 0 20px 100px;
            line-height: 30px;
            font-size: 14px;
            font-weight: 700;
            .tips{
                display: inline-block;
                margin-left: 10px;
                font-weight: 500;
                color: #999;
            }
        }
    }
}
</style>
