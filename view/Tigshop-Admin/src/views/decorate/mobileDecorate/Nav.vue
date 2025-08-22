<template>
    <div class="container">
        <div class="content_wrapper decoratePgaeWrap">
            <div class="flex box-wrapper">
                <div class="tab-box">
                    <div class="flex">
                        <div class="decorateWrap">
                            <div class="decorate-page-window" style="background-position: center top; height: 700px; margin-top: 10px">
                                <div class="theme-modules-warp">
                                    <div class="list-item modules-item modules-item-topbar" draggable="false">
                                        <div class="module-ad-con module-topbar-warp">
                                            <div class="module-topbar-con">
                                                <div class="module-topbar-title-con"><div class="title-item" style="">页面标题</div></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="list-item modules-item modules-item-bottom_nav module-item-active">
                                        <div class="module-ad-con">
                                            <div class="bottom-nav-con">
                                                <div class="bottom-nav-item" v-for="(item, index) in module.navList">
                                                    <div class="item-content">
                                                        <a class="item-img-a">
                                                            <img class="item-img" :src="imageFormat(item.picUrl)" v-if="item.picUrl" />
                                                        </a>
                                                        <a class="item-text-a">
                                                            <span class="item-text">{{ item.picTitle }}</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="right-box-warp" style="width: 510px">
                            <div class="dec-spread-title">
                                <div class="title">底部导航设置</div>
                            </div>
                            <a-spin :spinning="loading">
                                <div class="dec-edit-group dec-edit-group-block">
                                    <div class="dec-edit-group-title">
                                        <div class="title">添加图片</div>
                                    </div>
                                    <div class="dec-edit-group-con">
                                        <NavPicList :isMultiple="true" v-model:photos="module.navList" decorateType="mobile"></NavPicList>
                                    </div>
                                </div>
                            </a-spin>
                            <div class="dec-edit-save">
                                <a-button :loading="confirmLoading" @click="onSubmit" type="primary" size="large" class="save-btn">保存</a-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/views/decorate/decorate/src/css/decorate.less";
import { ref, shallowRef, onMounted, nextTick } from "vue";
import { NavPicList, PicSelect } from "@/components/decorate";
import { SelectColor } from "@/components/select";
import { getDecorateDiscrete, updateDecorateDiscrete } from "@/api/decorate/decorateDiscrete";
import { DecorateDiscreteFormState } from "@/types/decorate/decorateDiscrete.d";
import { message } from "ant-design-vue";
import { imageFormat } from "@/utils/format";

const type = ref("mobileNav");
const loading = ref(true);
const confirmLoading = ref(false);
const module = ref<DecorateDiscreteFormState>({
    navList: []
});
const navList = ref([
    {
        picTitle: "首页",
        picThumb: "img/gallery/demo/1680247587QG2y44h7a7f0M1dx9T!!pic200x200.png",
        picUrl: "img/gallery/demo/1680247587QG2y44h7a7f0M1dx9T!!pic.png",
        picActiveThumb: "img/gallery/demo/16802475870v7jHejQtgFvn7Yd6e!!pic200x200.png",
        picActiveUrl: "img/gallery/demo/16802475870v7jHejQtgFvn7Yd6e!!pic.png",
        picLink: {
            path: "base",
            label: "商城首页",
            name: "商城首页",
            link: "/"
        },
        picId: 583,
        picName: "ico_1"
    },
    {
        picTitle: "我的",
        picThumb: "img/gallery/demo/1680247679vqWSO1Ci9sAGJCzzZa!!pic200x200.png",
        picUrl: "img/gallery/demo/1680247679vqWSO1Ci9sAGJCzzZa!!pic.png",
        picActiveThumb: "img/gallery/demo/1680247682VX4iwQSO82hyzUedDz!!pic200x200.png",
        picActiveUrl: "img/gallery/demo/1680247682VX4iwQSO82hyzUedDz!!pic.png",
        picLink: {
            path: "base",
            label: "会员中心",
            name: "会员中心",
            link: "member"
        },
        picId: 589,
        picName: "ico_4"
    }
]);
// 表单通过验证后提交
onMounted(() => {
    // 获取详情数据
    fetchDecorateDiscrete();
});
const fetchDecorateDiscrete = async () => {
    try {
        const result = await getDecorateDiscrete({
            decorateSn: type.value
        });
        Object.assign(module.value, result.data);
        nextTick(() => {
            if (module.value.navList.length <= 0) {
                module.value.navList = navList.value;
                onSubmit(1);
            }
        });
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const onSubmit = async (newNumber?: number) => {
    try {
        confirmLoading.value = true;
        const result = await updateDecorateDiscrete({
            decorateSn: type.value,
            data: module.value
        });
        if (newNumber !== 1) {
            message.success("操作成功");
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
</script>
<style lang="less" scoped>
.modules-item-bottom_nav {
    background: #fff;
}
.modules-item-bottom_nav .bottom-nav-con {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    text-align: center;
}
.modules-item-bottom_nav .bottom-nav-item {
    flex: 1;
}
.modules-item-bottom_nav .item-content .item-img-a {
    display: block;
}
.modules-item-bottom_nav .item-content .item-text-a {
    color: #222;
    margin-top: 3px;
    display: block;
}
.modules-item-bottom_nav .item-content .item-img-a img {
    width: 25px;
    height: 25px;
}
.bottom-nav-con {
    background: #fff;
    height: 54px;
    padding: 5px 0;
    box-sizing: border-box;
}
</style>
