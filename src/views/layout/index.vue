<template>
  <el-container class="app-container">
    <el-aside 
      class="sidebar" 
      :style="{ width: isCollapse ? '64px' : '220px', minWidth: isCollapse ? '64px' : '220px' }"
    >
      <div class="logo">
        <el-icon :size="24"><Shop /></el-icon>
        <span v-show="!isCollapse">会员管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/home">
          <el-icon><DataAnalysis /></el-icon>
          <span>首页</span>
        </el-menu-item>
        
        <el-sub-menu index="/member">
          <template #title>
            <el-icon><User /></el-icon>
            <span>会员管理</span>
          </template>
          <el-menu-item index="/member">
            <el-icon><User /></el-icon>
            <span>会员列表</span>
          </el-menu-item>
          <el-menu-item index="/member/register">
            <el-icon><Plus /></el-icon>
            <span>注册会员</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/memberCard">
          <template #title>
            <el-icon><CreditCard /></el-icon>
            <span>会员卡管理</span>
          </template>
          <el-menu-item index="/memberCard">
            <el-icon><CreditCard /></el-icon>
            <span>卡列表</span>
          </el-menu-item>
          <el-menu-item index="/memberCard/bind">
            <el-icon><Plus /></el-icon>
            <span>绑定新卡</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/cardTemplate">
          <el-icon><Tickets /></el-icon>
          <span>卡模板</span>
        </el-menu-item>
        
        <el-menu-item index="/store">
          <el-icon><Shop /></el-icon>
          <span>门店管理</span>
        </el-menu-item>
        
        <el-menu-item index="/staff">
          <el-icon><UserFilled /></el-icon>
          <span>员工管理</span>
        </el-menu-item>
        
        <el-menu-item index="/serviceItem">
          <el-icon><SetUp /></el-icon>
          <span>服务项目</span>
        </el-menu-item>
        
        <el-sub-menu index="/consume">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>收银</span>
          </template>
          <el-menu-item index="/consume">
            <el-icon><Money /></el-icon>
            <span>收银台</span>
          </el-menu-item>
          <el-menu-item index="/consume/records">
            <el-icon><Ticket /></el-icon>
            <span>消费记录</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/recharge">
          <el-icon><Wallet /></el-icon>
          <span>充值记录</span>
        </el-menu-item>
        
        <el-sub-menu index="/points">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>积分管理</span>
          </template>
          <el-menu-item index="/points">
            <el-icon><Coin /></el-icon>
            <span>积分记录</span>
          </el-menu-item>
          <el-menu-item index="/points/goods">
            <el-icon><ShoppingBag /></el-icon>
            <span>积分商品</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    
    <el-container class="content-wrapper">
      <el-header class="top-header">
        <div class="header-left">
          <div class="collapse-btn" @click="isCollapse = !isCollapse">
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </div>
          <el-breadcrumb separator="/" v-if="breadcrumbs.length > 0">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
              {{ item.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <span v-else class="page-title">首页</span>
        </div>
        
        <div class="header-right">
          <el-select v-model="currentStoreId" placeholder="请选择门店" class="store-select" @change="handleStoreChange">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              {{ currentUser?.name || '管理员' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  {{ currentUser?.roleName || '员工' }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <div class="tags-view-container">
        <div class="tags-view-wrapper">
          <router-link
            v-for="tag in visitedViews"
            :key="tag.path"
            :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
            class="tags-view-item"
            :class="isActive(tag) ? 'active' : ''"
          >
            {{ tag.meta.title }}
            <el-icon class="tag-close" @click.prevent.stop="closeSelectedTag(tag)"><Close /></el-icon>
          </router-link>
        </div>
        <el-dropdown class="tags-more" @command="handleCommand">
          <el-icon><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="closeAllTags">关闭全部</el-dropdown-item>
              <el-dropdown-item @click="closeOtherTags">关闭其他</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="$route.path" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Shop, User, CreditCard, Tickets, UserFilled, Money, 
  Wallet, Coin, DataAnalysis, ArrowDown, SetUp, Plus, 
  Ticket, ShoppingBag, Fold, Expand, Close, MoreFilled
} from '@element-plus/icons-vue'
import { getStoreList } from '@/api/store'
import { logout } from '@/api/auth'
import { getUser, removeToken, removeUser } from '@/store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)
const activeMenu = ref(route.path)
const storeList = ref([])
const currentStoreId = ref(null)
const visitedViews = ref([])
const currentUser = ref(null)

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta && item.meta.title).slice(1)
})

const isActive = (tag) => {
  return tag.path === route.path
}

const handleStoreChange = (value) => {
  currentStoreId.value = value
  localStorage.setItem('currentStoreId', value)
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
      await logout()
    } catch (e) {
      // 用户取消不处理
    }
    removeToken()
    removeUser()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

const addViewTags = () => {
  if (route.meta.hidden) return
  
  const tag = {
    path: route.path,
    query: route.query,
    fullPath: route.fullPath,
    meta: { ...route.meta }
  }
  
  const exists = visitedViews.value.find(v => v.path === tag.path)
  if (!exists) {
    visitedViews.value.push(tag)
  }
}

const closeSelectedTag = (tag) => {
  const index = visitedViews.value.findIndex(v => v.path === tag.path)
  visitedViews.value.splice(index, 1)
  
  if (isActive(tag)) {
    const lastTag = visitedViews.value[index - 1] || visitedViews.value[index]
    if (lastTag) {
      router.push(lastTag.path)
    } else {
      router.push('/home')
    }
  }
}

const closeAllTags = () => {
  visitedViews.value = []
  router.push('/home')
}

const closeOtherTags = () => {
  visitedViews.value = visitedViews.value.filter(tag => isActive(tag))
}

const fetchStores = async () => {
  try {
    const res = await getStoreList({ page: 1, size: 100 })
    storeList.value = res.data.records
    
    const savedStoreId = localStorage.getItem('currentStoreId')
    if (savedStoreId && storeList.value.find(s => s.id === parseInt(savedStoreId))) {
      currentStoreId.value = parseInt(savedStoreId)
    } else if (storeList.value.length > 0) {
      currentStoreId.value = storeList.value[0].id
      localStorage.setItem('currentStoreId', currentStoreId.value)
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  currentUser.value = getUser()
  fetchStores()
  addViewTags()
})

watch(() => route.path, () => {
  activeMenu.value = route.path
  addViewTags()
})
</script>

<style scoped lang="scss">
.app-container {
  height: 100vh;
}

.sidebar {
  background: #304156;
  transition: all 0.3s;
  overflow: visible;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #263445;
    overflow: hidden;
    white-space: nowrap;
  }
  
  .el-menu {
    border: none;
    
    &:not(.el-menu--collapse) {
      width: 220px;
    }
  }
}

.content-wrapper {
  background: #f5f7fa;
}

.top-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
  height: 60px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .collapse-btn {
      cursor: pointer;
      font-size: 18px;
      &:hover {
        color: #409eff;
      }
    }
    
    .page-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .store-select {
      width: 180px;
    }
    
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 4px;
      
      &:hover {
        background: #f5f7fa;
      }
    }
  }
}

.tags-view-container {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 10px;
  height: 34px;
  
  .tags-view-wrapper {
    display: flex;
    overflow-x: auto;
    flex: 1;
    gap: 5px;
    
    &::-webkit-scrollbar {
      display: none;
    }
    
    .tags-view-item {
      display: flex;
      align-items: center;
      padding: 4px 10px;
      background: #fff;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      font-size: 12px;
      color: #999;
      text-decoration: none;
      white-space: nowrap;
      
      &:hover {
        color: #409eff;
      }
      
      &.active {
        background: #409eff;
        color: #fff;
        border-color: #409eff;
        
        .tag-close {
          color: #fff;
        }
      }
      
      .tag-close {
        margin-left: 5px;
        cursor: pointer;
        &:hover {
          color: #f56c6c;
        }
      }
    }
  }
  
  .tags-more {
    cursor: pointer;
    padding: 4px;
    &:hover {
      color: #409eff;
    }
  }
}

.main-content {
  padding: 20px;
}
</style>