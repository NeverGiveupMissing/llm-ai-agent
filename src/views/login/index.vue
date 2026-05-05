<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>AI Agent 平台</h1>
        <p>欢迎回来，请登录</p>
      </div>

      <BaseForm
        ref="formRef"
        v-model="formData"
        :fields="formFields"
        label-placement="left"
        label-width="80px"
        :rules="customRules"
      >
        <template #actions>
          <n-button
            type="primary"
            size="large"
            block
            @click="isRegisterMode ? handleRegister() : handleLogin()"
          >
            {{ isRegisterMode ? '注册' : '登录' }}
          </n-button>
        </template>
      </BaseForm>

      <div class="login-footer">
        <span>{{ isRegisterMode ? '已有账号？' : '还没有账号？' }}</span>
        <n-button text type="primary" @click="toggleMode">
          {{ isRegisterMode ? '立即登录' : '立即注册' }}
        </n-button>
      </div>

      <CopyrightFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { login, register } from '@/api/auth'
import CopyrightFooter from '@/components/CopyrightFooter.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const formRef = ref(null)
const isRegisterMode = ref(false) // 切换登录/注册模式

const formData = reactive({
  user_name: 'admin',
  password: 'admin123',
  confirm_password: '',
})

// 表单字段配置
const formFields = computed(() => [
  {
    key: 'user_name',
    label: '用户名',
    type: 'input',
    required: true,
    placeholder: '请输入用户名',
    rules: [{ min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }],
  },
  {
    key: 'password',
    label: '密码',
    type: 'password',
    required: true,
    placeholder: '请输入密码',
    rules: [{ min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }],
  },
  {
    key: 'confirm_password',
    label: '确认密码',
    type: 'password',
    required: isRegisterMode.value,
    hidden: !isRegisterMode.value,
    placeholder: '请再次输入密码',
    rules: [
      {
        validator: (rule, value) => {
          return value === formData.password
        },
        message: '两次密码输入不一致',
        trigger: 'blur',
      },
    ],
  },
])

// 自定义规则（BaseForm 会自动合并 field.rules）
const customRules = {}

// 登录处理
const handleLogin = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    message.error('请填写完整信息')
    return
  }

  try {
    const res = await login({
      user_name: formData.user_name,
      password: formData.password,
    })

    // 保存 token
    userStore.setToken(res.data.token)
    
    // ✅ 保存用户信息到 store（避免刷新页面时重复请求）
    userStore.setUserInfo({
      user_id: res.data.user_id,
      user_name: res.data.user_name,
      nick_name: res.data.nick_name,
      avatar: res.data.avatar,
    })

    message.success('登录成功')

    // ✅ 不在登录页加载权限，让路由守卫统一处理
    // 跳转到 dashboard，路由守卫会自动加载权限和菜单
    console.log('✅ 准备跳转到 /dashboard')
    router.push('/dashboard')
  } catch (error) {
    message.error(error.message || '登录失败，请检查用户名和密码')
  }
}

// 注册处理
const handleRegister = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    message.error('请填写完整信息')
    return
  }

  try {
    await register({
      user_name: formData.user_name,
      password: formData.password,
    })

    message.success('注册成功，请登录')
    isRegisterMode.value = false
    formData.password = ''
    formData.confirm_password = ''
  } catch (error) {
    message.error(error.message || '注册失败')
  }
}

// 切换登录/注册模式
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  formData.password = ''
  formData.confirm_password = ''
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
