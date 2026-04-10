<template>
  <div class="bind-card-page">
    <div class="form-container">
      <el-page-header @back="$router.back()" content="绑定新卡" />
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="margin-top: 30px; max-width: 600px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入会员手机号" @blur="handlePhoneBlur" />
        </el-form-item>
        
        <el-divider content-position="left">会员信息</el-divider>
        
        <el-form-item label="会员姓名">
          <span>{{ memberInfo.name || '-' }}</span>
        </el-form-item>
        <el-form-item label="会员状态">
          <el-tag :type="memberInfo.status === 1 ? 'success' : 'danger'">
            {{ memberInfo.status === 1 ? '正常' : '异常' }}
          </el-tag>
        </el-form-item>
        
        <el-divider content-position="left">绑卡信息</el-divider>
        
        <el-form-item label="选择卡模板" prop="templateId">
          <el-select v-model="form.templateId" placeholder="请选择卡模板" @change="handleTemplateChange" style="width: 100%">
            <el-option
              v-for="item in templateList"
              :key="item.id"
              :label="`${item.name} - ¥${item.price}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="卡类型">
          <span>{{ selectedTemplate?.cardType === 1 ? '储值卡' : selectedTemplate?.cardType === 2 ? '次卡' : '时限卡' }}</span>
        </el-form-item>
        
        <el-form-item label="售价">
          <span>¥{{ selectedTemplate?.price || 0 }}</span>
        </el-form-item>
        
        <el-form-item label="支付方式">
          <el-radio-group v-model="form.payMethod">
            <el-radio :label="1">现金</el-radio>
            <el-radio :label="2">微信</el-radio>
            <el-radio :label="3">支付宝</el-radio>
            <el-radio :label="4">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="实付金额">
          <el-input-number v-model="form.actualAmount" :min="0" :precision="2" />
        </el-form-item>
        
        <el-form-item label="操作员工">
          <el-input v-model="form.operator" placeholder="请输入员工姓名" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">确认绑卡</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getMemberByPhone } from '@/api/member'
import { getActiveCardTemplates, bindMemberCard } from '@/api/cardTemplate'
import { ElMessage } from 'element-plus'

const formRef = ref()
const loading = ref(false)
const memberInfo = ref({})
const templateList = ref([])

const form = reactive({
  memberId: null,
  phone: '',
  templateId: null,
  payMethod: 2,
  actualAmount: null,
  operator: ''
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  templateId: [
    { required: true, message: '请选择卡模板', trigger: 'change' }
  ]
}

const selectedTemplate = computed(() => {
  return templateList.value.find(t => t.id === form.templateId)
})

const handlePhoneBlur = async () => {
  if (!form.phone) return
  try {
    const res = await getMemberByPhone(form.phone)
    memberInfo.value = res.data
    form.memberId = res.data.id
  } catch (e) {
    memberInfo.value = {}
    form.memberId = null
  }
}

const handleTemplateChange = () => {
  if (selectedTemplate.value) {
    form.actualAmount = selectedTemplate.value.price
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  if (!form.memberId) {
    ElMessage.warning('请先查询会员信息')
    return
  }
  
  loading.value = true
  try {
    await bindMemberCard(form)
    ElMessage.success('绑卡成功')
    setTimeout(() => {
      // router.push('/memberCard')
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
  .form-container {
    background: #fff;
    padding: 30px;
    border-radius: 4px;
  }
}
</style>