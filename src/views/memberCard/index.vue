<template>
  <div class="member-card-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="会员ID">
          <el-input v-model="searchForm.memberId" placeholder="会员ID" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="已过期" :value="2" />
            <el-option label="挂失" :value="3" />
            <el-option label="注销" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="$router.push('/memberCard/bind')">绑定新卡</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="data-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="cardNo" label="卡号" width="150" />
        <el-table-column prop="memberName" label="会员姓名" width="100" />
        <el-table-column prop="memberPhone" label="会员手机" width="130" />
        <el-table-column prop="templateName" label="卡模板" width="120" />
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">
            ¥{{ row.balance || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingTimes" label="剩余次数" width="100" />
        <el-table-column prop="startDate" label="开卡日期" width="120" />
        <el-table-column prop="expireDate" label="过期日期" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="warning" link @click="handleReportLoss(row)" v-if="row.status === 1">挂失</el-button>
            <el-button type="success" link @click="handleUnblock(row)" v-if="row.status === 3">解挂</el-button>
            <el-button type="danger" link @click="handleCancel(row)" v-if="row.status !== 4">注销</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getMemberCardList, reportLoss, unblock, cancelCard } from '@/api/memberCard'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ memberId: null, status: null })
const pagination = reactive({ page: 1, size: 10, total: 0 })

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 1: '正常', 2: '已过期', 3: '挂失', 4: '注销' }
  return map[status] || '未知'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getMemberCardList({ ...searchForm, page: pagination.page, size: pagination.size })
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
  searchForm.memberId = null
  searchForm.status = null
  handleSearch()
}

const handleReportLoss = async (row) => {
  try {
    await ElMessageBox.confirm('确定要挂失该会员卡吗？', '提示', { type: 'warning' })
    await reportLoss(row.id)
    ElMessage.success('挂失成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleUnblock = async (row) => {
  try {
    await unblock(row.id)
    ElMessage.success('解挂成功')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('注销后不可恢复，确定要注销该会员卡吗？', '提示', { type: 'warning' })
    await cancelCard(row.id)
    ElMessage.success('注销成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>