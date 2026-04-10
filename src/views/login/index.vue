<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>会员管理系统</h1>
      </div>
      
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="手机号码" 
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="登录密码" 
            prefix-icon="Lock"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="captcha">
          <div class="captcha-wrapper">
            <el-input 
              v-model="form.captcha" 
              placeholder="验证码" 
              prefix-icon="CircleCheck"
              size="large"
              class="captcha-input"
              @keyup.enter="handleLogin"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <span v-else class="captcha-loading">加载中...</span>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCaptcha, login } from '@/api/auth'
import { setToken, setUser } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')

const form = reactive({
  phone: '',
  password: '',
  captcha: '',
  captchaKey: '',
  rememberMe: false
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    captchaKey.value = res.data.captchaKey
    // EasyCaptcha的toBase64()已经包含data:image前缀
    captchaImage.value = res.data.captchaImage
    form.captchaKey = captchaKey.value
  } catch (e) {
    console.error(e)
  }
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    
    const res = await login({
      phone: form.phone,
      password: form.password,
      captcha: form.captcha,
      captchaKey: form.captchaKey,
      rememberMe: form.rememberMe
    })
    
    // 保存token和用户信息
    setToken(res.data.token)
    setUser({
      staffId: res.data.staffId,
      name: res.data.name,
      phone: res.data.phone,
      role: res.data.role,
      roleName: res.data.roleName,
      storeId: res.data.storeId,
      storeName: res.data.storeName
    })
    
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (e) {
    // 登录失败刷新验证码
    refreshCaptcha()
    form.captcha = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
}

.login-form {
  .captcha-wrapper {
    display: flex;
    gap: 12px;
    width: 100%;
    
    .captcha-input {
      flex: 1;
    }
    
    .captcha-image {
      width: 130px;
      height: 40px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: #409eff;
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .captcha-loading {
        font-size: 12px;
        color: #999;
      }
    }
  }
  
  .login-button {
    width: 100%;
    font-size: 16px;
    font-weight: 500;
    margin-top: 10px;
  }
}

:deep(.el-input__inner) {
  padding-left: 40px;
}

:deep(.el-input__wrapper) {
  padding-left: 10px;
}
</style>