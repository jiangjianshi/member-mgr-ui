<template>
  <div class="member-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="冻结" :value="2" />
            <el-option label="注销" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="$router.push('/member/register')">新增会员</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="data-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60">
          <template #default="{ row }">
            {{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="birthday" label="生日" width="120" />
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="registerTime" label="注册时间" width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="handleSignIn(row)" v-if="row.status === 1">签到</el-button>
            <el-button 
              :type="row.status === 1 ? 'danger' : 'success'" 
              link 
              @click="handleStatusChange(row)"
              v-if="row.status !== 3"
            >
              {{ row.status === 1 ? '冻结' : '解冻' }}
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
    
    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑会员" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :label="0">未知</el-radio>
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="editForm.birthday" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getMemberList, updateMember, updateMemberStatus, signIn } from '@/api/member'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ phone: '', name: '', status: null })
const pagination = reactive({ page: 1, size: 10, total: 0 })
const editDialogVisible = ref(false)
const editForm = reactive({ id: null, name: '', gender: 0, birthday: '', remark: '' })

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'warning', 3: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 1: '正常', 2: '冻结', 3: '注销' }
  return map[status] || '未知'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getMemberList({ ...searchForm, page: pagination.page, size: pagination.size })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.phone = ''
  searchForm.name = ''
  searchForm.status = null
  handleSearch()
}

const handleEdit = (row) => {
  editForm.id = row.id
  editForm.name = row.name
  editForm.gender = row.gender
  editForm.birthday = row.birthday
  editForm.remark = row.remark
  editDialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await updateMember(editForm)
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleStatusChange = async (row) => {
  const newStatus = row.status === 1 ? 2 : 1
  const action = newStatus === 1 ? '解冻' : '冻结'
  try {
    await ElMessageBox.confirm(`确定要${action}该会员吗？`, '提示', { type: 'warning' })
    await updateMemberStatus({ id: row.id, status: newStatus })
    ElMessage.success(`${action}成功`)
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleSignIn = async (row) => {
  try {
    const res = await signIn(row.id)
    ElMessage.success(`签到成功，当前积分：${res.data}`)
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.member-page {
  padding: 0;
}
</style>