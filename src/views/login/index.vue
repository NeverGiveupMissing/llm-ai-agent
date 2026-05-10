<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>AI Agent 平台</h1>
        <p>{{ isRegisterMode ? '欢迎注册' : '欢迎回来，请登录' }}</p>
      </div>

      <BaseForm
        ref="formRef"
        v-model="formData"
        :fields="formFields"
        label-placement="left"
        label-width="80px"
        :rules="customRules"
      >
        <!-- 验证码输入框 -->
        <template #field-code>
          <div class="captcha-wrapper">
            <n-input
              v-model:value="formData.code"
              placeholder="请输入验证码"
              maxlength="4"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaImg" :src="captchaImg" alt="验证码" />
              <span v-else>点击获取</span>
            </div>
          </div>
        </template>

        <template #actions>
          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { login, register, getCaptcha } from '@/api/auth'
import CopyrightFooter from '@/components/CopyrightFooter.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const formRef = ref(null)
const isRegisterMode = ref(false) // 切换登录/注册模式
const loading = ref(false) // 加载状态
const captchaImg = ref('') // 验证码图片
const captchaUuid = ref('') // 验证码 UUID

const formData = reactive({
  user_name: 'admin',
  password: 'admin123',
  confirm_password: '',
  code: '', // 验证码
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
  {
    key: 'code',
    label: '验证码',
    type: 'custom',
    required: true,
    rules: [{ min: 4, max: 4, message: '请输入4位验证码', trigger: 'blur' }],
  },
])

// 自定义规则（BaseForm 会自动合并 field.rules）
const customRules = {}

/**
 * 获取验证码
 */
const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    captchaUuid.value = res.data.uuid
    // 将 SVG 转换为 Data URL
    const svgBlob = new Blob([res.data.img], { type: 'image/svg+xml' })
    captchaImg.value = URL.createObjectURL(svgBlob)
  } catch (error) {
    console.error('获取验证码失败:', error)
    message.error('获取验证码失败')
  }
}

// 登录处理
const handleLogin = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    message.error('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const res = await login({
      user_name: formData.user_name,
      password: formData.password,
      code: formData.code,
      uuid: captchaUuid.value,
    })

    // 保存 token
    userStore.setToken(res.data.token)
    
    // ✅ 若依标准流程：保存用户信息
    userStore.setUserInfo({
      user_id: res.data.user_id,
      user_name: res.data.user_name,
      nick_name: res.data.nick_name,
      avatar: res.data.avatar,
      email: res.data.email,
      phonenumber: res.data.phonenumber,
      roles: res.data.roles,
      permissions: res.data.permissions || [],
    })

    console.log('✅ [Login] 用户信息已保存:', userStore.userInfo)
    console.log('✅ [Login] Token 已保存:', userStore.token)
    console.log('✅ [Login] 权限状态:', permissionStore.isPermissionLoaded)

    message.success('登录成功')

    // ✅ 若依标准流程：重置权限状态，让路由守卫重新加载
    // 这样确保每次登录都从后端获取最新的菜单和权限
    permissionStore.resetPermission()
    
    // 跳转到 dashboard，路由守卫会自动调用 GetInfo 和 GenerateRoutes
    const redirect = route.query.redirect || '/dashboard'
    console.log('🚀 [Login] 即将跳转到:', redirect)
    router.push(redirect)
  } catch (error) {
    message.error(error.message || '登录失败，请检查用户名和密码')
    // 登录失败后刷新验证码
    refreshCaptcha()
    formData.code = ''
  } finally {
    loading.value = false
  }
}

// 注册处理
const handleRegister = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    message.error('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await register({
      user_name: formData.user_name,
      password: formData.password,
      code: formData.code,
      uuid: captchaUuid.value,
    })

    message.success('注册成功，请登录')
    isRegisterMode.value = false
    formData.password = ''
    formData.confirm_password = ''
    formData.code = ''
    refreshCaptcha()
  } catch (error) {
    message.error(error.message || '注册失败')
    refreshCaptcha()
    formData.code = ''
  } finally {
    loading.value = false
  }
}

// 切换登录/注册模式
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  formData.password = ''
  formData.confirm_password = ''
  formData.code = ''
  formRef.value?.restoreValidation()
  refreshCaptcha()
}

// 组件挂载时获取验证码
onMounted(() => {
  refreshCaptcha()
})
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

/* 验证码样式 */
.captcha-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-wrapper .n-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  transition: all 0.3s;
}

.captcha-image:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-image span {
  font-size: 12px;
  color: #999;
}
</style>
