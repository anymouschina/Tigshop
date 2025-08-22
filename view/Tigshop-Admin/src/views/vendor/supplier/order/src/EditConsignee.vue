<template>
  <div class="container">
    <div class="content_wrapper">
      <div class="lyecs-form-table">
        <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
          <el-form-item :rules="[{ required: true, message: '收货人不能为空!' }]" label="收货人" prop="consignee">
            <TigInput classType="tig-form-input" v-model="formState.consignee" />
          </el-form-item>
          <el-form-item label="所在地区" prop="regionIds">
              <SelectRegion v-if="!loading" v-model="formState.regionIds"></SelectRegion>
          </el-form-item>
          <el-form-item :rules="[{ required: true, message: '手机不能为空!' }]" label="手机" prop="mobile">
            <TigInput classType="tig-form-input" v-model="formState.mobile" />
          </el-form-item>
          <el-form-item :rules="[{ required: true, message: '地址不能为空!' }]" label="地址" prop="address">
            <TigInput classType="tig-form-input" v-model="formState.address" />
          </el-form-item>
          <el-form-item label="邮编" prop="postcode">
            <TigInput classType="tig-form-input" v-model="formState.postcode" />
          </el-form-item>
          <el-form-item label="电子邮件" prop="email">
            <TigInput classType="tig-form-input" v-model="formState.email" />
          </el-form-item>
          <el-form-item label="电话" prop="telephone">
            <TigInput classType="tig-form-input" v-model="formState.telephone" />
          </el-form-item>
          <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
            <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交
            </el-button>
          </el-form-item>
        </el-form>
        <a-spin :spinning="loading" style="width:100%;margin-top:100px" />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue"
import { useRouter } from 'vue-router'
import { message } from "ant-design-vue";
import { OrderFormState } from '@/types/order/order.d';
import { getOrder, modifyOrderConsignee } from "@/api/order/order";
import { priceFormat } from "@/utils/format";
import { Checkbox } from "@/components/radio";
import { SelectRegion } from "@/components/select";

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
  id: {
      type: Number,
      default: 0
  },
  act: {
    type: String,
    default: 0
  },
  form: {
    type: Object as () => OrderFormState,
    default: () => ({})
  },
  isDialog: Boolean
});
const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const formRef = shallowRef();
const formState = ref<OrderFormState>(props.form);

onMounted(() => {
  // 获取详情数据
  fetchOrder();
});
const fetchOrder = async () => {
  try {
    loading.value = true;
    const result = await getOrder(action.value, { id: id.value });
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
    console.log(formState.value)
    const result = await modifyOrderConsignee({ id: id.value, ...formState.value });
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
<style lang="less" scoped></style>
