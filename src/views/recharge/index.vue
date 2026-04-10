<template>
  <div class="recharge-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="会员手机">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="充值时间">
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
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="memberPhone" label="会员手机" width="130" />
        <el-table-column prop="memberName" label="会员姓名" width="100" />
        <el-table-column prop="cardName" label="会员卡" width="150" />
        <el-table-column prop="amount" label="充值金额" width="100">
          <template #default="{ row }">
            <span class="amount-plus">+¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="giftAmount" label="赠送金额" width="100">
          <template #default="{ row }">
            <span v-if="row.giftAmount > 0" class="amount-gift">+¥{{ row.giftAmount }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="充值时间" width="180" />
        <el-table-column prop="payMethod" label="支付方式" width="100">
          <template #default="{ row }">
            <el-tag>{{ getPayMethodText(row.payMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="80">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
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
    
    <el-dialog v-model="detailDialogVisible" title="充值详情" width="500px">
      <el-descriptions :column="1" border v-if="detailData">
        <el-descriptions-item label="订单编号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="会员">{{ detailData.memberName }} ({{ detailData.memberPhone }})</el-descriptions-item>
        <el-descriptions-item label="会员卡">{{ detailData.cardName }}</el-descriptions-item>
        <el-descriptions-item label="充值金额">¥{{ detailData.amount }}</el-descriptions-item>
        <el-descriptions-item label="赠送金额">{{ detailData.giftAmount > 0 ? '¥' + detailData.giftAmount : '无' }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPayMethodText(detailData.payMethod) }}</el-descriptions-item>
        <el-descriptions-item label="充值时间">{{ detailData.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getRechargeList, getRechargeDetail } from '@/api/recharge'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ phone: '' })
const dateRange = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const detailDialogVisible = ref(false)
const detailData = ref(null)

const getPayMethodText = (method) => {
  const map = { cash: '现金', wechat: '微信', alipay: '支付宝', bank: '银行卡' }
  return map[method] || method
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
    const res = await getRechargeList(params)
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.phone = ''; dateRange.value = []; handleSearch() }

const handleDetail = async (row) => {
  try {
    const res = await getRechargeDetail(row.id)
    detailData.value = res.data
    detailDialogVisible.value = true
  } catch (e) { console.error(e) }
}

onMounted(() => { fetchData() })
</script>

<style scoped lang="scss">
.recharge-page {
  padding: 0;
}
.amount-plus {
  color: #67c23a;
  font-weight: 600;
}
.amount-gift {
  color: #e6a23c;
  font-weight: 600;
}
</style>