<template>
  <div class="pay-page">
    <!-- Step Indicator -->
    <div class="steps-bar">
      <div class="step" :class="{ done: currentStep > 1, active: currentStep >= 1 }">
        <div class="step-dot">
          <el-icon v-if="currentStep > 1"><Check /></el-icon>
          <span v-else>1</span>
        </div>
        <span class="step-label">选择会员</span>
      </div>
      <div class="step-line" :class="{ done: currentStep > 1 }" />
      <div class="step" :class="{ done: currentStep > 2, active: currentStep >= 2 }">
        <div class="step-dot">
          <el-icon v-if="currentStep > 2"><Check /></el-icon>
          <span v-else>2</span>
        </div>
        <span class="step-label">选择会员卡</span>
      </div>
      <div class="step-line" :class="{ done: currentStep > 2 }" />
      <div class="step" :class="{ done: currentStep > 3, active: currentStep >= 3 }">
        <div class="step-dot">
          <el-icon v-if="currentStep > 3"><Check /></el-icon>
          <span v-else>3</span>
        </div>
        <span class="step-label">添加服务</span>
      </div>
      <div class="step-line" :class="{ done: currentStep > 3 }" />
      <div class="step" :class="{ active: currentStep >= 4 }">
        <div class="step-dot"><span>4</span></div>
        <span class="step-label">确认收款</span>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- Left Panel: Search → Card → Service Items -->
      <el-col :span="14">
        <!-- Search Member -->
        <div class="panel">
          <div class="panel-header">
            <el-icon size="18"><Search /></el-icon>
            <span>会员查询</span>
          </div>
          <div class="panel-body">
            <div class="search-box">
              <el-input
                v-model="searchQuery"
                placeholder="输入会员手机号搜索（至少4位）"
                size="large"
                clearable
                @input="handleRemoteSearch(searchQuery)"
                @clear="onClearMember"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <div class="search-results" v-if="searchResults.length && !selectedMember">
                <div
                  v-for="m in searchResults"
                  :key="m.id"
                  class="result-item"
                  @click="selectMember(m)"
                >
                  <div class="result-avatar">{{ m.name?.charAt(0) || '?' }}</div>
                  <div class="result-info">
                    <span class="result-name">{{ m.name }}</span>
                    <span class="result-phone">{{ m.phone }}</span>
                  </div>
                  <el-icon class="result-arrow"><ArrowRight /></el-icon>
                </div>
              </div>
              <div class="search-hint" v-if="searchLoading">
                <el-icon class="is-loading"><Loading /></el-icon> 搜索中...
              </div>
            </div>

            <!-- Selected Member Card -->
            <div v-if="selectedMember" class="member-card">
              <div class="mc-avatar">{{ selectedMember.name?.charAt(0) || '?' }}</div>
              <div class="mc-info">
                <div class="mc-name">{{ selectedMember.name }}</div>
                <div class="mc-phone">{{ selectedMember.phone }}</div>
              </div>
              <div class="mc-tags">
                <el-tag :type="selectedMember.status === 1 ? 'success' : 'warning'" size="small">
                  {{ selectedMember.status === 1 ? '正常' : '冻结' }}
                </el-tag>
                <el-tag type="info" size="small">{{ selectedMember.points || 0 }} 积分</el-tag>
              </div>
              <el-button link type="danger" @click="onClearMember">更换</el-button>
            </div>
          </div>
        </div>

        <!-- Card Selection -->
        <div class="panel" v-if="selectedMember">
          <div class="panel-header">
            <el-icon size="18"><CreditCard /></el-icon>
            <span>选择会员卡</span>
            <span class="panel-badge" v-if="memberCards.length">{{ memberCards.length }}张可用</span>
          </div>
          <div class="panel-body">
            <div class="card-grid" v-if="memberCards.length">
              <div
                v-for="card in memberCards"
                :key="card.id"
                class="vip-card"
                :class="[`type-${card.cardType}`, { selected: selectedCardId === card.id }]"
                @click="selectCard(card)"
              >
                <div class="vip-card-header">
                  <span class="vip-card-type">{{ cardTypeLabel(card.cardType) }}</span>
                  <el-icon v-if="selectedCardId === card.id" class="vip-card-check"><Check /></el-icon>
                </div>
                <div class="vip-card-name">{{ card.templateName }}</div>
                <div class="vip-card-no">{{ card.cardNo }}</div>
                <div class="vip-card-value" v-if="card.cardType === 1">
                  <span class="vip-card-amount">¥{{ card.balance }}</span>
                  <span class="vip-card-unit">余额</span>
                </div>
                <div class="vip-card-value" v-else-if="card.cardType === 2">
                  <span class="vip-card-amount">{{ card.remainingTimes }}</span>
                  <span class="vip-card-unit">剩余次数</span>
                </div>
                <div class="vip-card-value" v-else>
                  <span class="vip-card-amount">{{ card.expireDate || '-' }}</span>
                  <span class="vip-card-unit">到期日</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="该会员暂无可用会员卡" :image-size="80" />
          </div>
        </div>

        <!-- Service Items -->
        <div class="panel" v-if="selectedCardId">
          <div class="panel-header">
            <el-icon size="18"><Goods /></el-icon>
            <span>服务项目</span>
          </div>
          <div class="panel-body">
            <div class="service-grid" v-if="serviceItems.length">
              <div
                v-for="item in serviceItems"
                :key="item.id"
                class="service-card"
                @click="addToCart(item)"
              >
                <div class="svc-name">{{ item.name }}</div>
                <div class="svc-price">¥{{ item.price }}</div>
                <div class="svc-duration" v-if="item.duration">{{ item.duration }}分钟</div>
                <div class="svc-add">+ 添加</div>
              </div>
            </div>
            <el-empty v-else description="暂无上架服务项目" :image-size="80" />
          </div>
        </div>
      </el-col>

      <!-- Right Panel: Cart -->
      <el-col :span="10">
        <div class="panel cart-panel" :class="{ empty: cart.length === 0 }">
          <div class="panel-header">
            <el-icon size="18"><ShoppingCart /></el-icon>
            <span>购物车</span>
            <span class="panel-badge" v-if="cart.length">{{ cart.length }}项</span>
          </div>
          <div class="panel-body">
            <div v-if="cart.length === 0" class="cart-empty-state">
              <el-empty description="请选择会员和服务项目" :image-size="120" />
            </div>
            <template v-else>
              <div class="cart-items">
                <div v-for="(item, index) in cart" :key="item.id" class="cart-item">
                  <div class="cart-item-main">
                    <span class="cart-item-name">{{ item.name }}</span>
                    <span class="cart-item-price">¥{{ item.price }}</span>
                  </div>
                  <div class="cart-item-actions">
                    <el-input-number
                      v-model="item.quantity"
                      :min="1"
                      :max="99"
                      size="small"
                      controls-position="right"
                      @change="updateCart(item, index)"
                    />
                    <span class="cart-item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
                    <el-button link type="danger" @click="removeFromCart(index)" class="delete-btn">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="cart-summary">
                <div class="summary-line">
                  <span>原价合计</span>
                  <span>¥{{ originalTotal.toFixed(2) }}</span>
                </div>
                <div class="summary-line discount" v-if="selectedCard?.discountRate > 0">
                  <span>折扣优惠 ({{ (selectedCard.discountRate * 10).toFixed(1) }}折)</span>
                  <span>-¥{{ (originalTotal - needPayTotal).toFixed(2) }}</span>
                </div>
                <div class="summary-line total">
                  <span>应付金额</span>
                  <span class="total-num">¥{{ needPayTotal.toFixed(2) }}</span>
                </div>
                <div class="summary-line" v-if="selectedCard?.cardType === 1">
                  <span>卡内余额</span>
                  <span :class="{ warn: selectedCard.balance < needPayTotal }">
                    ¥{{ (selectedCard.balance || 0).toFixed(2) }}
                  </span>
                </div>
              </div>

              <div class="payment-badge" v-if="selectedCard?.cardType === 1">
                <el-icon><InfoFilled /></el-icon> 卡内余额支付
              </div>
              <div class="payment-badge warn" v-else-if="selectedCard?.cardType === 2">
                <el-icon><InfoFilled /></el-icon> 将消耗 {{ cart.reduce((s, i) => s + (i.quantity || 1), 0) }} 次卡内次数
              </div>

              <el-button
                type="primary"
                size="large"
                class="pay-btn"
                :loading="submitting"
                @click="showConfirmDialog"
              >
                确认收款 ¥{{ needPayTotal.toFixed(2) }}
              </el-button>
            </template>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Confirm Dialog -->
    <el-dialog v-model="confirmVisible" title="确认收款" width="440px" :close-on-click-modal="false">
      <div class="confirm-content">
        <div class="confirm-row">
          <span class="confirm-label">会员</span>
          <span>{{ selectedMember?.name }} {{ selectedMember?.phone }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">会员卡</span>
          <span>{{ selectedCard?.templateName }} ({{ cardTypeLabel(selectedCard?.cardType) }})</span>
        </div>
        <div class="confirm-section">
          <div class="confirm-label">服务项目</div>
          <div v-for="(item, i) in cart" :key="i" class="confirm-item-line">
            <span>{{ item.name }} × {{ item.quantity }}</span>
            <span>¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <el-divider style="margin: 12px 0" />
        <div class="confirm-total">
          <span>应付金额</span>
          <span class="total-num">¥{{ needPayTotal.toFixed(2) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确认收款 ¥{{ needPayTotal.toFixed(2) }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, ArrowRight, Loading, CreditCard, Goods, ShoppingCart, Delete, InfoFilled, Check } from '@element-plus/icons-vue'
import { searchMemberByPhone } from '@/api/member'
import { getMemberCardList } from '@/api/memberCard'
import { getServiceItemList } from '@/api/serviceItem'
import { doConsume } from '@/api/consume'
import { ElMessage } from 'element-plus'

const selectedMember = ref(null)
const memberCards = ref([])
const selectedCardId = ref(null)
const selectedCard = computed(() => memberCards.value.find(c => c.id === selectedCardId.value))
const searchResults = ref([])
const searchLoading = ref(false)
const searchQuery = ref('')
const serviceItems = ref([])
const cart = ref([])
const submitting = ref(false)
const confirmVisible = ref(false)

const currentStep = computed(() => {
  if (cart.value.length > 0) return 4
  if (selectedCardId.value) return 3
  if (selectedMember.value) return 2
  return 1
})

const originalTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
)

const needPayTotal = computed(() => {
  if (selectedCard.value?.discountRate > 0) {
    return originalTotal.value * selectedCard.value.discountRate
  }
  return originalTotal.value
})

const cardTypeLabel = (type) => {
  const map = { 1: '储值卡', 2: '次卡', 3: '时限卡' }
  return map[type] || ''
}

let searchTimer = null

const handleRemoteSearch = (query) => {
  if (!query || query.length < 4) {
    searchResults.value = []
    return
  }
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    try {
      const res = await searchMemberByPhone(query)
      searchResults.value = res.data || []
    } catch (e) {
      console.error(e)
    } finally {
      searchLoading.value = false
    }
  }, 300)
}

const onClearMember = () => {
  selectedMember.value = null
  searchResults.value = []
  searchQuery.value = ''
  selectedCardId.value = null
  memberCards.value = []
  cart.value = []
}

const selectMember = async (member) => {
  selectedMember.value = member
  searchResults.value = []
  searchQuery.value = ''
  selectedCardId.value = null
  memberCards.value = []
  cart.value = []

  try {
    const cardRes = await getMemberCardList({ memberId: member.id })
    memberCards.value = cardRes.data.records.filter(c => c.status === 1)
  } catch (e) {
    console.error(e)
  }
}

const selectCard = (card) => {
  selectedCardId.value = card.id
  cart.value = []
}

const fetchServiceItems = async () => {
  try {
    const res = await getServiceItemList({ status: 1, page: 1, size: 100 })
    serviceItems.value = res.data.records
  } catch (e) {
    console.error(e)
  }
}

const addToCart = (item) => {
  const exist = cart.value.find(c => c.id === item.id)
  if (exist) {
    exist.quantity++
  } else {
    cart.value.push({ ...item, quantity: 1 })
  }
}

const updateCart = (item, index) => {
  cart.value[index] = item
}

const removeFromCart = (index) => {
  cart.value.splice(index, 1)
}

const showConfirmDialog = () => {
  if (!selectedMember.value || !selectedCardId.value || cart.value.length === 0) return

  if (selectedCard.value?.cardType === 1 && selectedCard.value.balance < needPayTotal.value) {
    ElMessage.warning('卡内余额不足')
    return
  }

  confirmVisible.value = true
}

const refreshCards = async () => {
  if (!selectedMember.value) return
  try {
    const cardRes = await getMemberCardList({ memberId: selectedMember.value.id })
    memberCards.value = cardRes.data.records.filter(c => c.status === 1)
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    await doConsume({
      memberId: selectedMember.value.id,
      cardId: selectedCardId.value,
      items: cart.value.map(item => ({
        serviceItemId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      originalTotal: originalTotal.value,
      discountRate: selectedCard.value?.discountRate || 0,
      paidAmount: needPayTotal.value,
      paymentMethods: ['card']
    })
    ElMessage.success(`收款成功！实收 ¥${needPayTotal.value.toFixed(2)}`)
    cart.value = []
    confirmVisible.value = false
    await refreshCards()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchServiceItems()
})
</script>

<style scoped lang="scss">
.pay-page {
  padding: 0;
}

// Step Bar
.steps-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 24px;
  gap: 0;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c0c4cc;
  transition: color 0.3s;

  &.active {
    color: #409eff;
    .step-dot {
      background: #409eff;
      border-color: #409eff;
      color: #fff;
    }
    .step-label {
      font-weight: 600;
    }
  }

  &.done {
    color: #67c23a;
    .step-dot {
      background: #67c23a;
      border-color: #67c23a;
      color: #fff;
    }
  }
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #fff;
  transition: all 0.3s;
}

.step-label {
  font-size: 13px;
  white-space: nowrap;
}

.step-line {
  width: 48px;
  height: 2px;
  background: #e4e7ed;
  margin: 0 8px;
  transition: background 0.3s;

  &.done {
    background: #67c23a;
  }
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

// Search
.search-box {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
  margin-top: 2px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f5f7fa;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.result-phone {
  font-size: 13px;
  color: #909399;
}

.result-arrow {
  color: #c0c4cc;
}

.search-hint {
  padding: 12px 0;
  color: #909399;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

// Member Card
.member-card {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.mc-avatar {
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

.mc-info {
  flex: 1;
}

.mc-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.mc-phone {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.mc-tags {
  display: flex;
  gap: 6px;
}

// VIP Cards
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.vip-card {
  padding: 16px;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid #e4e7ed;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);

    &.type-1 { border-color: #409eff; }
    &.type-2 { border-color: #67c23a; }
    &.type-3 { border-color: #e6a23c; }
  }

  &.type-1 {
    background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
    .vip-card-amount { color: #409eff; }
    .vip-card-type { background: #409eff; }
  }

  &.type-2 {
    background: linear-gradient(135deg, #f0fdf4, #e8f8e8);
    .vip-card-amount { color: #67c23a; }
    .vip-card-type { background: #67c23a; }
  }

  &.type-3 {
    background: linear-gradient(135deg, #fef8f0, #fdf2e2);
    .vip-card-amount { color: #e6a23c; }
    .vip-card-type { background: #e6a23c; }
  }
}

.vip-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.vip-card-type {
  font-size: 11px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}

.vip-card-check {
  color: #409eff;
  font-size: 16px;
}

.vip-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.vip-card-no {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.vip-card-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.vip-card-amount {
  font-size: 24px;
  font-weight: 700;
}

.vip-card-unit {
  font-size: 13px;
  color: #909399;
}

// Service Grid
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.service-card {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    background: #f0f7ff;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);

    .svc-add {
      opacity: 1;
      color: #409eff;
    }
  }
}

.svc-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.svc-price {
  font-size: 22px;
  font-weight: 700;
  color: #f56c6c;
  margin-bottom: 4px;
}

.svc-duration {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.svc-add {
  font-size: 12px;
  color: #c0c4cc;
  opacity: 0;
  transition: all 0.2s;
  font-weight: 500;
}

// Cart Panel
.cart-panel {
  position: sticky;
  top: 20px;
}

.cart-empty-state {
  padding: 40px 0;
}

.cart-items {
  margin-bottom: 16px;
}

.cart-item {
  padding: 12px 0;
  border-bottom: 1px dashed #ebeef5;

  &:last-child {
    border-bottom: none;
  }
}

.cart-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cart-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.cart-item-price {
  font-size: 13px;
  color: #909399;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cart-item-subtotal {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  min-width: 70px;
  text-align: right;
}

.delete-btn {
  font-size: 16px;
}

// Summary
.cart-summary {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
  color: #606266;

  &.discount {
    color: #67c23a;
  }

  &.total {
    margin-top: 8px;
    padding-top: 10px;
    border-top: 1px solid #e4e7ed;
    font-size: 16px;
    font-weight: 700;
    color: #303133;
  }
}

.total-num {
  font-size: 22px;
  font-weight: 700;
  color: #f56c6c;
}

.warn {
  color: #f56c6c;
  font-weight: 600;
}

// Payment Badge
.payment-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #f0f7ff;
  border-radius: 6px;
  font-size: 13px;
  color: #409eff;
  margin-bottom: 16px;

  &.warn {
    background: #fdf6ec;
    color: #e6a23c;
  }
}

// Pay Button
.pay-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

// Confirm Dialog
.confirm-content {
  font-size: 14px;
}

.confirm-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.confirm-section {
  margin-top: 10px;
}

.confirm-label {
  color: #909399;
  min-width: 56px;
  flex-shrink: 0;
}

.confirm-item-line {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  color: #606266;
}

.confirm-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
</style>
