<template>
  <div class="container">
    <div class="content_wrapper">
      <div class="lyecs-table-list-warp">
        <!-- 筛选区域 (与订单列表结构对齐) -->
        <div class="list-table-tool lyecs-search-warp">
          <div class="advanced-search-warp list-table-tool-row">
            <div class="simple-form-warp">
              <div class="simple-form-field">
                <div class="form-group">
                  <label class="control-label"><span>桌号：</span></label>
                  <div class="control-container">
                    <el-input v-model="search.keyword" placeholder="输入桌号" clearable @keyup.enter="onSearch" />
                  </div>
                </div>
              </div>
              <div class="simple-form-field">
                <div class="form-group">
                  <label class="control-label"><span>区域：</span></label>
                  <div class="control-container">
                    <el-input v-model="search.area" placeholder="区域" clearable @keyup.enter="onSearch" />
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

        <!-- 工具栏 -->
        <div class="list-table-tool-row toolbar-row">
          <div class="list-table-tool-col">
            <el-space>
              <el-button type="primary" @click="openCreate">新增桌号</el-button>
              <el-button @click="fetchList" :loading="loading">刷新</el-button>
              <span v-if="records.length" class="total-text">共 {{ records.length }} 个</span>
            </el-space>
          </div>
        </div>

        <!-- 表格 -->
        <div class="table-container">
          <div v-if="loading" class="table-loading-holder"><a-spin /></div>
          <el-table
            v-else
            :data="filtered"
            border
            stripe
            size="small"
            class="table-content"
            :row-key="rowKey"
            empty-text="暂无数据"
          >
            <el-table-column prop="id" label="ID" width="70" align="center" />
            <el-table-column prop="tableNo" label="桌号" width="140" />
            <el-table-column prop="area" label="区域" width="140">
              <template #default="{ row }">
                <span>{{ row.area || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="capacity" label="容量" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.capacity" size="small">{{ row.capacity }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="二维码Key" min-width="220">
              <template #default="{ row }">
                <div class="qr-key-cell">
                  <span class="qr-key-text" v-if="row.qrCodeKey">{{ row.qrCodeKey }}</span>
                  <span v-else class="muted">未生成</span>
                  <el-button link type="primary" size="small" @click="copyKey(row)" v-if="row.qrCodeKey">复制</el-button>
                  <el-button link type="primary" size="small" @click="regenKey(row)">重置</el-button>
                  <el-button link type="primary" size="small" @click="showQr(row)">二维码</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
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
          <el-input v-model="form.qrCodeKey" placeholder="留空或输入 generate 自动生成" />
          <div style="margin-top:4px; font-size:12px; color:#888">保存时留空 / 输入 generate 将自动生成</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible=false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="qrVisible" title="桌号二维码" width="340px">
      <div v-if="qrLoading" style="text-align:center; padding:40px 0"><a-spin /></div>
      <div v-else style="text-align:center">
        <img v-if="qrUrl" :src="qrUrl" style="width:260px; height:260px; border:1px solid #eee; padding:4px; background:#fff" />
        <div style="margin-top:8px; font-size:12px; color:#666">可直接下载或长按保存用于店内张贴</div>
      </div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import "@/style/css/list.less";
import { ref, reactive, onMounted, computed } from 'vue';
import { listShopTable, createShopTable, updateShopTable, deleteShopTable, buildPublicTableQrcodeUrl } from './api/shopTable';
import { message, Modal } from 'ant-design-vue';

interface ShopTable { id:number; shopId:number; tableNo:string; capacity?:number; area?:string; qrCodeKey?:string; sort?:number }

const records = ref<ShopTable[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const editingId = ref<number|null>(null);
const formRef = ref();
const form = reactive<any>({ tableNo:'', capacity:undefined, area:'', qrCodeKey:'' });
const submitting = ref(false);
const search = reactive({ keyword:'', area:'' });
const qrVisible = ref(false);
const qrUrl = ref('');
const qrLoading = ref(false);
// 假设从 localStorage 获取当前店铺 ID
const shopId = Number(localStorage.getItem('shopId')) || 0;

const filtered = computed(()=>{
  return records.value.filter(r => {
    const k = search.keyword.trim();
    const af = search.area.trim();
    return (!k || r.tableNo.toLowerCase().includes(k.toLowerCase())) && (!af || (r.area||'').toLowerCase().includes(af.toLowerCase()));
  });
});

async function fetchList(){
  if(!shopId){ message.warning('缺少 shopId'); return; }
  loading.value = true;
  try {
  const res:any = await listShopTable(shopId);
  const raw = res?.data?.records || res?.records || [];
  // 映射 snake_case -> camelCase
  records.value = raw.map((r:any)=>({
    id: r.id,
    shopId: r.shop_id ?? r.shopId,
    tableNo: r.table_no ?? r.tableNo,
    capacity: r.capacity,
    area: r.area,
    qrCodeKey: r.qr_code_key ?? r.qrCodeKey,
    sort: r.sort
  }));
  } finally { loading.value = false; }
}

function resetForm(){
  form.tableNo=''; form.capacity=undefined; form.area=''; form.qrCodeKey='';
}
function openCreate(){ editingId.value=null; resetForm(); modalVisible.value=true; }
function openEdit(r:ShopTable){
  editingId.value = r.id;
  form.tableNo = r.tableNo;
  form.capacity = r.capacity || undefined;
  form.area = r.area || '';
  form.qrCodeKey = r.qrCodeKey || '';
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

function copyKey(r:ShopTable){
  if(!r.qrCodeKey){ message.warning('暂无 Key'); return; }
  navigator.clipboard.writeText(r.qrCodeKey).then(()=>message.success('已复制'));
}

async function regenKey(r:ShopTable){
  try {
    await updateShopTable(r.id, { shopId, tableNo: r.tableNo, capacity: r.capacity, area: r.area, qrCodeKey: 'generate' });
    message.success('已重新生成');
    fetchList();
  } catch(e:any){ message.error(e?.message||'重置失败'); }
}

function showQr(r:ShopTable){
  qrVisible.value = true;
  qrLoading.value = true;
  // 直接构建图片 URL
  qrUrl.value = buildPublicTableQrcodeUrl(r.id);
  // 简单等待图片加载完成（可选改进：监听 img load 事件）
  setTimeout(()=>{ qrLoading.value = false; }, 400);
}

function onSearch(){ fetchList(); }
function resetFilter(){ search.keyword=''; search.area=''; fetchList(); }

onMounted(fetchList);

function rowKey(row:ShopTable){ return row.id; }
</script>
<style scoped>
/* 样式优化 */
.toolbar-row { margin:8px 0 12px; }
.total-text { color:#666; font-size:12px; }
.table-container { position:relative; min-height:260px; }
.table-loading-holder { display:flex; align-items:center; justify-content:center; height:260px; }
.table-content { margin-top: 0; }
.qr-key-cell { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.qr-key-text { font-family:monospace; background:#f6f6f6; padding:2px 6px; border-radius:4px; }
.muted { color:#bbb; }
</style>