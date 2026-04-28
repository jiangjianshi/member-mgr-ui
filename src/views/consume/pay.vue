<template>
  <div class="pay-page">
    <el-row :gutter="20">
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">会员查询</span>
          </div>
          <div class="panel-body">
            <el-form :inline="true">
              <el-form-item label="手机号">
                <el-select
                  v-model="selectedMemberId"
                  filterable
                  remote
                  :remote-method="handleRemoteSearch"
                  :loading="searchLoading"
                  placeholder="请输入手机号搜索会员（至少4位）"
                  clearable
                  @change="onSelectMember"
                  @clear="onClearMember"
                  style="width: 340px"
                >
                  <el-option
                    v-for="m in searchResults"
                    :key="m.id"
                    :label="`${m.name} - ${m.phone}`"
                    :value="m.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>

            <div v-if="selectedMember" class="member-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="姓名">{{ selectedMember.name }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ selectedMember.phone }}</el-descriptions-item>
                <el-descriptions-item label="可用积分">{{ selectedMember.points }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="selectedMember.status === 1 ? 'success' : 'warning'">
                    {{ selectedMember.status === 1 ? '正常' : '冻结' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>
        
        <div class="panel" v-if="selectedMember">
          <div class="panel-header">
            <span class="panel-title">会员卡</span>
          </div>
          <div class="panel-body">
            <el-radio-group v-model="selectedCardId" @change="handleCardChange">
              <el-radio v-for="card in memberCards" :key="card.id" :label="card.id" border class="card-radio">
                <div class="card-info">
                  <div class="card-name">{{ card.templateName }}</div>
                  <div class="card-balance" v-if="card.cardType === 1">余额: ¥{{ card.balance }}</div>
                  <div class="card-remaining" v-if="card.cardType === 2">剩余次数: {{ card.remainingTimes }}次</div>
                  <div class="card-dates" v-if="card.cardType === 3">到期日: {{ card.expireDate || '-' }}</div>
                  <div class="card-type">{{ card.cardType === 1 ? '储值卡' : card.cardType === 2 ? '次卡' : '时限卡' }} - {{ card.status === 1 ? '正常' : card.status === 2 ? '挂失' : '已注销' }}</div>
                </div>
              </el-radio>
            </el-radio-group>
            <el-empty v-if="memberCards.length === 0" description="该会员暂无会员卡" />
          </div>
        </div>
        
        <div class="panel" v-if="selectedCardId">
          <div class="panel-header">
            <span class="panel-title">服务项目</span>
          </div>
          <div class="panel-body">
            <el-table :data="serviceItems" border stripe max-height="300">
              <el-table-column prop="name" label="项目名称" min-width="100" />
              <el-table-column prop="price" label="价格" width="100">
                <template #default="{ row }">¥{{ row.price }}</template>
              </el-table-column>
              <el-table-column label="时长" width="100">
                <template #default="{ row }">{{ row.duration || 0 }}分钟</template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ row }">
                  <el-button type="primary" link @click="addToCart(row)">添加</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-col>
      
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">收银台</span>
          </div>
          <div class="panel-body">
            <div class="cart-empty" v-if="cart.length === 0">
              <el-empty description="请选择会员和服务项目" />
            </div>
            <div v-else>
              <el-table :data="cart" border stripe>
                <el-table-column prop="name" label="项目" />
                <el-table-column prop="price" label="单价" width="80">
                  <template #default="{ row }">¥{{ row.price }}</template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="110">
                  <template #default="{ row, $index }">
                    <el-input-number v-model="row.quantity" :min="1" :max="10" size="small" style="width: 85px" @change="updateCart(row, $index)" />
                  </template>
                </el-table-column>
                <el-table-column label="小计" width="80">
                  <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="60">
                  <template #default="{ $index }">
                    <el-button type="danger" link @click="removeFromCart($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="summary">
                <div class="summary-row">
                  <span>原价合计:</span>
                  <span>¥{{ originalTotal.toFixed(2) }}</span>
                </div>
                <div class="summary-row" v-if="selectedCard && selectedCard.discountRate > 0">
                  <span>折扣({{ selectedCard.discountRate * 10 }}折):</span>
                  <span>-¥{{ (originalTotal - needPayTotal).toFixed(2) }}</span>
                </div>
                <div class="summary-row total">
                  <span>应付金额:</span>
                  <span>¥{{ needPayTotal.toFixed(2) }}</span>
                </div>
                <div class="summary-row" v-if="selectedCard && selectedCard.cardType === 1">
                  <span>卡内余额:</span>
                  <span>¥{{ selectedCard.balance.toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="payment-method" v-if="selectedCard && selectedCard.cardType === 1">
                <div class="method-title">支付方式</div>
                <el-checkbox-group v-model="paymentMethods">
                  <el-checkbox label="card" :disabled="selectedCard.balance < needPayTotal">卡内支付 (可用 ¥{{ selectedCard.balance }})</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <div class="action-btns">
                <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">确认收款</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
const selectedMemberId = ref(null)
const searchLoading = ref(false)
const serviceItems = ref([])
const cart = ref([])
const paymentMethods = ref(['card'])
const submitting = ref(false)

const originalTotal = computed(() => cart.value.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0))
const needPayTotal = computed(() => {
  if (selectedCard.value && selectedCard.value.discountRate > 0) {
    return originalTotal.value * selectedCard.value.discountRate
  }
  return originalTotal.value
})

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
  selectedCardId.value = null
  memberCards.value = []
  cart.value = []
  paymentMethods.value = ['card']
}

const onSelectMember = (id) => {
  const member = searchResults.value.find(m => m.id === id)
  if (member) selectMember(member)
}

const selectMember = async (member) => {
  selectedMember.value = member
  searchResults.value = []
  selectedMemberId.value = null
  selectedCardId.value = null
  memberCards.value = []
  cart.value = []
  paymentMethods.value = ['card']

  try {
    const cardRes = await getMemberCardList({ memberId: member.id })
    memberCards.value = cardRes.data.records.filter(c => c.status === 1)
  } catch (e) {
    console.error(e)
  }
}

const handleCardChange = () => {
  cart.value = []
  paymentMethods.value = ['card']
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

const handleSubmit = async () => {
  if (!selectedMember.value || !selectedCardId.value || cart.value.length === 0) {
    return
  }
  
  if (paymentMethods.value.length === 0) {
    ElMessage.warning('请选择支付方式')
    return
  }

  if (selectedCard.value.cardType === 1 && selectedCard.value.balance < needPayTotal.value) {
    ElMessage.warning('卡内余额不足')
    return
  }

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
      paymentMethods: paymentMethods.value
    })
    ElMessage.success('收款成功')
    cart.value = []
    selectedCardId.value = null
    paymentMethods.value = ['card']
    selectedMemberId.value = null
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
  padding: 20px;
}
.panel {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.panel-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
}
.panel-body {
  padding: 20px;
}
.member-info {
  margin-top: 15px;
}
.card-radio {
  margin-right: 15px;
  margin-bottom: 15px;
  height: auto;
  .card-info {
    padding: 8px;
    line-height: 1.4;
    min-height: 80px;
    .card-name {
      font-weight: 600;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-balance {
      color: #409eff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .card-remaining {
      color: #409eff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .card-dates {
      color: #409eff;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .card-type {
      font-size: 12px;
      color: #999;
    }
  }
}
.summary {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    &.total {
      font-size: 18px;
      font-weight: 600;
      color: #f56c6c;
      padding-top: 10px;
      border-top: 1px solid #ddd;
    }
  }
}
.payment-method {
  margin-top: 20px;
  .method-title {
    font-weight: 600;
    margin-bottom: 10px;
  }
  .el-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}
.action-btns {
  margin-top: 20px;
  text-align: center;
  .el-button {
    width: 200px;
  }
}
</style>