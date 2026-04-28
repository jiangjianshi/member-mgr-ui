<template>
  <div class="card-template-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="模板名称">
          <el-input v-model="searchForm.name" placeholder="请输入模板名称" clearable />
        </el-form-item>
        <el-form-item label="卡类型">
          <el-select v-model="searchForm.cardType" placeholder="请选择" clearable style="width: 100px">
            <el-option label="储值卡" :value="1" />
            <el-option label="次卡" :value="2" />
            <el-option label="时限卡" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增模板</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="data-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="模板名称" width="150" />
        <el-table-column prop="cardType" label="卡类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.cardType === 1 ? '储值卡' : row.cardType === 2 ? '次卡' : '时限卡' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="100">
          <template #default="{ row }">
            ¥{{ row.price || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="discountRate" label="折扣率" width="100">
          <template #default="{ row }">
            {{ row.discountRate ? (row.discountRate * 10).toFixed(1) + '折' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalTimes" label="总次数" width="80" />
        <el-table-column prop="validDays" label="有效天数" width="100">
          <template #default="{ row }">
            {{ row.validDays === 0 ? '永久' : row.validDays + '天' }}
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive === 1 ? 'success' : 'info'">
              {{ row.isActive === 1 ? '在售' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="卡类型" prop="cardType">
          <el-radio-group v-model="form.cardType" :disabled="isEdit">
            <el-radio :label="1">储值卡</el-radio>
            <el-radio :label="2">次卡</el-radio>
            <el-radio :label="3">时限卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="售价" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="折扣率" v-if="form.cardType === 1">
          <el-input-number v-model="form.discountRate" :min="0" :max="1" :precision="2" :step="0.05" />
          <span style="margin-left: 10px">0.85表示85折</span>
        </el-form-item>
        <el-form-item label="总次数" v-if="form.cardType === 2">
          <el-input-number v-model="form.totalTimes" :min="1" />
        </el-form-item>
        <el-form-item label="有效天数" v-if="form.cardType !== 1 || form.cardType === 3">
          <el-input-number v-model="form.validDays" :min="0" />
          <span style="margin-left: 10px">0表示永久</span>
        </el-form-item>
        <el-form-item label="是否在售">
          <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCardTemplateList, saveCardTemplate, updateCardTemplate, deleteCardTemplate } from '@/api/cardTemplate'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ name: '', cardType: null })
const pagination = reactive({ page: 1, size: 10, total: 0 })
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  name: '',
  cardType: 1,
  price: 0,
  discountRate: 0,
  totalTimes: 0,
  validDays: 0,
  isActive: 1,
  sortOrder: 0
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  cardType: [{ required: true, message: '请选择卡类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getCardTemplateList({ ...searchForm, page: pagination.page, size: pagination.size })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.name = ''; searchForm.cardType = null; handleSearch() }

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', cardType: 1, price: 0, discountRate: 0, totalTimes: 0, validDays: 0, isActive: 1, sortOrder: 0 })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    if (isEdit.value) {
      await updateCardTemplate(form)
      ElMessage.success('修改成功')
    } else {
      await saveCardTemplate(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗？', '提示', { type: 'warning' })
    await deleteCardTemplate(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => { fetchData() })
</script>