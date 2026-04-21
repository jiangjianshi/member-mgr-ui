<template>
  <div class="register-page">
    <div class="form-container">
      <el-page-header @back="$router.back()" content="注册会员" />
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="margin-top: 30px; max-width: 500px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker 
            v-model="form.birthday" 
            type="date" 
            value-format="YYYY-MM-DD"
            placeholder="选择生日"
          />
        </el-form-item>
        <el-form-item label="头像">
          <el-input v-model="form.avatarUrl" placeholder="头像URL" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">注册</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { registerMember } from '@/api/member'
import { ElMessage } from 'element-plus'

const formRef = ref()
const loading = ref(false)
const form = reactive({
  phone: '',
  name: '',
  gender: 0,
  birthday: '',
  avatarUrl: ''
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    await registerMember(form)
    ElMessage.success('注册成功')
    formRef.value.resetFields()
    setTimeout(() => {
      // router.push('/member')
    }, 500)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page {
  .form-container {
    background: #fff;
    padding: 30px;
    border-radius: 4px;
  }
}
</style>