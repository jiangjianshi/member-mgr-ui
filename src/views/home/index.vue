<template>
  <div class="home-page">
    <!-- Stat Cards -->
    <div class="stat-cards">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="stat-card"
        :style="{ '--theme': card.color }"
      >
        <div class="stat-icon">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </div>
      </div>
    </div>

    <!-- Two Column Grid -->
    <div class="dashboard-grid">
      <!-- Recent Consumes -->
      <div class="panel">
        <div class="panel-header">
          <el-icon size="18"><Tickets /></el-icon>
          <span>最近消费记录</span>
          <el-button type="primary" link class="panel-action" @click="$router.push('/consume/records')">查看更多 →</el-button>
        </div>
        <div class="panel-body panel-body--flush">
          <el-table :data="recentConsumes" stripe max-height="380" style="width: 100%">
            <el-table-column prop="memberName" label="会员" min-width="100" />
            <el-table-column prop="memberPhone" label="手机号" width="130" />
            <el-table-column prop="serviceItemName" label="项目" min-width="100" />
            <el-table-column prop="paidAmount" label="金额" width="100" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ row.paidAmount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="consumeTime" label="时间" width="170" />
          </el-table>
        </div>
      </div>

      <!-- Card Status Distribution -->
      <div class="panel">
        <div class="panel-header">
          <el-icon size="18"><DataBoard /></el-icon>
          <span>会员卡状态分布</span>
          <span class="panel-badge">{{ totalCards }}张</span>
        </div>
        <div class="panel-body">
          <div class="status-item" v-for="item in cardStatusItems" :key="item.label">
            <div class="status-row">
              <el-tag :type="item.tagType" size="small">{{ item.label }}</el-tag>
              <span class="status-count">{{ item.count }}</span>
            </div>
            <el-progress :percentage="item.percent" :color="item.color" :stroke-width="8" :show-text="false" />
            <span class="status-percent">{{ item.percent }}%</span>
          </div>
          <div class="status-empty" v-if="totalCards === 0">
            <span class="text-muted">暂无数据</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, onDeactivated } from 'vue'
import { User, CirclePlus, ShoppingCart, CreditCard, Wallet, Tickets, DataBoard } from '@element-plus/icons-vue'
import { getMemberList, getTodayNewMemberCount } from '@/api/member'
import { getConsumeList, getRevenue, getTodayConsumeCount } from '@/api/consume'
import { getTodayRechargeAmount } from '@/api/recharge'
import { getMemberCardList } from '@/api/memberCard'

const stats = ref({
  memberTotal: 0,
  todayNewMember: 0,
  todayConsumeCount: 0,
  todayConsume: 0,
  todayRecharge: 0
})

const recentConsumes = ref([])
const cardStats = ref({ normal: 0, expired: 0, loss: 0, cancelled: 0 })

const totalCards = computed(() =>
  (cardStats.value.normal || 0) +
  (cardStats.value.expired || 0) +
  (cardStats.value.loss || 0) +
  (cardStats.value.cancelled || 0)
)

const getPercent = (value) => {
  if (!totalCards.value) return 0
  return Math.round((value || 0) / totalCards.value * 100)
}

const statCards = computed(() => [
  { label: '会员总数', icon: User, color: '#409eff', value: stats.value.memberTotal },
  { label: '今日新增会员', icon: CirclePlus, color: '#67c23a', value: stats.value.todayNewMember },
  { label: '今日消费人数', icon: ShoppingCart, color: '#e6a23c', value: stats.value.todayConsumeCount },
  { label: '今日消费金额', icon: CreditCard, color: '#f56c6c', value: '¥' + (stats.value.todayConsume || 0) },
  { label: '今日充值金额', icon: Wallet, color: '#8e44ad', value: '¥' + (stats.value.todayRecharge || 0) }
])

const cardStatusItems = computed(() => [
  { label: '正常', tagType: 'success', color: '#67c23a', count: cardStats.value.normal, percent: getPercent(cardStats.value.normal) },
  { label: '过期', tagType: 'warning', color: '#e6a23c', count: cardStats.value.expired, percent: getPercent(cardStats.value.expired) },
  { label: '挂失', tagType: 'danger', color: '#f56c6c', count: cardStats.value.loss, percent: getPercent(cardStats.value.loss) },
  { label: '注销', tagType: 'info', color: '#909399', count: cardStats.value.cancelled, percent: getPercent(cardStats.value.cancelled) }
])

const fetchDashboard = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const [memberRes, todayMemberRes, consumeRes, revenueRes, rechargeRes, cardRes, consumeCountRes] =
      await Promise.all([
        getMemberList({ page: 1, size: 1 }),
        getTodayNewMemberCount(),
        getConsumeList({ page: 1, size: 7 }),
        getRevenue({ start: today, end: today }),
        getTodayRechargeAmount(),
        getMemberCardList({ page: 1, size: 100 }),
        getTodayConsumeCount().catch(() => ({ data: 0 }))
      ])

    stats.value.memberTotal = memberRes.data.total
    stats.value.todayNewMember = todayMemberRes.data
    stats.value.todayConsume = revenueRes.data
    stats.value.todayRecharge = rechargeRes.data
    stats.value.todayConsumeCount = consumeCountRes.data
    recentConsumes.value = consumeRes.data.records

    const cards = cardRes.data.records
    cardStats.value = { normal: 0, expired: 0, loss: 0, cancelled: 0 }
    cards.forEach(card => {
      if (card.status === 1) cardStats.value.normal++
      else if (card.status === 2) cardStats.value.expired++
      else if (card.status === 3) cardStats.value.loss++
      else if (card.status === 4) cardStats.value.cancelled++
    })
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => { fetchDashboard() })

onActivated(() => {
  window.addEventListener('store-changed', fetchDashboard)
})

onDeactivated(() => {
  window.removeEventListener('store-changed', fetchDashboard)
})
</script>

<style scoped lang="scss">
.home-page {
  padding: 0;
}

// Stat Cards Row
.stat-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--theme);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-body {
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  white-space: nowrap;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

// Two-Column Grid
.dashboard-grid {
  display: flex;
  gap: 20px;
  align-items: flex-start;

  > .panel:first-child {
    flex: 1;
    min-width: 0;
  }

  > .panel:last-child {
    width: 380px;
    flex-shrink: 0;
  }
}

// Panel
.panel {
  background: #fff;
  border-radius: 8px;
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

.panel-action {
  margin-left: auto;
  font-size: 13px;
}

.panel-body {
  padding: 20px;

  &--flush {
    padding: 0;
  }
}

// Amount styling
.amount {
  color: #67c23a;
  font-weight: 600;
}

// Card Status
.status-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-count {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.status-percent {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.status-empty {
  text-align: center;
  padding: 40px 0;

  .text-muted {
    color: #c0c4cc;
    font-size: 14px;
  }
}
</style>
