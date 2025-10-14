<template>
  <div class="container">
    <div class="content_wrapper">
      <div class="lyecs-table-list-warp">
        <div class="list-table-tool lyecs-search-warp">
          <div class="advanced-search-warp list-table-tool-row">
            <div class="simple-form-warp">
              <div class="simple-form-field">
                <div class="form-group">
                  <label class="control-label"><span>桌号：</span></label>
                  <div class="control-container">
                    <el-input v-model="keyword" placeholder="输入桌号搜索" clearable @clear="onSearch" @keyup.enter="onSearch" />
                  </div>
                </div>
              </div>
              <div class="simple-form-field">
                <div class="form-group">
                  <label class="control-label"><span>区域：</span></label>
                  <div class="control-container">
                    <el-input v-model="areaFilter" placeholder="区域" clearable @clear="onSearch" @keyup.enter="onSearch" />
                  </div>
                </div>
              </div>
              <div class="simple-form-field">
                <label class="control-label"></label>
                <div class="control-container">
                  <el-button type="primary" plain @click="onSearch">搜索</el-button>
                  <el-button plain @click="resetFilter">重置</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="list-table-tool-row">
          <div class="list-table-tool-col">
            <el-space>
              <el-button type="primary" @click="openCreate">新增桌号</el-button>
              <el-button @click="fetchList">刷新</el-button>
              <span v-if="records.length">共 {{ records.length }} 个</span>
            </el-space>
          </div>
        </div>
        <div class="table-container">
          <a-spin :spinning="loading">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width:70px">ID</th>
                  <th style="width:120px">桌号</th>
                  <th style="width:120px">区域</th>
                  <th style="width:90px">容量</th>
                  <th>二维码Key</th>
                  <th style="width:160px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filtered" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.table_no }}</td>
                  <td>{{ row.area || '-' }}</td>
                  <td>{{ row.capacity || '-' }}</td>
                  <td>{{ row.qr_code_key || '-' }}</td>
                  <td>
                    <el-space>
                      <a @click="openEdit(row)">编辑</a>
                      <a style="color:#ff4d4f" @click="remove(row)">删除</a>
                    </el-space>
                  </td>
                </tr>
                <tr v-if="!filtered.length">
                  <td colspan="6" style="text-align:center; padding:40px 0; color:#999">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </a-spin>
        </div>
      </div>
    </div>
    <el-dialog v-model="modalVisible" :title="editingId? '编辑桌号' : '新增桌号'" width="520px" @close="resetForm">
      <el-form :model="form" label-width="90px">
        <el-form-item label="桌号" required>
          <el-input v-model="form.tableNo" placeholder="如 A01" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="form.capacity" :min="1" :controls="false" style="width:100%" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="form.area" />
        </el-form-item>
        <el-form-item label="二维码Key">
          <el-input v-model="form.qrCodeKey" placeholder="留空自动生成(未来)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { listShopTable, createShopTable, updateShopTable, deleteShopTable } from './api/shopTable';
import { message, Modal } from 'ant-design-vue';

interface ShopTable { id:number; shop_id:number; table_no:string; capacity?:number; area?:string; qr_code_key?:string }

const records = ref<ShopTable[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<number|null>(null);
const formRef = ref();
const form = reactive<any>({ tableNo:'', capacity:undefined, area:'', qrCodeKey:'' });
const submitting = ref(false);
const keyword = ref('');
const areaFilter = ref('');
// 假设从 localStorage 获取当前店铺 ID
const shopId = Number(localStorage.getItem('shopId')) || 0;

const filtered = computed(()=>{
  return records.value.filter(r => {
    const k = keyword.value.trim();
    const af = areaFilter.value.trim();
    return (!k || r.table_no.includes(k)) && (!af || (r.area||'').includes(af));
  });
});

async function fetchList(){
  if(!shopId){ message.warning('缺少 shopId'); return; }
  loading.value = true;
  try {
  const res:any = await listShopTable(shopId);
  // 后端标准格式 { code, message, data: { records: [...] } }
  records.value = res?.data?.records || res?.records || [];
  } finally { loading.value = false; }
}

function resetForm(){
  form.tableNo=''; form.capacity=undefined; form.area=''; form.qrCodeKey='';
}
function openCreate(){ editingId.value=null; resetForm(); modalVisible.value=true; }
function openEdit(r:ShopTable){
  editingId.value = r.id;
  form.tableNo = r.table_no;
  form.capacity = r.capacity || undefined;
  form.area = r.area || '';
  form.qrCodeKey = r.qr_code_key || '';
  modalVisible.value = true;
}

async function handleSubmit(){
  const payload = { shopId, tableNo: form.tableNo, capacity: form.capacity, area: form.area, qrCodeKey: form.qrCodeKey };
  try {
    submitting.value = true;
    if(editingId.value){
      await updateShopTable(editingId.value, payload);
      message.success('更新成功');
    } else {
      await createShopTable(payload);
      message.success('创建成功');
    }
    modalVisible.value=false; fetchList();
  } catch(e:any){ message.error(e?.message||'操作失败'); } finally { submitting.value=false; }
}

function remove(r:ShopTable){
  Modal.confirm({
    title:'确认删除该桌号?',
    onOk: async ()=>{ await deleteShopTable(r.id); message.success('已删除'); fetchList(); }
  });
}

function onSearch(){ fetchList(); }
function resetFilter(){ keyword.value=''; areaFilter.value=''; fetchList(); }

onMounted(fetchList);
</script>
<style scoped>
/* 复用现有列表页面的样式结构，可添加少量自定义 */
.table-container { margin-top: 10px; }
.custom-table th, .custom-table td { padding:8px 10px; }
.custom-table tbody tr:hover { background:#fafafa; }
</style>