<template>
  <div class="login-container">
    <n-card :bordered="false" class="login-card">
      <div class="login-header">
        <n-text class="login-title">AI Agent 平台</n-text>
        <p>{{ isRegisterMode ? '欢迎注册' : '欢迎回来，请登录' }}</p>
      </div>

      <n-form ref="formRef" :model="formData" :rules="rules" size="large" :show-feedback="false">
        <!-- 用户名 -->
        <n-form-item path="user_name">
          <n-input v-model:value="formData.user_name" placeholder="请输入用户名" clearable>
            <template #prefix>
              <n-icon :component="PersonOutline" />
            </template>
          </n-input>
        </n-form-item>

        <!-- 密码 -->
        <n-form-item path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
            </template>
          </n-input>
        </n-form-item>

        <!-- 注册模式额外字段 -->
        <template v-if="isRegisterMode">
          <!-- 昵称 -->
          <n-form-item path="nick_name">
            <n-input v-model:value="formData.nick_name" placeholder="请输入昵称" clearable>
              <template #prefix>
                <n-icon :component="PersonOutline" />
              </template>
            </n-input>
          </n-form-item>

          <!-- 邮箱 -->
          <n-form-item path="email">
            <n-input v-model:value="formData.email" placeholder="请输入邮箱" clearable>
              <template #prefix>
                <n-icon :component="MailOutline" />
              </template>
            </n-input>
          </n-form-item>

          <!-- 手机号 -->
          <n-form-item path="phonenumber">
            <n-input v-model:value="formData.phonenumber" placeholder="请输入手机号" clearable>
              <template #prefix>
                <n-icon :component="CallOutline" />
              </template>
            </n-input>
          </n-form-item>
        </template>

        <!-- 验证码 -->
        <n-form-item path="code">
          <n-grid :cols="24" :x-gap="10">
            <n-grid-item :span="15">
              <n-input
                v-model:value="formData.code"
                placeholder="请输入验证码"
                maxlength="4"
                clearable
                @keyup.enter="handleSubmit"
              >
                <template #prefix>
                  <n-icon :component="KeyOutline" />
                </template>
              </n-input>
            </n-grid-item>
            <n-grid-item :span="9">
              <div class="captcha-image" @click="refreshCaptcha" title="点击刷新验证码">
                <img v-if="captchaImg" :src="captchaImg" alt="验证码" />
                <span v-else>点击获取</span>
              </div>
            </n-grid-item>
          </n-grid>
        </n-form-item>

        <!-- 记住密码（仅登录模式显示） -->
        <n-form-item v-if="!isRegisterMode" class="remember-item">
          <n-checkbox v-model:checked="formData.rememberMe">记住密码</n-checkbox>
        </n-form-item>

        <!-- 提交按钮 -->
        <n-form-item>
          <n-button
            native-type="submit"
            type="primary"
            secondary
            strong
            size="medium"
            block
            :loading="loading"
            @click="handleSubmit"
            style="background-color: #1890ff; border-color: #1890ff; color: #fff"
          >
            {{ isRegisterMode ? '注 册' : '登 录' }}
          </n-button>
        </n-form-item>
      </n-form>

      <div class="login-footer">
        <span>{{ isRegisterMode ? '已有账号？' : '还没有账号？' }}</span>
        <n-button text type="primary" @click="toggleMode">
          {{ isRegisterMode ? '立即登录' : '立即注册' }}
        </n-button>
      </div>

      <CopyrightFooter />
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { PersonOutline, LockClosedOutline, KeyOutline, MailOutline, CallOutline } from '@vicons/ionicons5'
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
const isRegisterMode = ref(false)
const loading = ref(false)
const captchaImg = ref('')
const captchaUuid = ref('')

const formData = reactive({
  user_name: 'common',
  password: 'common',
  confirm_password: '',
  nick_name: '',
  email: '',
  phonenumber: '',
  code: '',
  rememberMe: false,
})

const rules = {
  user_name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirm_password: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value) => value === formData.password,
      message: '两次密码输入不一致',
      trigger: 'blur',
    },
  ],
  nick_name: [{ required: false, trigger: 'blur' }],
  email: [
    {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ],
  phonenumber: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

/** 获取验证码 */
const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    captchaUuid.value = res.data.uuid
    const svgBlob = new Blob([res.data.img], { type: 'image/svg+xml' })
    captchaImg.value = URL.createObjectURL(svgBlob)
  } catch (error) {
    console.error('获取验证码失败:', error)
    message.error('获取验证码失败')
  }
}

/** 提交表单 */
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    const payload = {
      user_name: formData.user_name,
      password: formData.password,
      code: formData.code,
      uuid: captchaUuid.value,
    }

    if (isRegisterMode.value) {
      const registerPayload = {
        user_name: formData.user_name,
        password: formData.password,
        nick_name: formData.nick_name,
        email: formData.email,
        phonenumber: formData.phonenumber,
        code: formData.code,
        uuid: captchaUuid.value,
      }
      await register(registerPayload)
      message.success('注册成功，请登录')
      isRegisterMode.value = false
      formData.password = ''
      formData.confirm_password = ''
      formData.nick_name = ''
      formData.email = ''
      formData.phonenumber = ''
      formData.code = ''
      refreshCaptcha()
    } else {
      const res = await login(payload)
      userStore.setToken(res.data.token)
      userStore.setUserInfo({
        user_id: res.data.user_id,
        user_name: res.data.user_name,
        nick_name: res.data.nick_name,
        avatar: res.data.avatar,
        roles: res.data.roles,
        role_ids: res.data.role_ids || [],  // ✅ 关键：保存角色 ID 数组
        permissions: res.data.permissions || [],  // ✅ 聚合权限标识
      })

      // 记住密码逻辑
      if (formData.rememberMe) {
        localStorage.setItem(
          'rememberUser',
          JSON.stringify({ user_name: formData.user_name, password: formData.password }),
        )
      } else {
        localStorage.removeItem('rememberUser')
      }

      permissionStore.resetPermission()
      
      // ✅ 关键修复：等待权限加载完成后再跳转，避免首页404
      message.success('登录成功')
      
      try {
        // 先加载用户权限和菜单
        await permissionStore.fetchUserPermissions()
        console.log('✅ [Login] 权限加载完成，准备跳转到首页')
        
        // 权限加载完成后跳转到目标页面
        const redirectPath = route.query.redirect || '/home'
        router.push(redirectPath)
      } catch (error) {
        console.error('❌ [Login] 权限加载失败:', error)
        // 即使权限加载失败，也尝试跳转到首页
        router.push(route.query.redirect || '/home')
      }
    }
  } catch (error) {
    message.error(error.message || '操作失败')
    refreshCaptcha()
    formData.code = ''
  } finally {
    loading.value = false
  }
}

/** 切换登录/注册 */
const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  formData.password = ''
  formData.confirm_password = ''
  formData.nick_name = ''
  formData.email = ''
  formData.phonenumber = ''
  formData.code = ''
  formRef.value?.restoreValidation()
  refreshCaptcha()
}

onMounted(() => {
  // 自动填充记住的密码
  const remember = localStorage.getItem('rememberUser')
  if (remember) {
    try {
      const { user_name, password } = JSON.parse(remember)
      formData.user_name = user_name
      formData.password = password
      formData.rememberMe = true
    } catch (e) {}
  }
  refreshCaptcha()
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}

.login-card {
  width: 400px;
  border: none;
  border-radius: 6px;
  box-shadow: 0 0 25px #cac6c6;
  background: #fff;
}

:deep(.n-form-item) {
  margin-bottom: 0 !important;
  --n-blank-height: 4px !important;
  --n-label-height: 10px !important;
  --n-feedback-height: 10px !important;
  --n-feedback-padding: 10px !important;
}

.login-header {
  text-align: center;
}

.login-title {
  color: #707070;
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 4px;
  display: block;
}

.login-header p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* 验证码图片 */
.captcha-image {
  width: 100%;
  height: 38px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 删除旧的按钮样式覆盖 */

.login-footer {
  margin-top: 5px;
  text-align: center;
  font-size: 14px;
  color: #999;
}

.login-footer span {
  margin-right: 8px;
}
</style>
