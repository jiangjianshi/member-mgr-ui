<template>
  <div class="bind-card-page">
    <!-- Page Header -->
    <div class="page-header">
      <el-button link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <span class="page-title">创建新卡</span>
    </div>

    <el-row :gutter="20">
      <!-- Left Panel -->
      <el-col :span="14">
        <!-- Member Search -->
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

            <!-- Selected Member Info -->
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

        <!-- Card Template Selection -->
        <div class="panel" v-if="selectedMember">
          <div class="panel-header">
            <el-icon size="18"><CreditCard /></el-icon>
            <span>选择卡模板</span>
            <span class="panel-badge">{{ templateList.length }}个可用</span>
          </div>
          <div class="panel-body">
            <div class="template-grid" v-if="templateList.length">
              <div
                v-for="tpl in templateList"
                :key="tpl.id"
                class="template-card"
                :class="[`type-${tpl.cardType}`, { selected: form.templateId === tpl.id }]"
                @click="selectTemplate(tpl)"
              >
                <div class="template-card-header">
                  <span class="template-card-type">{{ cardTypeLabel(tpl.cardType) }}</span>
                  <el-icon v-if="form.templateId === tpl.id" class="template-check"><Check /></el-icon>
                </div>
                <div class="template-card-name">{{ tpl.name }}</div>
                <div class="template-card-price">¥{{ tpl.price }}</div>
                <div class="template-card-desc" v-if="tpl.cardType === 2">含 {{ tpl.totalTimes ?? '-' }} 次</div>
                <div class="template-card-desc" v-else-if="tpl.cardType === 3">{{ tpl.validDays || tpl.durationDays || '-' }} 天有效</div>
              </div>
            </div>
            <el-empty v-else description="暂无可用的卡模板" :image-size="80" />
          </div>
        </div>

        <!-- Payment Info -->
        <div class="panel" v-if="form.templateId">
          <div class="panel-header">
            <el-icon size="18"><Wallet /></el-icon>
            <span>支付信息</span>
          </div>
          <div class="panel-body payment-body">
            <div class="payment-row">
              <span class="payment-label">支付方式</span>
              <el-radio-group v-model="form.payMethod">
                <el-radio-button :label="1">现金</el-radio-button>
                <el-radio-button :label="2">微信</el-radio-button>
                <el-radio-button :label="3">支付宝</el-radio-button>
                <el-radio-button :label="4">银行卡</el-radio-button>
              </el-radio-group>
            </div>
            <div class="payment-row">
              <span class="payment-label">实付金额</span>
              <el-input-number v-model="form.actualAmount" :min="0" :precision="2" size="large" style="width: 200px" />
            </div>
            <div class="payment-row">
              <span class="payment-label">操作员工</span>
              <el-input v-model="form.operator" size="large" disabled style="width: 200px" />
            </div>
          </div>
        </div>
      </el-col>

      <!-- Right Panel: Order Summary -->
      <el-col :span="10">
        <div class="panel summary-panel">
          <div class="panel-header">
            <el-icon size="18"><Tickets /></el-icon>
            <span>订单摘要</span>
          </div>
          <div class="panel-body" v-if="form.templateId">
            <div class="summary-item">
              <span class="summary-label">会员</span>
              <span>{{ selectedMember?.name }} {{ selectedMember?.phone }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">卡模板</span>
              <span>{{ selectedTemplate?.name }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">卡类型</span>
              <el-tag :type="typeTagType(selectedTemplate?.cardType)" size="small">
                {{ cardTypeLabel(selectedTemplate?.cardType) }}
              </el-tag>
            </div>
            <div class="summary-item">
              <span class="summary-label">售价</span>
              <span class="summary-price">¥{{ selectedTemplate?.price || 0 }}</span>
            </div>
            <el-divider style="margin: 12px 0" />
            <div class="summary-item">
              <span class="summary-label">支付方式</span>
              <span>{{ payMethodLabel(form.payMethod) }}</span>
            </div>
            <div class="summary-item" v-if="form.actualAmount != null && form.actualAmount !== selectedTemplate?.price">
              <span class="summary-label">实付金额</span>
              <span class="summary-price">¥{{ form.actualAmount }}</span>
            </div>
            <div class="summary-item" v-if="form.operator">
              <span class="summary-label">操作员工</span>
              <span>{{ form.operator }}</span>
            </div>

            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="showConfirmDialog"
            >
              确认创建
            </el-button>
          </div>
          <div class="panel-body" v-else>
            <el-empty description="请先选择会员和卡模板" :image-size="100" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Confirm Dialog -->
    <el-dialog v-model="confirmVisible" title="确认创建新卡" width="440px" :close-on-click-modal="false">
      <div class="confirm-content">
        <div class="confirm-row">
          <span class="confirm-label">会员</span>
          <span>{{ selectedMember?.name }} {{ selectedMember?.phone }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">卡模板</span>
          <span>{{ selectedTemplate?.name }}（{{ cardTypeLabel(selectedTemplate?.cardType) }}）</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">售价</span>
          <span class="total-num">¥{{ selectedTemplate?.price || 0 }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">支付方式</span>
          <span>{{ payMethodLabel(form.payMethod) }}</span>
        </div>
        <div class="confirm-row" v-if="form.actualAmount != null">
          <span class="confirm-label">实付金额</span>
          <span class="total-num">¥{{ form.actualAmount }}</span>
        </div>
        <div class="confirm-row">
          <span class="confirm-label">操作员工</span>
          <span>{{ form.operator }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">确认创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowLeft, ArrowRight, Loading, CreditCard, Wallet, Tickets, Check } from '@element-plus/icons-vue'
import { searchMemberByPhone } from '@/api/member'
import { getActiveCardTemplates, bindMemberCard } from '@/api/cardTemplate'
import { getUser } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const templateList = ref([])
const searchResults = ref([])
const searchLoading = ref(false)
const searchQuery = ref('')
const selectedMember = ref(null)
const confirmVisible = ref(false)

const currentUser = getUser()

const form = reactive({
  memberId: null,
  templateId: null,
  payMethod: 1,
  actualAmount: null,
  operator: currentUser?.name || ''
})

const selectedTemplate = computed(() =>
  templateList.value.find(t => t.id === form.templateId)
)

const cardTypeLabel = (type) => {
  const map = { 1: '储值卡', 2: '次卡', 3: '时限卡' }
  return map[type] || ''
}

const typeTagType = (type) => {
  const map = { 1: '', 2: 'success', 3: 'warning' }
  return map[type] || ''
}

const payMethodLabel = (v) => {
  const map = { 1: '现金', 2: '微信', 3: '支付宝', 4: '银行卡' }
  return map[v] || ''
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
  form.memberId = null
  form.templateId = null
  form.actualAmount = null
}

const selectMember = (member) => {
  selectedMember.value = member
  searchResults.value = []
  searchQuery.value = ''
  form.memberId = member.id
  form.templateId = null
  form.actualAmount = null
}

const selectTemplate = (tpl) => {
  form.templateId = tpl.id
  form.actualAmount = tpl.price
}

const showConfirmDialog = () => {
  if (!form.memberId) {
    ElMessage.warning('请先搜索并选择会员')
    return
  }
  if (!form.templateId) {
    ElMessage.warning('请选择卡模板')
    return
  }
  confirmVisible.value = true
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await bindMemberCard({
      memberId: form.memberId,
      templateId: form.templateId,
      payMethod: form.payMethod,
      actualAmount: form.actualAmount,
      operator: form.operator
    })
    ElMessage.success('创建成功')
    confirmVisible.value = false
    setTimeout(() => {
      router.push('/memberCard')
    }, 500)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getActiveCardTemplates()
    templateList.value = res.data || []
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped lang="scss">
.bind-card-page {
  padding: 0;
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
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

// Template Grid
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-card {
  padding: 20px 16px;
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
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);

    &.type-1 { border-color: #409eff; }
    &.type-2 { border-color: #67c23a; }
    &.type-3 { border-color: #e6a23c; }
  }

  &.type-1 {
    background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
    .template-card-type { background: #409eff; }
  }

  &.type-2 {
    background: linear-gradient(135deg, #f0fdf4, #e8f8e8);
    .template-card-type { background: #67c23a; }
  }

  &.type-3 {
    background: linear-gradient(135deg, #fef8f0, #fdf2e2);
    .template-card-type { background: #e6a23c; }
  }
}

.template-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.template-card-type {
  font-size: 11px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}

.template-check {
  color: #409eff;
  font-size: 18px;
}

.template-card-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.template-card-price {
  font-size: 28px;
  font-weight: 700;
  color: #f56c6c;
  margin-bottom: 4px;
}

.template-card-desc {
  font-size: 13px;
  color: #909399;
}

// Payment
.payment-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.payment-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.payment-label {
  font-size: 14px;
  color: #606266;
  min-width: 72px;
  text-align: right;
}

// Summary Panel
.summary-panel {
  position: sticky;
  top: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  min-width: 64px;
  flex-shrink: 0;
}

.summary-price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
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

.confirm-label {
  color: #909399;
  min-width: 64px;
  flex-shrink: 0;
}

.total-num {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}
</style>
