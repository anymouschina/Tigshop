<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item label="评论商品" prop="productIds">
                        <SelectProduct :isMultiple="false" v-if="!loading" v-model:ids="formState.productIds" :disabled="examine == 1"> </SelectProduct>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '会员名称不能为空!' }]" label="会员名称" prop="username">
                        <TigInput classType="tig-form-input" v-model="formState.username" :disabled="examine == 1" />
                    </el-form-item>
                    <el-form-item label="会员头像" prop="avatar">
                        <FormAddGallery v-model:photo="formState.avatar" :disabled="examine == 1"></FormAddGallery>
                        <div class="extra">请统一上传比例为1:1的图片，宽100px，高100px（高清））</div>
                    </el-form-item>
                    <el-form-item label="评论星级" prop="commentRank">
                        <el-radio-group v-model="formState.commentRank" :disabled="examine == 1">
                            <el-radio :value="1">一星</el-radio>
                            <el-radio :value="2">二星</el-radio>
                            <el-radio :value="3">三星</el-radio>
                            <el-radio :value="4">四星</el-radio>
                            <el-radio :value="5">五星</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="标签" prop="commentTag">
                        <div class="flex flex-wrap">
                            <el-tag
                                style="margin: 5px"
                                v-for="tag in formState.commentTag"
                                :key="tag"
                                :closable="examine != 1"
                                :disable-transitions="false"
                                @close="handleClose(tag)"
                            >
                                {{ tag }}
                            </el-tag>
                            <template v-if="examine != 1">
                                <TigInput
                                    classType="tig-form-input"
                                    v-if="inputVisible"
                                    ref="InputRef"
                                    v-model="inputValue"
                                    class="w-20"
                                    size="small"
                                    @keyup.enter="handleInputConfirm"
                                    @blur="handleInputConfirm"
                                />
                                <el-button style="margin: 5px" v-else class="button-new-tag" size="small" @click="showInput"> + 新增标签 </el-button>
                            </template>
                        </div>
                    </el-form-item>
                    <el-form-item :rules="[{ required: true, message: '评论内容不能为空!' }]" label="评论内容" prop="content">
                        <TigInput classType="tig-form-input" v-model="formState.content" type="textarea" :disabled="examine == 1" />
                    </el-form-item>
                    <el-form-item label="评论日期" prop="addTime">
                        <el-date-picker
                            v-model="formState.addTime"
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder="请选择日期"
                             :disabled="examine == 1"
                            type="datetime"
                            value-format="YYYY-MM-DD HH:mm:ss"
                        />
                    </el-form-item>
                    <el-form-item label="晒单" prop="showPics">
                        <FormAddGallery v-if="!loading" v-model:photos="formState.showPics" :isMultiple="true" :disabled="examine == 1"> </FormAddGallery>
                    </el-form-item>
                    <el-form-item label="排序" prop="sortOrder">
                        <TigInput classType="tig-form-input" type="integer" v-model="formState.sortOrder" :disabled="examine == 1" />
                    </el-form-item>
                    <el-form-item label="是否推荐" prop="isRecommend">
                        <el-radio-group v-model="formState.isRecommend" :disabled="examine == 1">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="是否置顶" prop="isTop">
                        <el-radio-group v-model="formState.isTop" :disabled="examine == 1">
                            <el-radio :value="1">是</el-radio>
                            <el-radio :value="0">否</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交 </el-button>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width: 100%; margin-top: 100px" />
            </div>
            <div class="container-card" v-if="!loading && action !== 'add'">
                <div class="title">
                    管理员回复
                    <DialogForm
                        :params="{ id: id }"
                        isDrawer
                        path="product/comment/src/EditRemark"
                        title="回复评论"
                        width="600px"
                        @okCallback="updateDataWithList"
                    >
                        <el-button bg class="buttonColor" size="small" text type="primary"> 回复评论 </el-button>
                    </DialogForm>
                </div>
                <div v-if="!formState.reply">暂无回复！</div>
                <div v-else>
                    <p>内容：{{ formState.reply.content }}</p>
                    <p style="text-align: end; margin-top: 10px">{{ formState.reply.username }}@{{ formState.reply.addTime }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { DialogForm } from "@/components/dialog";
import { onMounted, ref, shallowRef, nextTick } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { FormAddGallery } from "@/components/gallery";
import { CommentFormState } from "@/types/product/comment";
import { getComment, updateComment } from "@/api/product/comment";
import { SelectProduct } from "@/components/select";
import { ElInput } from "element-plus";

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
    examine: {
        type: Number,
        default: 0
    },
    isDialog: Boolean
});

const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === "add" ? "create" : "update";
const formRef = shallowRef();
const formState = ref<CommentFormState>({
    commentRank: 5,
    isRecommend: 1,
    isTop: 0,
    sortOrder: 50,
    productIds: [],
    commentTag: []
});

const inputValue = ref("");
const inputVisible = ref(false);
const InputRef = ref<InstanceType<typeof ElInput>>();

const handleClose = (tag: string) => {
    formState.value.commentTag.splice(formState.value.commentTag.indexOf(tag), 1);
};

const showInput = () => {
    inputVisible.value = true;
    nextTick(() => {
        InputRef.value!.input!.focus();
    });
};

const handleInputConfirm = () => {
    if (inputValue.value) {
        formState.value.commentTag.push(inputValue.value);
    }
    inputVisible.value = false;
    inputValue.value = "";
};
onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchComment();
    } else {
        loading.value = false;
    }
});
const fetchComment = async () => {
    try {
        const result = await getComment(action.value, { id: id.value });
        let productIds: number[] = [];
        if (result.productId) {
            productIds = [result.productId];
        }
        Object.assign(formState.value, result, { productIds: productIds });
    } catch (error: any) {
        message.error(error.message);
        emit("close");
    } finally {
        loading.value = false;
    }
};
const updateDataWithList = () => {
    // 获取详情数据
    fetchComment();
};

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit("update:confirmLoading", true);
        let productId = 0;
        if (formState.value.productIds.length > 0) {
            productId = formState.value.productIds[0];
        }
        const result = await updateComment(operation, { id: id.value, ...formState.value, productId: productId });
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
<style scoped lang="less">
.container-card {
    border: 1px solid #ececec;
    box-shadow: 2px 2px 5px rgba(203, 193, 193, 0.2);
    border-radius: 2px;
    padding: 20px;
    background: #fff;
    margin-bottom: 20px;
    .title {
        font-family: bold;
        font-size: 16px;
        line-height: 25px;
        color: #323233;
        margin-bottom: 15px;
    }
}
</style>
