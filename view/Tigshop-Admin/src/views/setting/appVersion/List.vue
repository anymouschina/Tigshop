<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px">
                    <el-form ref="formRef" :model="formState" label-width="auto" style="display: flex; gap: 12px; flex-direction: column">
                        <div class="title">APP版本</div>
                        <!-- <div class="notice-warp">
                            版本升级需制作热更新文件，制作时版本号需要高一个版本号。具体制作请参考<a
                                href="https://www.tigshop.com/course/tigshop/187506502217291111"
                                target="_blank"
                            >
                                《APP版本管理》 </a
                            >教程。
                        </div> -->
                        <el-form-item label="Android版本号" prop="androidVersion">
                            <TigInput classType="tig-form-input" v-model="formState.androidVersion" type="text" />
                        </el-form-item>
                        <el-form-item label="Android下载链接" prop="androidLink">
                            <div>
                                <div class="link-wrapper">
                                    <TigInput classType="tig-form-input" v-model="formState.androidLink" disabled type="text" />
                                    <Upload
                                        name="file"
                                        :action="requestUrl.prefix + '/setting/appVersion/uploadFile'"
                                        :headers="requestUrl.headers()"
                                        @change="handleChange($event, 'android')"
                                        :showUploadList="false"
                                        :multiple="false"
                                        accept=".apk,.wgt"
                                    >
                                        <el-button>{{ formState.androidLink ? "重新上传" : "点击上传" }}</el-button>
                                    </Upload>
                                </div>
                                <div class="extra">
                                    版本升级需制作热更新文件，制作时版本号需要高一个版本号。具体制作请参考<a
                                        href="https://www.tigshop.com/course/tigshop/187506502217291111"
                                        target="_blank"
                                    >
                                        《APP版本管理》 </a
                                    >教程。
                                </div>
                            </div>
                        </el-form-item>

                        <el-form-item label="iOS版本号" prop="iosVersion">
                            <TigInput classType="tig-form-input" v-model="formState.iosVersion" type="text" />
                        </el-form-item>

                        <el-form-item label="iOS下载链接" prop="iosLink">
                            <div>
                                <div class="link-wrapper">
                                    <TigInput classType="tig-form-input" v-model="formState.iosLink" disabled type="text" />
                                    <Upload
                                        name="file"
                                        :action="requestUrl.prefix + '/setting/appVersion/uploadFile'"
                                        :headers="requestUrl.headers()"
                                        @change="handleChange($event, 'ios')"
                                        :showUploadList="false"
                                        :multiple="false"
                                        accept=".wgt"
                                    >
                                        <el-button>{{ formState.iosLink ? "重新上传" : "点击上传" }}</el-button>
                                    </Upload>
                                </div>
                                <div class="extra">
                                    版本升级需制作热更新文件，制作时版本号需要高一个版本号。具体制作请参考<a
                                        href="https://www.tigshop.com/course/tigshop/187506502217291111"
                                        target="_blank"
                                    >
                                        《APP版本管理》 </a
                                    >教程。
                                </div>
                            </div>
                        </el-form-item>
                    </el-form>
                    <div class="selected-action-warp selected-warp-left" :style="{ left: themeInfo.layout !== 'topMenu' ? '369px' : '270px' }">
                        <div class="selected-action">
                            <el-button :loading="confirmLoading" class="form-submit-btn" size="large" type="primary" @click="onSubmit">提 交</el-button>
                        </div>
                    </div>
                </a-spin>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/style/css/list.less";
import request, { requestUrl } from "@/utils/request";
import { onMounted, ref, shallowRef } from "vue";
import { message, Upload } from "ant-design-vue";
import { getAppVersion, updateAppVersionLinks } from "@/api/setting/appVersion";
import type { AppVersionFormState } from "@/types/setting/appVersion.d";
import { convertNullsToEmptyStrings } from "@/utils/format";
import { useThemeStore } from "@/store/theme";
const { themeInfo } = useThemeStore();
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const confirmLoading = ref(false);
const formState = ref<AppVersionFormState>({});
const loading = ref<boolean>(true);
const formRef = shallowRef();

// 获取列表的查询结果
const loadFilter = async () => {
    loading.value = true;
    try {
        const result = await getAppVersion();
        Object.assign(formState.value, convertNullsToEmptyStrings(result));
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

const handleChange = (info: any, type: string) => {
    if (info.file.status == "uploading") {
    }
    if (info.file.status !== "uploading") {
    }
    if (info.file.status === "done") {
        // 上传完成
        if (info.file.response.code !== 0) {
            info.file.status = "error";
            message.error(info.file.response.data.message);
        } else {
            console.log(info.file.response)
            for (let index in info.fileList) {
                if (info.file.uid == info.fileList[index].uid) {
                    info.fileList[index] = Object.assign(info.fileList[index], info.fileList[index].response.data);
                }
            }
            if (type === "android") {
                formState.value.androidLink = info.file.response.data;
            }
            if (type === "ios") {
                formState.value.iosLink = info.file.response.data;
            }
            message.success("文件上传成功！");
        }
    } else if (info.file.status === "error") {
        message.error(`${info.file.name} 文件上传失败！`);
    }
};
onMounted(() => {
    // 获取详情数据
    loadFilter();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        const result = await updateAppVersionLinks({ ...formState.value });
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
.content_wrapper {
    min-height: calc(100vh - 260px);
}

.title {
    font-weight: bold;
    padding-bottom: 30px;
    font-size: 16px;
    line-height: 24px;
}

.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}

.link-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
