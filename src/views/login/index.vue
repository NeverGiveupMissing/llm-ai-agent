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

        <n-form-item>
          <n-button type="primary" size="large" block :loading="loading" @click="handleLogin">
            登录
          </n-button>
        </n-form-item>
      </n-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <n-button text type="primary" @click="handleRegister">立即注册</n-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

const router = useRouter()
const message = useMessage()

const formRef = ref(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
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
      // TODO: 调用登录接口
      // const res = await loginApi(formData)
      // localStorage.setItem('access_token', res.data.token)

      // 模拟登录成功
      setTimeout(() => {
        message.success('登录成功')
        router.push('/')
        loading.value = false
      }, 1000)
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
      loading.value = false
    }
  })
}

// 注册
const handleRegister = () => {
  // TODO: 跳转到注册页面
  message.info('注册功能开发中')
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
