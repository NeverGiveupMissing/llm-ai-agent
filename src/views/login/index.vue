<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>AI Agent 平台</h1>
        <p>欢迎回来，请登录</p>
      </div>

      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            size="large"
            clearable
          />
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password-on="click"
            clearable
          />
        </n-form-item>

        <n-form-item v-if="isRegisterMode" label="确认密码" path="confirmPassword">
          <n-input
            v-model:value="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            show-password-on="click"
            clearable
          />
        </n-form-item>

        <n-form-item>
          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            @click="isRegisterMode ? handleRegister() : handleLogin()"
          >
            {{ isRegisterMode ? '注册' : '登录' }}
          </n-button>
        </n-form-item>
      </n-form>

      <div class="login-footer">
        <span>{{ isRegisterMode ? '已有账号？' : '还没有账号？' }}</span>
        <n-button text type="primary" @click="toggleMode">
          {{ isRegisterMode ? '立即登录' : '立即注册' }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/modules/user'
import { login, register } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const isRegisterMode = ref(false) // 切换登录/注册模式

const formData = reactive({
  username: 'admin',
  password: 'admin123',
  confirmPassword: '', // 注册时确认密码
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value) => {
        return value === formData.password
      },
      message: '两次密码输入不一致',
      trigger: 'blur',
    },
  ],
}

// 登录处理
const handleLogin = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      message.error('请填写完整信息')
      return
    }

    loading.value = true

    try {
      const res = await login({
        username: formData.username,
        password: formData.password,
      })

      // 保存 token
      userStore.setToken(res.data.token)
      message.success('登录成功')
      
      // 跳转到之前想访问的页面，或者默认首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } catch (error) {
      message.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      loading.value = false
    }
  })
}

// 注册处理
const handleRegister = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      message.error('请填写完整信息')
      return
    }

    loading.value = true

    try {
      await register({
        username: formData.username,
        password: formData.password,
      })

      message.success('注册成功，请登录')
      isRegisterMode.value = false
      formData.password = ''
      formData.confirmPassword = ''
    } catch (error) {
      message.error(error.message || '注册失败')
    } finally {
      loading.value = false
    }
  })
}

// 切换登录/注册模式
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  formData.password = ''
  formData.confirmPassword = ''
  formRef.value?.restoreValidation()
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-header p {
  font-size: 14px;
  color: #666;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.login-footer span {
  margin-right: 8px;
}
</style>
