<template>
  <div class="container">
    <div class="content_wrapper">
      <div class="lyecs-form-table">
        <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
          <el-form-item :rules="[{ required: true, message: '名称不能为空!' }]" label="名称" prop="productServiceName">
            <TigInput classType="tig-form-input" v-model="formState.productServiceName"></TigInput>
          </el-form-item>
          <el-form-item label="简介">
            <TigInput classType="tig-form-input"
                v-model="formState.productServiceDesc"
                :rows="2"
                placeholder="请输入简介"
                type="textarea"
            />
          </el-form-item>
          <el-form-item label="图标">
            <FormAddGallery v-model:photo="formState.icoImg"/>
            <div class="extra">请统一上传比例为2:1的图片，宽200px，高100px（高清）</div>
          </el-form-item>
          <el-form-item label="排序">
            <TigInput classType="tig-form-input" type="integer" v-model="formState.sortOrder"/>
          </el-form-item>
          <el-form-item label="是否默认" >
            <el-radio-group v-model="formState.defaultOn">
              <el-radio :value="1">是</el-radio>
              <el-radio :value="0">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
            <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, shallowRef, onMounted } from "vue"
import { useRouter } from 'vue-router'
import { message } from "ant-design-vue";
import { FormAddGallery } from '@/components/gallery'
import { ProductServicesFormState } from '@/types/product/productServices';
import { getProductServices, updateProductServices } from "@/api/product/productServices";

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ''
    },
    isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<ProductServicesFormState>({
  sortOrder: 50,
  defaultOn:1
});

onMounted(() => {
  if (action.value === "detail") {
        // 获取详情数据
        fetchProductServicesList();
    } else {
        loading.value = false;
    }
});
const fetchProductServicesList = async () => {
    try {
        const result = await getProductServices(action.value, { id: id.value });
        Object.assign(
          formState.value,
          result
        )
    } catch (error:any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};


// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateProductServices(operation, { id: id.value, ...formState.value });
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error:any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit()
};

defineExpose({ onFormSubmit });
</script>
