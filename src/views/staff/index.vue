<template>
  <div class="staff-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择" clearable style="width: 100px">
            <el-option label="管理员" :value="1" />
            <el-option label="技师" :value="2" />
            <el-option label="收银员" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增员工</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="data-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="所属门店" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handlePerformance(row)">业绩</el-button>
            <el-button 
              :type="row.status === 1 ? 'danger' : 'success'" 
              link 
              @click="handleStatusChange(row)"
            >
              {{ row.status === 1 ? '离职' : '复职' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑员工' : '新增员工'" width="500px">
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择">
            <el-option label="管理员" :value="1" />
            <el-option label="技师" :value="2" />
            <el-option label="收银员" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属门店" prop="storeId">
          <el-select v-model="form.storeId" placeholder="请选择">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 业绩弹窗 -->
    <el-dialog v-model="perfDialogVisible" title="业绩统计" width="600px">
      <div class="perf-stats">
        <el-statistic title="累计服务次数" :value="performance.totalCount" />
        <el-statistic title="累计业绩" :value="performance.totalAmount" prefix="¥" />
        <el-statistic title="本月业绩" :value="performance.monthAmount" prefix="¥" />
      </div>
      <el-table :data="performance.records" max-height="300">
        <el-table-column prop="serviceName" label="服务项目" />
        <el-table-column prop="count" label="服务次数" width="100" />
        <el-table-column prop="amount" label="业绩金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStaffList, saveStaff, updateStaff, deleteStaff } from '@/api/staff'
import { getStoreList } from '@/api/store'
import { getStaffPerformance } from '@/api/staff'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const storeList = ref([])
const searchForm = reactive({ name: '', phone: '', role: null })
const pagination = reactive({ page: 1, size: 10, total: 0 })
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  name: '',
  phone: '',
  password: '',
  role: null,
  storeId: null
})
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }]
}

const perfDialogVisible = ref(false)
const performance = ref({ totalCount: 0, totalAmount: 0, monthAmount: 0, records: [] })

const getRoleType = (role) => {
  const map = { 1: 'danger', 2: 'warning', 3: 'success' }
  return map[role] || 'info'
}

const getRoleText = (role) => {
  const map = { 1: '管理员', 2: '技师', 3: '收银员' }
  return map[role] || '未知'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getStaffList({ ...searchForm, page: pagination.page, size: pagination.size })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreList({ page: 1, size: 100 })
    storeList.value = res.data.records
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.phone = ''
  searchForm.role = null
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  form.id = null
  form.name = ''
  form.phone = ''
  form.password = ''
  form.role = null
  form.storeId = null
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.phone = row.phone
  form.password = ''
  form.role = row.role
  form.storeId = row.storeId
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await updateStaff(form)
      ElMessage.success('修改成功')
    } else {
      await saveStaff(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleStatusChange = async (row) => {
  const newStatus = row.status === 1 ? 2 : 1
  const action = newStatus === 1 ? '复职' : '离职'
  try {
    await ElMessageBox.confirm(`确定要${action}该员工吗？`, '提示', { type: 'warning' })
    await updateStaff({ id: row.id, status: newStatus })
    ElMessage.success(`${action}成功`)
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handlePerformance = async (row) => {
  try {
    const res = await getStaffPerformance(row.id)
    performance.value = res.data
    perfDialogVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
  fetchStores()
})
</script>

<style scoped lang="scss">
.staff-page {
  padding: 0;
}
.perf-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}
</style>