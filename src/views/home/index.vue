<template>
  <div class="home-page">
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-label">会员总数</div>
        <div class="stat-value">{{ stats.memberTotal || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日新增会员</div>
        <div class="stat-value">{{ stats.todayNewMember || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日消费金额</div>
        <div class="stat-value">¥{{ stats.todayConsume || 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日充值金额</div>
        <div class="stat-value">¥{{ stats.todayRecharge || 0 }}</div>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="data-card">
          <div class="card-header">
            <span class="card-title">最近消费记录</span>
            <el-button type="primary" link @click="$router.push('/consume/records')">查看更多</el-button>
          </div>
          <el-table :data="recentConsumes" max-height="300">
            <el-table-column prop="memberName" label="会员" />
            <el-table-column prop="serviceItemName" label="项目" />
            <el-table-column prop="paidAmount" label="金额">
              <template #default="{ row }">
                ¥{{ row.paidAmount || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="consumeTime" label="时间" />
          </el-table>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="data-card">
          <div class="card-header">
            <span class="card-title">会员卡状态分布</span>
          </div>
          <div class="status-list">
            <div class="status-item">
              <el-tag type="success">正常</el-tag>
              <span class="count">{{ cardStats.normal || 0 }}</span>
              <span class="percent">({{ getPercent(cardStats.normal) }}%)</span>
            </div>
            <div class="status-item">
              <el-tag type="warning">过期</el-tag>
              <span class="count">{{ cardStats.expired || 0 }}</span>
              <span class="percent">({{ getPercent(cardStats.expired) }}%)</span>
            </div>
            <div class="status-item">
              <el-tag type="danger">挂失</el-tag>
              <span class="count">{{ cardStats.loss || 0 }}</span>
              <span class="percent">({{ getPercent(cardStats.loss) }}%)</span>
            </div>
            <div class="status-item">
              <el-tag>注销</el-tag>
              <span class="count">{{ cardStats.cancelled || 0 }}</span>
              <span class="percent">({{ getPercent(cardStats.cancelled) }}%)</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getMemberList, getTodayNewMemberCount } from '@/api/member'
import { getConsumeList, getRevenue } from '@/api/consume'
import { getTodayRechargeAmount } from '@/api/recharge'
import { getMemberCardList } from '@/api/memberCard'

const stats = ref({
  memberTotal: 0,
  todayNewMember: 0,
  todayConsume: 0,
  todayRecharge: 0
})

const recentConsumes = ref([])
const cardStats = ref({})

const totalCards = computed(() => {
  return (cardStats.value.normal || 0) + 
         (cardStats.value.expired || 0) + 
         (cardStats.value.loss || 0) + 
         (cardStats.value.cancelled || 0)
})

const getPercent = (value) => {
  if (!totalCards.value) return 0
  return Math.round((value || 0) / totalCards.value * 100)
}

onMounted(async () => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const [memberRes, todayMemberRes, consumeRes, revenueRes, rechargeRes, cardRes] =
      await Promise.all([
        getMemberList({ page: 1, size: 1 }),
        getTodayNewMemberCount(),
        getConsumeList({ page: 1, size: 5 }),
        getRevenue({ start: today, end: today }),
        getTodayRechargeAmount(),
        getMemberCardList({ page: 1, size: 100 })
      ])

    stats.value.memberTotal = memberRes.data.total
    stats.value.todayNewMember = todayMemberRes.data
    stats.value.todayConsume = revenueRes.data
    stats.value.todayRecharge = rechargeRes.data
    recentConsumes.value = consumeRes.data.records

    const cards = cardRes.data.records
    cards.forEach(card => {
      if (card.status === 1) cardStats.value.normal = (cardStats.value.normal || 0) + 1
      else if (card.status === 2) cardStats.value.expired = (cardStats.value.expired || 0) + 1
      else if (card.status === 3) cardStats.value.loss = (cardStats.value.loss || 0) + 1
      else if (card.status === 4) cardStats.value.cancelled = (cardStats.value.cancelled || 0) + 1
    })
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped lang="scss">
.home-page {
  padding: 0;
}

.stat-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  padding: 24px;
  background: #fff;
  border-radius: 4px;
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 10px;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
  }
}

.data-card {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .card-title {
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.status-list {
  .status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid #f5f7fa;
    
    &:last-child {
      border-bottom: none;
    }
    
    .count {
      font-weight: 600;
    }
    
    .percent {
      color: #909399;
    }
  }
}
</style>