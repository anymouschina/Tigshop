<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-table-list-warp">
                <div class="list-table-tool lyecs-search-warp">
                    <div class="notice-warp">
                        <p>提示：</p>
                        <p>1、请先下载模板文件，然后通过上传导入商品</p>
                        <p>
                            2、商品相册：请先将图片上传至服务器站点目录（推荐上传至OSS或站点根目录/img/upload/”
                            下的目录），比如图片完整路径为：“/www/web/public/img/upload/2022/1.jpg”，填写时请省略public/在内的前面的路径，直接填写“img/upload/2022/1.jpg”即可；多张图请用符号|分隔，第一张图片会作为商品主图
                        </p>
                        <p>3、商品分类：请按分类级别依次填写名称，使用|分隔，比如：家用电器|电视|平板电视，如果分类不存在时想自动创建，可钩选自动创建分类</p>
                        <p>4、商品品牌：填写品牌名称，如果品牌名称不存在时想自动创建，可钩选自动创建品牌</p>
                        <p>5、关键词：请用空格分隔</p>
                        <p>6、是否上架：填1代表上架，0代表下架</p>
                        <p class="red">提示：提交后请勿刷新或关闭页面！</p>
                    </div>
                    <div class="lyecs-form-table">
                        <el-form ref="formRef" :model="formState" label-width="auto">
                            <el-form-item label="下载模板文件">
                                <a href="#" @click="productBatchDownload">商品导入模板文件</a>
                            </el-form-item>
                            <el-form-item :rules="[{ required: true, message: '请选择文件!' }]" label="上传文件">
                                <el-upload
                                    ref="uploadRef"
                                    :auto-upload="false"
                                    :limit="1"
                                    :on-change="handleChange"
                                    :on-exceed="handleExceed"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    class="upload-demo"
                                >
                                    <template #trigger>
                                        <el-button type="primary">选择文件</el-button>
                                    </template>
                                </el-upload>
                            </el-form-item>
                            <el-form-item label="是否自动添加分类">
                                <el-radio-group v-model="formState.isAutoCat" class="width100">
                                    <el-radio :value="1">是</el-radio>
                                    <el-radio :value="0">否</el-radio>
                                </el-radio-group>
                                <div class="extra">如果选指否，则分类不存在时会输出错误；如果选指是，则会自动新建分类！</div>
                            </el-form-item>
                            <el-form-item label="是否自动添加品牌">
                                <el-radio-group v-model="formState.isAutoBrand">
                                    <el-radio :value="1">是</el-radio>
                                    <el-radio :value="0">否</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <el-form-item label="是否修改商品相册">
                                <el-radio-group v-model="formState.isChangePic" class="width100">
                                    <el-radio :value="1">是</el-radio>
                                    <el-radio :value="0">否</el-radio>
                                </el-radio-group>
                                <div class="extra">为防止误操作，默认不会对文件中的商品相册字段进行修改，如果需要修改，请钩选此项为“是”</div>
                            </el-form-item>
                            <el-form-item label=" ">
                                <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交 </el-button>
                                <!-- <el-button ref="submitBtn" class="form-submit-btn">重置</el-button> -->
                            </el-form-item>
                        </el-form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import "@/style/css/list.less";
import { requestUrl } from "@/utils/request";
import { onMounted, reactive, ref, shallowRef } from "vue";
import { ProductBatchModifyFormState } from "@/types/product/productBatch.d";
import { productBatchDownloadTemplateSubmit, productBatchModifySubmit } from "@/api/product/productBatch";
import { message } from "ant-design-vue";
import { genFileId } from "element-plus";
import type { UploadInstance, UploadProps, UploadRawFile } from "element-plus";
import requestExport from "@/utils/export";
const formRef = shallowRef();
// 基本参数定义
const formState = reactive<ProductBatchModifyFormState>({
    //初使化用于查询的参数
    isAutoCat: 0,
    isAutoBrand: 0,
    isChangePic: 0,
    isUpload: 1,
    file: ""
});
const uploadRef = ref<UploadInstance>()
const handleExceed: UploadProps['onExceed'] = (files) => {
  uploadRef.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  uploadRef.value!.handleStart(file)
}
const handleChange = (data: any) => {
    let formData = new FormData();
    formData.append("file", data.raw);
    formState.file = formData.get("file");
};
const productBatchDownload = async () => {
    const result = await productBatchDownloadTemplateSubmit();
    requestExport(result,'模板文件')
}
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        const result = await productBatchModifySubmit({ ...formState });
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    }
};
</script>
<style lang="less" scoped>
.notice-warp {
    background-color: #eef2ff;
    border-radius: 9px;
    padding: 15px;
    margin-bottom: 20px;
    line-height: 24px;
}

.lyecs-form-table {
    padding: 14px 0;
    background: #fff;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-content: center;
}
.width100 {
    width: 100%;
}
</style>
