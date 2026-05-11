<template>
  <div class="points-page">
    <!-- Search Panel -->
    <div class="panel">
      <div class="panel-header">
        <el-icon size="18"><Search /></el-icon>
        <span>会员查询</span>
      </div>
      <div class="panel-body">
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
    </div>

    <!-- Member List Panel -->
    <div class="panel">
      <div class="panel-header">
        <el-icon size="18"><User /></el-icon>
        <span>会员积分</span>
        <span class="panel-badge">{{ pagination.total }}条记录</span>
      </div>
      <div class="panel-body" style="padding: 0">
        <el-table :data="tableData" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="points" label="当前积分" width="120">
            <template #default="{ row }">
              <span class="points-value">{{ row.points }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="260">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleDetail(row)">
                <el-icon><Tickets /></el-icon> 详情
              </el-button>
              <el-button type="success" link @click="handleSignIn(row)">
                <el-icon><Calendar /></el-icon> 签到
              </el-button>
              <el-button type="warning" link @click="handleExchange(row)">
                <el-icon><Present /></el-icon> 兑换
              </el-button>
              <el-button type="info" link @click="handleAdjust(row)">
                <el-icon><Setting /></el-icon> 调整
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
          style="padding: 16px 20px; justify-content: flex-end"
        />
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailDialogVisible" title="积分详情" width="620px">
      <div class="detail-header" v-if="detailData">
        <div class="detail-member">
          <div class="detail-avatar">{{ detailData.name?.charAt(0) || '?' }}</div>
          <div class="detail-info">
            <div class="detail-name">{{ detailData.name }}</div>
            <div class="detail-phone">{{ detailData.phone }}</div>
          </div>
        </div>
        <div class="detail-stats">
          <div class="stat-item">
            <span class="stat-num current">{{ detailData.points }}</span>
            <span class="stat-label">当前积分</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num earned">{{ detailData.totalEarned }}</span>
            <span class="stat-label">累计获得</span>
          </div>
        </div>
      </div>
      <el-divider style="margin: 12px 0" />
      <div class="log-title">积分记录</div>
      <el-table :data="logList" max-height="350" stripe style="margin-top: 12px">
        <el-table-column prop="sourceDesc" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.change > 0 ? 'success' : 'danger'" size="small">
              {{ row.sourceDesc }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="change" label="积分" width="90">
          <template #default="{ row }">
            <span :class="row.change > 0 ? 'points-plus' : 'points-minus'">
              {{ row.change > 0 ? '+' : '' }}{{ row.change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="90">
          <template #default="{ row }">{{ row.balance }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" min-width="140" />
        <el-table-column prop="createTime" label="时间" width="170" />
      </el-table>
    </el-dialog>

    <!-- Exchange Dialog -->
    <el-dialog v-model="exchangeDialogVisible" title="积分兑换" width="480px">
      <el-form :model="exchangeForm" :rules="exchangeRules" ref="exchangeRef" label-width="80px">
        <el-form-item label="当前积分">
          <span class="points-value">{{ currentMember?.points }}</span>
        </el-form-item>
        <el-form-item label="选择商品" prop="goodsId">
          <el-select v-model="exchangeForm.goodsId" placeholder="请选择商品" @change="handleGoodsChange" style="width: 100%">
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
          <span class="points-value deduct">
            {{ exchangeForm.goodsId ? exchangeForm.quantity * selectedGoods?.points : 0 }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExchangeSubmit">确定兑换</el-button>
      </template>
    </el-dialog>

    <!-- Adjust Dialog -->
    <el-dialog v-model="adjustDialogVisible" title="调整积分" width="460px">
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustRef" label-width="80px">
        <el-form-item label="当前积分">
          <span class="points-value">{{ currentMember?.points }}</span>
        </el-form-item>
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="adjustForm.type">
            <el-radio-button :label="1">增加</el-radio-button>
            <el-radio-button :label="2">扣减</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="adjustForm.points" :min="1" size="large" style="width: 200px" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" placeholder="请输入调整原因" />
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
import { ref, reactive, computed, onMounted, onActivated, onDeactivated } from 'vue'
import { Search, User, Tickets, Calendar, Present, Setting } from '@element-plus/icons-vue'
import { getMemberList, signIn as memberSignIn } from '@/api/member'
import { getPointsLogs, exchangePoints, adjustPoints } from '@/api/points'
import { getPointsGoodsList } from '@/api/points'
import { ElMessage } from 'element-plus'

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
const maxExchangeQty = computed(() => {
  const price = selectedGoods.value?.points || 1
  const balance = currentMember.value?.points || 0
  return Math.floor(balance / price)
})

const adjustDialogVisible = ref(false)
const adjustForm = reactive({ type: 1, points: 0, reason: '' })
const adjustRules = {
  points: [
    { required: true, message: '请输入积分', trigger: 'blur' },
    { type: 'number', min: 1, message: '积分必须大于0', trigger: 'blur' }
  ],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
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
    const logs = res.data || []
    detailData.value = {
      ...row,
      totalEarned: logs.filter(l => l.change > 0).reduce((s, l) => s + l.change, 0)
    }
    logList.value = logs
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

onActivated(() => {
  window.addEventListener('store-changed', fetchData)
})

onDeactivated(() => {
  window.removeEventListener('store-changed', fetchData)
})
</script>

<style scoped lang="scss">
.points-page {
  padding: 0;
}

// Panel
.panel {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-badge {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.panel-body {
  padding: 20px;
}

// Points value
.points-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;

  &.deduct {
    color: #f56c6c;
  }
}

.points-plus {
  color: #67c23a;
  font-weight: 600;
}

.points-minus {
  color: #f56c6c;
  font-weight: 600;
}

// Detail Dialog
.detail-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.detail-member {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.detail-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-phone {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.detail-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;

  &.current {
    color: #409eff;
  }

  &.earned {
    color: #67c23a;
  }
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #e4e7ed;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
