<template>
  <div class="consume-records-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="会员手机">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="消费时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="data-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="memberPhone" label="会员手机" width="130">
          <template #default="{ row }">{{ maskPhone(row.memberPhone) }}</template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员姓名" width="100" />
        <el-table-column prop="cardName" label="会员卡" width="150">
          <template #default="{ row }">
            <span>{{ row.cardName }}</span>
            <span style="color:#909399; font-size:12px; margin-left:4px">{{ cardTypeText(row.cardType) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="originalTotal" label="原价" width="100">
          <template #default="{ row }">¥{{ row.originalTotal || 0 }}</template>
        </el-table-column>
        <el-table-column prop="discountRate" label="折扣" width="80">
          <template #default="{ row }">{{ row.discountRate > 0 ? (row.discountRate * 10).toFixed(1) + '折' : '无' }}</template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="实收" width="100">
          <template #default="{ row }">¥{{ row.paidAmount }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="消费时间" width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'info'">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button type="danger" link @click="handleUndo(row)" v-if="row.status === 1">撤销</el-button>
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
    
    <el-dialog v-model="detailDialogVisible" title="消费详情" width="600px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="订单编号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="会员">{{ detailData.memberName }} ({{ maskPhone(detailData.memberPhone) }})</el-descriptions-item>
        <el-descriptions-item label="会员卡">{{ detailData.cardName }} ({{ cardTypeText(detailData.cardType) }})</el-descriptions-item>
        <el-descriptions-item label="服务项目">{{ detailData.serviceItemName }}</el-descriptions-item>
        <el-descriptions-item label="消费时间">{{ detailData.consumeTime }}</el-descriptions-item>
        <el-descriptions-item label="原价">¥{{ detailData.originalTotal || 0 }}</el-descriptions-item>
        <el-descriptions-item label="折扣">{{ detailData.discountRate > 0 ? (detailData.discountRate * 10).toFixed(1) + '折' : '无' }}</el-descriptions-item>
        <el-descriptions-item label="实收金额">¥{{ detailData.paidAmount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(detailData.status) }}</el-descriptions-item>
        <el-descriptions-item label="消费次数" v-if="detailData.usedTimes > 0">{{ detailData.usedTimes }}次</el-descriptions-item>
      </el-descriptions>
      <el-divider v-if="detailData?.items?.length">消费明细</el-divider>
      <el-table v-if="detailData?.items?.length" :data="detailData.items" border stripe>
        <el-table-column prop="serviceName" label="项目名称" />
        <el-table-column prop="price" label="单价" width="80">
          <template #default="{ row }">¥{{ row.price || 0 }}</template>
        </el-table-column>
        <el-table-column label="小计" width="100">
          <template #default="{ row }">¥{{ row.subtotal || 0 }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, onDeactivated } from 'vue'
import { getConsumeList, getConsumeDetail, undoConsume } from '@/api/consume'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ phone: '' })
const dateRange = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const detailDialogVisible = ref(false)
const detailData = ref(null)

const getStatusText = (status) => {
  const map = { 1: '正常', 2: '已撤销' }
  return map[status] || '未知'
}

const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone || '-'
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

const cardTypeText = (type) => {
  const map = { 1: '储值卡', 2: '次卡', 3: '时限卡' }
  return map[type] || ''
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      size: pagination.size,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }
    const res = await getConsumeList(params)
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.phone = ''; dateRange.value = []; handleSearch() }

const handleDetail = async (row) => {
  try {
    const res = await getConsumeDetail(row.id)
    detailData.value = res.data
    detailDialogVisible.value = true
  } catch (e) { console.error(e) }
}

const handleUndo = async (row) => {
  try {
    await ElMessageBox.confirm('确定要撤销该消费记录吗？', '提示', { type: 'warning' })
    await undoConsume(row.id)
    ElMessage.success('撤销成功')
    fetchData()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(() => { fetchData() })

onActivated(() => {
  window.addEventListener('store-changed', fetchData)
})

onDeactivated(() => {
  window.removeEventListener('store-changed', fetchData)
})
</script>

<style scoped lang="scss">
.consume-records-page {
  padding: 0;
}
</style>