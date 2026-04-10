<template>
  <div class="points-page">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
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
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="points" label="当前积分" width="100">
          <template #default="{ row }">
            <span class="points-value">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
            <el-button type="success" link @click="handleSignIn(row)">签到</el-button>
            <el-button type="warning" link @click="handleExchange(row)">兑换</el-button>
            <el-button type="info" link @click="handleAdjust(row)">调整</el-button>
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
    
    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="积分详情" width="600px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="会员">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="当前积分">
          <span class="points-value">{{ detailData.points }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="累计获得">{{ detailData.totalEarned }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>积分记录</el-divider>
      <el-table :data="logList" max-height="300" stripe>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : row.type === 2 ? 'warning' : 'info'">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100">
          <template #default="{ row }">
            <span :class="row.type === 1 ? 'points-plus' : 'points-minus'">
              {{ row.type === 1 ? '+' : '-' }}{{ Math.abs(row.points) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" />
        <el-table-column prop="createTime" label="时间" width="180" />
      </el-table>
    </el-dialog>
    
    <!-- 兑换弹窗 -->
    <el-dialog v-model="exchangeDialogVisible" title="积分兑换" width="500px">
      <el-form :model="exchangeForm" :rules="exchangeRules" ref="exchangeRef" label-width="100px">
        <el-form-item label="当前积分">
          <span class="points-value">{{ currentMember?.points }}</span>
        </el-form-item>
        <el-form-item label="选择商品" prop="goodsId">
          <el-select v-model="exchangeForm.goodsId" placeholder="请选择商品" @change="handleGoodsChange">
            <el-option 
              v-for="goods in goodsList" 
              :key="goods.id" 
              :label="`${goods.name} (${goods.points}积分)`" 
              :value="goods.id" 
              :disabled="goods.points > currentMember?.points"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换数量" prop="quantity">
          <el-input-number v-model="exchangeForm.quantity" :min="1" :max="maxExchangeQty" />
        </el-form-item>
        <el-form-item label="扣除积分">
          <span class="points-value">{{ exchangeForm.goodsId ? exchangeForm.quantity * selectedGoods?.points : 0 }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExchangeSubmit">确定兑换</el-button>
      </template>
    </el-dialog>
    
    <!-- 调整弹窗 -->
    <el-dialog v-model="adjustDialogVisible" title="调整积分" width="400px">
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustRef" label-width="80px">
        <el-form-item label="当前积分">
          <span class="points-value">{{ currentMember?.points }}</span>
        </el-form-item>
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="adjustForm.type">
            <el-radio :label="1">增加</el-radio>
            <el-radio :label="2">扣减</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="adjustForm.points" :min="1" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdjustSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getMemberList, signIn as memberSignIn } from '@/api/member'
import { getPointsLogs, exchangePoints, adjustPoints } from '@/api/points'
import { getPointsGoodsList } from '@/api/points'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ phone: '', name: '' })
const pagination = reactive({ page: 1, size: 10, total: 0 })

const detailDialogVisible = ref(false)
const detailData = ref(null)
const logList = ref([])

const exchangeDialogVisible = ref(false)
const currentMember = ref(null)
const goodsList = ref([])
const exchangeForm = reactive({ goodsId: null, quantity: 1 })
const exchangeRules = {
  goodsId: [{ required: true, message: '请选择商品', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}
const selectedGoods = computed(() => goodsList.value.find(g => g.id === exchangeForm.goodsId))
const maxExchangeQty = computed(() => currentMember.value ? Math.floor(currentMember.value.points / (selectedGoods.value?.points || 1)) : 0)

const adjustDialogVisible = ref(false)
const adjustForm = reactive({ type: 1, points: 0, reason: '' })
const adjustRules = {
  points: [{ required: true, message: '请输入积分', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
}

const getTypeText = (type) => {
  const map = { 1: '获得', 2: '扣减', 3: '兑换' }
  return map[type] || '未知'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getMemberList({ ...searchForm, page: pagination.page, size: pagination.size })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.phone = ''; searchForm.name = ''; handleSearch() }

const handleDetail = async (row) => {
  try {
    const res = await getPointsLogs(row.id)
    detailData.value = row
    logList.value = res.data
    detailDialogVisible.value = true
  } catch (e) { console.error(e) }
}

const handleSignIn = async (row) => {
  try {
    const res = await memberSignIn(row.id)
    ElMessage.success(`签到成功，当前积分：${res.data}`)
    fetchData()
  } catch (e) { console.error(e) }
}

const fetchGoods = async () => {
  try {
    const res = await getPointsGoodsList({ status: 1, page: 1, size: 100 })
    goodsList.value = res.data.records
  } catch (e) { console.error(e) }
}

const handleExchange = (row) => {
  currentMember.value = row
  exchangeForm.goodsId = null
  exchangeForm.quantity = 1
  exchangeDialogVisible.value = true
  if (goodsList.value.length === 0) fetchGoods()
}

const handleGoodsChange = () => { exchangeForm.quantity = 1 }

const handleExchangeSubmit = async () => {
  if (!exchangeForm.goodsId) return
  try {
    await exchangePoints({
      memberId: currentMember.value.id,
      goodsId: exchangeForm.goodsId,
      quantity: exchangeForm.quantity
    })
    ElMessage.success('兑换成功')
    exchangeDialogVisible.value = false
    fetchData()
  } catch (e) { console.error(e) }
}

const handleAdjust = (row) => {
  currentMember.value = row
  adjustForm.type = 1
  adjustForm.points = 0
  adjustForm.reason = ''
  adjustDialogVisible.value = true
}

const handleAdjustSubmit = async () => {
  try {
    await adjustPoints({
      memberId: currentMember.value.id,
      type: adjustForm.type,
      points: adjustForm.points,
      reason: adjustForm.reason
    })
    ElMessage.success('调整成功')
    adjustDialogVisible.value = false
    fetchData()
  } catch (e) { console.error(e) }
}

onMounted(() => { fetchData() })
</script>

<style scoped lang="scss">
.points-page {
  padding: 0;
}
.points-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}
.points-plus {
  color: #67c23a;
  font-weight: 600;
}
.points-minus {
  color: #f56c6c;
  font-weight: 600;
}
</style>