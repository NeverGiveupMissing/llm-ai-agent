<template>
  <div class="login-container">
    <!-- 星空背景装饰 -->
    <div class="stars">
      <!-- 流星 - 大颗（20个） -->
      <div class="meteor meteor-lg meteor-1"></div>
      <div class="meteor meteor-lg meteor-2"></div>
      <div class="meteor meteor-lg meteor-3"></div>
      <div class="meteor meteor-lg meteor-4"></div>
      <div class="meteor meteor-lg meteor-5"></div>
      <div class="meteor meteor-lg meteor-6"></div>
      <div class="meteor meteor-lg meteor-7"></div>
      <div class="meteor meteor-lg meteor-8"></div>
      <div class="meteor meteor-lg meteor-9"></div>
      <div class="meteor meteor-lg meteor-10"></div>
      <div class="meteor meteor-lg meteor-11"></div>
      <div class="meteor meteor-lg meteor-12"></div>
      <div class="meteor meteor-lg meteor-13"></div>
      <div class="meteor meteor-lg meteor-14"></div>
      <div class="meteor meteor-lg meteor-15"></div>
      <div class="meteor meteor-lg meteor-16"></div>
      <div class="meteor meteor-lg meteor-17"></div>
      <div class="meteor meteor-lg meteor-18"></div>
      <div class="meteor meteor-lg meteor-19"></div>
      <div class="meteor meteor-lg meteor-20"></div>
      <!-- 流星 - 小颗（20个） -->
      <div class="meteor meteor-sm meteor-s1"></div>
      <div class="meteor meteor-sm meteor-s2"></div>
      <div class="meteor meteor-sm meteor-s3"></div>
      <div class="meteor meteor-sm meteor-s4"></div>
      <div class="meteor meteor-sm meteor-s5"></div>
      <div class="meteor meteor-sm meteor-s6"></div>
      <div class="meteor meteor-sm meteor-s7"></div>
      <div class="meteor meteor-sm meteor-s8"></div>
      <div class="meteor meteor-sm meteor-s9"></div>
      <div class="meteor meteor-sm meteor-s10"></div>
      <div class="meteor meteor-sm meteor-s11"></div>
      <div class="meteor meteor-sm meteor-s12"></div>
      <div class="meteor meteor-sm meteor-s13"></div>
      <div class="meteor meteor-sm meteor-s14"></div>
      <div class="meteor meteor-sm meteor-s15"></div>
      <div class="meteor meteor-sm meteor-s16"></div>
      <div class="meteor meteor-sm meteor-s17"></div>
      <div class="meteor meteor-sm meteor-s18"></div>
      <div class="meteor meteor-sm meteor-s19"></div>
      <div class="meteor meteor-sm meteor-s20"></div>
      <!-- 星星 -->
      <div
        v-for="n in 200"
        :key="n"
        class="star"
        :class="{
          large: n <= 15,
          medium: n > 15 && n <= 50,
          small: n > 50,
          colorful: n > 50 && n % 7 === 0,
        }"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${n <= 15 ? Math.random() * 3 + 3 : n <= 50 ? Math.random() * 2 + 2 : Math.random() * 1.5 + 0.5}px`,
          height: `${n <= 15 ? Math.random() * 3 + 3 : n <= 50 ? Math.random() * 2 + 2 : Math.random() * 1.5 + 0.5}px`,
          '--duration': `${Math.random() * 4 + 2}s`,
          '--delay': `${Math.random() * 3}s`,
        }"
      ></div>
    </div>

    <!-- 额外的星空层 -->
    <div class="stars-layer"></div>

    <!-- 光晕装饰 -->
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>
    <div class="glow-orb glow-orb-4"></div>

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
          <n-checkbox v-model:checked="formData.rememberMe">
            <span style="color: #fff"> 记住密码 </span>
          </n-checkbox>
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

      <div class="login-links">
        <n-button text type="primary" @click="router.push('/smithyuyi001')"> PM2日志 </n-button>
      </div>

      <CopyrightFooter />
    </n-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  PersonOutline,
  LockClosedOutline,
  KeyOutline,
  MailOutline,
  CallOutline,
} from '@vicons/ionicons5'
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
        role_ids: res.data.role_ids || [], // ✅ 关键：保存角色 ID 数组
        permissions: res.data.permissions || [], // ✅ 聚合权限标识
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
    } catch {
      // 忽略解析错误
    }
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
  /* 科技感深色星空背景 */
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1b2a 100%);
  position: relative;
  overflow: hidden;
}

/* 去掉网格背景，使用纯星云效果 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 160px 30px, #ffffff, rgba(0, 0, 0, 0));
  background-repeat: repeat;
  background-size: 200px 100px;
  animation: sparkle 10s linear infinite;
  z-index: 0;
}

/* 添加额外的星空层 */
.login-container .stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 20% 40%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 30% 10%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 40% 60%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 50% 30%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 60% 70%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 70% 20%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 80% 50%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 90% 80%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 15% 85%, rgba(255, 255, 255, 0.6), transparent);
  background-size: 100px 100px;
  animation: starsMove 60s linear infinite;
  opacity: 0.6;
}

@keyframes starsMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 100px 100px;
  }
}

/* 星云光晕效果 */
.login-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(123, 44, 191, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 40% 80%, rgba(0, 150, 255, 0.1) 0%, transparent 45%),
    radial-gradient(circle at 60% 40%, rgba(0, 212, 255, 0.08) 0%, transparent 40%);
  animation: nebula 25s ease-in-out infinite;
  z-index: 0;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

@keyframes nebula {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* 第一颗流星（白色星星） */
.meteor-1,
.meteor-2,
.meteor-3,
.meteor-4,
.meteor-5,
.meteor-6,
.meteor-7,
.meteor-8,
.meteor-9,
.meteor-10,
.meteor-11,
.meteor-12,
.meteor-13,
.meteor-14,
.meteor-15,
.meteor-16,
.meteor-17,
.meteor-18,
.meteor-19,
.meteor-20 {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.8) 30%, transparent 70%);
}

/* 小颗流星样式 */
.meteor-s1,
.meteor-s2,
.meteor-s3,
.meteor-s4,
.meteor-s5,
.meteor-s6,
.meteor-s7,
.meteor-s8,
.meteor-s9,
.meteor-s10,
.meteor-s11,
.meteor-s12,
.meteor-s13,
.meteor-s14,
.meteor-s15,
.meteor-s16,
.meteor-s17,
.meteor-s18,
.meteor-s19,
.meteor-s20 {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.6) 40%, transparent 70%);
}

/* 小颗流星 - 白色 */
.meteor-s1 {
  top: 10%;
  left: 5%;
  animation: meteorS1 15s linear infinite;
  animation-delay: 0s;
}
.meteor-s2 {
  top: 20%;
  left: 10%;
  animation: meteorS2 16s linear infinite;
  animation-delay: 1s;
}
.meteor-s3 {
  top: 30%;
  left: 15%;
  animation: meteorS3 17s linear infinite;
  animation-delay: 2s;
}
.meteor-s4 {
  top: 40%;
  left: 20%;
  animation: meteorS4 18s linear infinite;
  animation-delay: 3s;
}
.meteor-s5 {
  top: 50%;
  left: 25%;
  animation: meteorS5 19s linear infinite;
  animation-delay: 4s;
}
.meteor-s6 {
  top: 60%;
  left: 30%;
  animation: meteorS6 20s linear infinite;
  animation-delay: 5s;
}
.meteor-s7 {
  top: 70%;
  left: 35%;
  animation: meteorS7 21s linear infinite;
  animation-delay: 6s;
}
.meteor-s8 {
  top: 80%;
  left: 40%;
  animation: meteorS8 22s linear infinite;
  animation-delay: 7s;
}
.meteor-s9 {
  top: 90%;
  left: 45%;
  animation: meteorS9 23s linear infinite;
  animation-delay: 8s;
}
.meteor-s10 {
  top: 5%;
  left: 50%;
  animation: meteorS10 24s linear infinite;
  animation-delay: 9s;
}
.meteor-s11 {
  top: 15%;
  left: 55%;
  animation: meteorS11 25s linear infinite;
  animation-delay: 10s;
}
.meteor-s12 {
  top: 25%;
  left: 60%;
  animation: meteorS12 26s linear infinite;
  animation-delay: 11s;
}
.meteor-s13 {
  top: 35%;
  left: 65%;
  animation: meteorS13 27s linear infinite;
  animation-delay: 12s;
}
.meteor-s14 {
  top: 45%;
  left: 70%;
  animation: meteorS14 28s linear infinite;
  animation-delay: 13s;
}
.meteor-s15 {
  top: 55%;
  left: 75%;
  animation: meteorS15 29s linear infinite;
  animation-delay: 14s;
}
.meteor-s16 {
  top: 65%;
  left: 80%;
  animation: meteorS16 30s linear infinite;
  animation-delay: 15s;
}
.meteor-s17 {
  top: 75%;
  left: 85%;
  animation: meteorS17 31s linear infinite;
  animation-delay: 16s;
}
.meteor-s18 {
  top: 85%;
  left: 90%;
  animation: meteorS18 32s linear infinite;
  animation-delay: 17s;
}
.meteor-s19 {
  top: 95%;
  left: 95%;
  animation: meteorS19 33s linear infinite;
  animation-delay: 18s;
}
.meteor-s20 {
  top: 8%;
  left: 2%;
  animation: meteorS20 34s linear infinite;
  animation-delay: 19s;
}

.meteor-1 {
  top: 5%;
  left: 5%;
  box-shadow:
    0 0 10px rgba(255, 255, 255, 1),
    0 0 20px rgba(255, 255, 255, 0.8),
    0 0 30px rgba(255, 255, 255, 0.6),
    0 0 40px rgba(255, 255, 255, 0.4),
    0 0 60px rgba(255, 255, 255, 0.2);
  animation: meteor1 8s linear infinite;
  animation-delay: 0s;
}

/* 第二颗流星（霓虹蓝色星星） */
.meteor-2 {
  top: 15%;
  left: 10%;
  background: radial-gradient(circle, #fff 0%, rgba(0, 212, 255, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(0, 212, 255, 1),
    0 0 20px rgba(0, 212, 255, 0.8),
    0 0 30px rgba(0, 212, 255, 0.6),
    0 0 40px rgba(0, 212, 255, 0.4),
    0 0 60px rgba(0, 212, 255, 0.2);
  animation: meteor2 10s linear infinite;
  animation-delay: 3.5s;
}

/* 第三颗流星（青色星星） */
.meteor-3 {
  top: 25%;
  left: 0%;
  background: radial-gradient(circle, #fff 0%, rgba(79, 172, 254, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(79, 172, 254, 1),
    0 0 20px rgba(79, 172, 254, 0.8),
    0 0 30px rgba(79, 172, 254, 0.6),
    0 0 40px rgba(79, 172, 254, 0.4),
    0 0 60px rgba(79, 172, 254, 0.2);
  animation: meteor3 9s linear infinite;
  animation-delay: 6s;
}

/* 第四颗流星（紫色星星） */
.meteor-4 {
  top: 35%;
  left: 15%;
  background: radial-gradient(circle, #fff 0%, rgba(123, 44, 191, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(123, 44, 191, 1),
    0 0 20px rgba(123, 44, 191, 0.8),
    0 0 30px rgba(123, 44, 191, 0.6),
    0 0 40px rgba(123, 44, 191, 0.4),
    0 0 60px rgba(123, 44, 191, 0.2);
  animation: meteor4 11s linear infinite;
  animation-delay: 1.5s;
}

/* 第五颗流星（绿色星星） */
.meteor-5 {
  top: 45%;
  left: 20%;
  background: radial-gradient(circle, #fff 0%, rgba(50, 205, 50, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(50, 205, 50, 1),
    0 0 20px rgba(50, 205, 50, 0.8),
    0 0 30px rgba(50, 205, 50, 0.6),
    0 0 40px rgba(50, 205, 50, 0.4),
    0 0 60px rgba(50, 205, 50, 0.2);
  animation: meteor5 12s linear infinite;
  animation-delay: 4.5s;
}

/* 第六颗流星（橙色星星） */
.meteor-6 {
  top: 55%;
  left: 25%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 165, 0, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 165, 0, 1),
    0 0 20px rgba(255, 165, 0, 0.8),
    0 0 30px rgba(255, 165, 0, 0.6),
    0 0 40px rgba(255, 165, 0, 0.4),
    0 0 60px rgba(255, 165, 0, 0.2);
  animation: meteor6 13s linear infinite;
  animation-delay: 2.5s;
}

/* 第七颗流星（黄色星星） */
.meteor-7 {
  top: 65%;
  left: 30%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 215, 0, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 215, 0, 1),
    0 0 20px rgba(255, 215, 0, 0.8),
    0 0 30px rgba(255, 215, 0, 0.6),
    0 0 40px rgba(255, 215, 0, 0.4),
    0 0 60px rgba(255, 215, 0, 0.2);
  animation: meteor7 14s linear infinite;
  animation-delay: 7.5s;
}

/* 第八颗流星（红色星星） */
.meteor-8 {
  top: 75%;
  left: 35%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 69, 0, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 69, 0, 1),
    0 0 20px rgba(255, 69, 0, 0.8),
    0 0 30px rgba(255, 69, 0, 0.6),
    0 0 40px rgba(255, 69, 0, 0.4),
    0 0 60px rgba(255, 69, 0, 0.2);
  animation: meteor8 15s linear infinite;
  animation-delay: 5.5s;
}

/* 第九颗流星（蓝色星星） */
.meteor-9 {
  top: 85%;
  left: 40%;
  background: radial-gradient(circle, #fff 0%, rgba(30, 144, 255, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(30, 144, 255, 1),
    0 0 20px rgba(30, 144, 255, 0.8),
    0 0 30px rgba(30, 144, 255, 0.6),
    0 0 40px rgba(30, 144, 255, 0.4),
    0 0 60px rgba(30, 144, 255, 0.2);
  animation: meteor9 16s linear infinite;
  animation-delay: 8.5s;
}

/* 第十颗流星（靛蓝色星星） */
.meteor-10 {
  top: 95%;
  left: 45%;
  background: radial-gradient(circle, #fff 0%, rgba(75, 0, 130, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(75, 0, 130, 1),
    0 0 20px rgba(75, 0, 130, 0.8),
    0 0 30px rgba(75, 0, 130, 0.6),
    0 0 40px rgba(75, 0, 130, 0.4),
    0 0 60px rgba(75, 0, 130, 0.2);
  animation: meteor10 17s linear infinite;
  animation-delay: 3.5s;
}

/* 第十一颗流星（青色星星） */
.meteor-11 {
  top: 10%;
  left: 50%;
  background: radial-gradient(circle, #fff 0%, rgba(0, 255, 255, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(0, 255, 255, 1),
    0 0 20px rgba(0, 255, 255, 0.8),
    0 0 30px rgba(0, 255, 255, 0.6),
    0 0 40px rgba(0, 255, 255, 0.4),
    0 0 60px rgba(0, 255, 255, 0.2);
  animation: meteor11 18s linear infinite;
  animation-delay: 6.5s;
}

/* 第十二颗流星（粉色星星） */
.meteor-12 {
  top: 20%;
  left: 55%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 192, 203, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 192, 203, 1),
    0 0 20px rgba(255, 192, 203, 0.8),
    0 0 30px rgba(255, 192, 203, 0.6),
    0 0 40px rgba(255, 192, 203, 0.4),
    0 0 60px rgba(255, 192, 203, 0.2);
  animation: meteor12 19s linear infinite;
  animation-delay: 9.5s;
}

/* 第十三颗流星（金色星星） */
.meteor-13 {
  top: 30%;
  left: 60%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 215, 0, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 215, 0, 1),
    0 0 20px rgba(255, 215, 0, 0.8),
    0 0 30px rgba(255, 215, 0, 0.6),
    0 0 40px rgba(255, 215, 0, 0.4),
    0 0 60px rgba(255, 215, 0, 0.2);
  animation: meteor13 20s linear infinite;
  animation-delay: 1.5s;
}

/* 第十四颗流星（紫色星星） */
.meteor-14 {
  top: 40%;
  left: 65%;
  background: radial-gradient(circle, #fff 0%, rgba(148, 0, 211, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(148, 0, 211, 1),
    0 0 20px rgba(148, 0, 211, 0.8),
    0 0 30px rgba(148, 0, 211, 0.6),
    0 0 40px rgba(148, 0, 211, 0.4),
    0 0 60px rgba(148, 0, 211, 0.2);
  animation: meteor14 21s linear infinite;
  animation-delay: 4.5s;
}

/* 第十五颗流星（橙色星星） */
.meteor-15 {
  top: 50%;
  left: 70%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 140, 0, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 140, 0, 1),
    0 0 20px rgba(255, 140, 0, 0.8),
    0 0 30px rgba(255, 140, 0, 0.6),
    0 0 40px rgba(255, 140, 0, 0.4),
    0 0 60px rgba(255, 140, 0, 0.2);
  animation: meteor15 22s linear infinite;
  animation-delay: 7.5s;
}

/* 第十六颗流星（红色星星） */
.meteor-16 {
  top: 60%;
  left: 75%;
  background: radial-gradient(circle, #fff 0%, rgba(220, 20, 60, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(220, 20, 60, 1),
    0 0 20px rgba(220, 20, 60, 0.8),
    0 0 30px rgba(220, 20, 60, 0.6),
    0 0 40px rgba(220, 20, 60, 0.4),
    0 0 60px rgba(220, 20, 60, 0.2);
  animation: meteor16 23s linear infinite;
  animation-delay: 10.5s;
}

/* 第十七颗流星（蓝色星星） */
.meteor-17 {
  top: 70%;
  left: 80%;
  background: radial-gradient(circle, #fff 0%, rgba(0, 0, 255, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(0, 0, 255, 1),
    0 0 20px rgba(0, 0, 255, 0.8),
    0 0 30px rgba(0, 0, 255, 0.6),
    0 0 40px rgba(0, 0, 255, 0.4),
    0 0 60px rgba(0, 0, 255, 0.2);
  animation: meteor17 24s linear infinite;
  animation-delay: 2.5s;
}

/* 第十八颗流星（绿色星星） */
.meteor-18 {
  top: 80%;
  left: 85%;
  background: radial-gradient(circle, #fff 0%, rgba(34, 139, 34, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(34, 139, 34, 1),
    0 0 20px rgba(34, 139, 34, 0.8),
    0 0 30px rgba(34, 139, 34, 0.6),
    0 0 40px rgba(34, 139, 34, 0.4),
    0 0 60px rgba(34, 139, 34, 0.2);
  animation: meteor18 25s linear infinite;
  animation-delay: 5.5s;
}

/* 第十九颗流星（黄色星星） */
.meteor-19 {
  top: 90%;
  left: 90%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 0, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 255, 0, 1),
    0 0 20px rgba(255, 255, 0, 0.8),
    0 0 30px rgba(255, 255, 0, 0.6),
    0 0 40px rgba(255, 255, 0, 0.4),
    0 0 60px rgba(255, 255, 0, 0.2);
  animation: meteor19 26s linear infinite;
  animation-delay: 8.5s;
}

/* 第二十颗流星（白色星星） */
.meteor-20 {
  top: 5%;
  left: 95%;
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 10px rgba(255, 255, 255, 1),
    0 0 20px rgba(255, 255, 255, 0.8),
    0 0 30px rgba(255, 255, 255, 0.6),
    0 0 40px rgba(255, 255, 255, 0.4),
    0 0 60px rgba(255, 255, 255, 0.2);
  animation: meteor20 27s linear infinite;
  animation-delay: 11.5s;
}

@keyframes meteor1 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 255, 255, 0),
      0 0 10px rgba(255, 255, 255, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 255, 255, 1),
      0 0 20px rgba(255, 255, 255, 0.8),
      0 0 30px rgba(255, 255, 255, 0.6),
      0 0 40px rgba(255, 255, 255, 0.4),
      0 0 60px rgba(255, 255, 255, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 255, 255, 1),
      0 0 20px rgba(255, 255, 255, 0.8),
      0 0 30px rgba(255, 255, 255, 0.6),
      0 0 40px rgba(255, 255, 255, 0.4),
      0 0 60px rgba(255, 255, 255, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(50vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 255, 255, 0),
      0 0 10px rgba(255, 255, 255, 0);
  }
}

@keyframes meteor2 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(147, 51, 234, 0),
      0 0 10px rgba(147, 51, 234, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(147, 51, 234, 1),
      0 0 20px rgba(147, 51, 234, 0.8),
      0 0 30px rgba(147, 51, 234, 0.6),
      0 0 40px rgba(147, 51, 234, 0.4),
      0 0 60px rgba(147, 51, 234, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(147, 51, 234, 1),
      0 0 20px rgba(147, 51, 234, 0.8),
      0 0 30px rgba(147, 51, 234, 0.6),
      0 0 40px rgba(147, 51, 234, 0.4),
      0 0 60px rgba(147, 51, 234, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(60vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(147, 51, 234, 0),
      0 0 10px rgba(147, 51, 234, 0);
  }
}

@keyframes meteor3 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(79, 172, 254, 0),
      0 0 10px rgba(79, 172, 254, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(79, 172, 254, 1),
      0 0 20px rgba(79, 172, 254, 0.8),
      0 0 30px rgba(79, 172, 254, 0.6),
      0 0 40px rgba(79, 172, 254, 0.4),
      0 0 60px rgba(79, 172, 254, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(79, 172, 254, 1),
      0 0 20px rgba(79, 172, 254, 0.8),
      0 0 30px rgba(79, 172, 254, 0.6),
      0 0 40px rgba(79, 172, 254, 0.4),
      0 0 60px rgba(79, 172, 254, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(65vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(79, 172, 254, 0),
      0 0 10px rgba(79, 172, 254, 0);
  }
}

@keyframes meteor4 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 105, 180, 0),
      0 0 10px rgba(255, 105, 180, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 105, 180, 1),
      0 0 20px rgba(255, 105, 180, 0.8),
      0 0 30px rgba(255, 105, 180, 0.6),
      0 0 40px rgba(255, 105, 180, 0.4),
      0 0 60px rgba(255, 105, 180, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 105, 180, 1),
      0 0 20px rgba(255, 105, 180, 0.8),
      0 0 30px rgba(255, 105, 180, 0.6),
      0 0 40px rgba(255, 105, 180, 0.4),
      0 0 60px rgba(255, 105, 180, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(70vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 105, 180, 0),
      0 0 10px rgba(255, 105, 180, 0);
  }
}

@keyframes meteor5 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(50, 205, 50, 0),
      0 0 10px rgba(50, 205, 50, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(50, 205, 50, 1),
      0 0 20px rgba(50, 205, 50, 0.8),
      0 0 30px rgba(50, 205, 50, 0.6),
      0 0 40px rgba(50, 205, 50, 0.4),
      0 0 60px rgba(50, 205, 50, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(50, 205, 50, 1),
      0 0 20px rgba(50, 205, 50, 0.8),
      0 0 30px rgba(50, 205, 50, 0.6),
      0 0 40px rgba(50, 205, 50, 0.4),
      0 0 60px rgba(50, 205, 50, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(75vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(50, 205, 50, 0),
      0 0 10px rgba(50, 205, 50, 0);
  }
}

@keyframes meteor6 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 165, 0, 0),
      0 0 10px rgba(255, 165, 0, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 165, 0, 1),
      0 0 20px rgba(255, 165, 0, 0.8),
      0 0 30px rgba(255, 165, 0, 0.6),
      0 0 40px rgba(255, 165, 0, 0.4),
      0 0 60px rgba(255, 165, 0, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 165, 0, 1),
      0 0 20px rgba(255, 165, 0, 0.8),
      0 0 30px rgba(255, 165, 0, 0.6),
      0 0 40px rgba(255, 165, 0, 0.4),
      0 0 60px rgba(255, 165, 0, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(80vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 165, 0, 0),
      0 0 10px rgba(255, 165, 0, 0);
  }
}

@keyframes meteor7 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 215, 0, 0),
      0 0 10px rgba(255, 215, 0, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 1),
      0 0 20px rgba(255, 215, 0, 0.8),
      0 0 30px rgba(255, 215, 0, 0.6),
      0 0 40px rgba(255, 215, 0, 0.4),
      0 0 60px rgba(255, 215, 0, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 1),
      0 0 20px rgba(255, 215, 0, 0.8),
      0 0 30px rgba(255, 215, 0, 0.6),
      0 0 40px rgba(255, 215, 0, 0.4),
      0 0 60px rgba(255, 215, 0, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(85vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 215, 0, 0),
      0 0 10px rgba(255, 215, 0, 0);
  }
}

@keyframes meteor8 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 69, 0, 0),
      0 0 10px rgba(255, 69, 0, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 69, 0, 1),
      0 0 20px rgba(255, 69, 0, 0.8),
      0 0 30px rgba(255, 69, 0, 0.6),
      0 0 40px rgba(255, 69, 0, 0.4),
      0 0 60px rgba(255, 69, 0, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 69, 0, 1),
      0 0 20px rgba(255, 69, 0, 0.8),
      0 0 30px rgba(255, 69, 0, 0.6),
      0 0 40px rgba(255, 69, 0, 0.4),
      0 0 60px rgba(255, 69, 0, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(90vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 69, 0, 0),
      0 0 10px rgba(255, 69, 0, 0);
  }
}

@keyframes meteor9 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(30, 144, 255, 0),
      0 0 10px rgba(30, 144, 255, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(30, 144, 255, 1),
      0 0 20px rgba(30, 144, 255, 0.8),
      0 0 30px rgba(30, 144, 255, 0.6),
      0 0 40px rgba(30, 144, 255, 0.4),
      0 0 60px rgba(30, 144, 255, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(30, 144, 255, 1),
      0 0 20px rgba(30, 144, 255, 0.8),
      0 0 30px rgba(30, 144, 255, 0.6),
      0 0 40px rgba(30, 144, 255, 0.4),
      0 0 60px rgba(30, 144, 255, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(95vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(30, 144, 255, 0),
      0 0 10px rgba(30, 144, 255, 0);
  }
}

@keyframes meteor10 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(75, 0, 130, 0),
      0 0 10px rgba(75, 0, 130, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(75, 0, 130, 1),
      0 0 20px rgba(75, 0, 130, 0.8),
      0 0 30px rgba(75, 0, 130, 0.6),
      0 0 40px rgba(75, 0, 130, 0.4),
      0 0 60px rgba(75, 0, 130, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(75, 0, 130, 1),
      0 0 20px rgba(75, 0, 130, 0.8),
      0 0 30px rgba(75, 0, 130, 0.6),
      0 0 40px rgba(75, 0, 130, 0.4),
      0 0 60px rgba(75, 0, 130, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(100vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(75, 0, 130, 0),
      0 0 10px rgba(75, 0, 130, 0);
  }
}

@keyframes meteor11 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(0, 255, 255, 0),
      0 0 10px rgba(0, 255, 255, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(0, 255, 255, 1),
      0 0 20px rgba(0, 255, 255, 0.8),
      0 0 30px rgba(0, 255, 255, 0.6),
      0 0 40px rgba(0, 255, 255, 0.4),
      0 0 60px rgba(0, 255, 255, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(0, 255, 255, 1),
      0 0 20px rgba(0, 255, 255, 0.8),
      0 0 30px rgba(0, 255, 255, 0.6),
      0 0 40px rgba(0, 255, 255, 0.4),
      0 0 60px rgba(0, 255, 255, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(50vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(0, 255, 255, 0),
      0 0 10px rgba(0, 255, 255, 0);
  }
}

@keyframes meteor12 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 192, 203, 0),
      0 0 10px rgba(255, 192, 203, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 192, 203, 1),
      0 0 20px rgba(255, 192, 203, 0.8),
      0 0 30px rgba(255, 192, 203, 0.6),
      0 0 40px rgba(255, 192, 203, 0.4),
      0 0 60px rgba(255, 192, 203, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 192, 203, 1),
      0 0 20px rgba(255, 192, 203, 0.8),
      0 0 30px rgba(255, 192, 203, 0.6),
      0 0 40px rgba(255, 192, 203, 0.4),
      0 0 60px rgba(255, 192, 203, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(55vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 192, 203, 0),
      0 0 10px rgba(255, 192, 203, 0);
  }
}

@keyframes meteor13 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 215, 0, 0),
      0 0 10px rgba(255, 215, 0, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 1),
      0 0 20px rgba(255, 215, 0, 0.8),
      0 0 30px rgba(255, 215, 0, 0.6),
      0 0 40px rgba(255, 215, 0, 0.4),
      0 0 60px rgba(255, 215, 0, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 215, 0, 1),
      0 0 20px rgba(255, 215, 0, 0.8),
      0 0 30px rgba(255, 215, 0, 0.6),
      0 0 40px rgba(255, 215, 0, 0.4),
      0 0 60px rgba(255, 215, 0, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(60vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 215, 0, 0),
      0 0 10px rgba(255, 215, 0, 0);
  }
}

@keyframes meteor14 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(148, 0, 211, 0),
      0 0 10px rgba(148, 0, 211, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(148, 0, 211, 1),
      0 0 20px rgba(148, 0, 211, 0.8),
      0 0 30px rgba(148, 0, 211, 0.6),
      0 0 40px rgba(148, 0, 211, 0.4),
      0 0 60px rgba(148, 0, 211, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(148, 0, 211, 1),
      0 0 20px rgba(148, 0, 211, 0.8),
      0 0 30px rgba(148, 0, 211, 0.6),
      0 0 40px rgba(148, 0, 211, 0.4),
      0 0 60px rgba(148, 0, 211, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(65vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(148, 0, 211, 0),
      0 0 10px rgba(148, 0, 211, 0);
  }
}

@keyframes meteor15 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 140, 0, 0),
      0 0 10px rgba(255, 140, 0, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 140, 0, 1),
      0 0 20px rgba(255, 140, 0, 0.8),
      0 0 30px rgba(255, 140, 0, 0.6),
      0 0 40px rgba(255, 140, 0, 0.4),
      0 0 60px rgba(255, 140, 0, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 140, 0, 1),
      0 0 20px rgba(255, 140, 0, 0.8),
      0 0 30px rgba(255, 140, 0, 0.6),
      0 0 40px rgba(255, 140, 0, 0.4),
      0 0 60px rgba(255, 140, 0, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(70vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 140, 0, 0),
      0 0 10px rgba(255, 140, 0, 0);
  }
}

@keyframes meteor16 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(220, 20, 60, 0),
      0 0 10px rgba(220, 20, 60, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(220, 20, 60, 1),
      0 0 20px rgba(220, 20, 60, 0.8),
      0 0 30px rgba(220, 20, 60, 0.6),
      0 0 40px rgba(220, 20, 60, 0.4),
      0 0 60px rgba(220, 20, 60, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(220, 20, 60, 1),
      0 0 20px rgba(220, 20, 60, 0.8),
      0 0 30px rgba(220, 20, 60, 0.6),
      0 0 40px rgba(220, 20, 60, 0.4),
      0 0 60px rgba(220, 20, 60, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(75vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(220, 20, 60, 0),
      0 0 10px rgba(220, 20, 60, 0);
  }
}

@keyframes meteor17 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(0, 0, 255, 0),
      0 0 10px rgba(0, 0, 255, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(0, 0, 255, 1),
      0 0 20px rgba(0, 0, 255, 0.8),
      0 0 30px rgba(0, 0, 255, 0.6),
      0 0 40px rgba(0, 0, 255, 0.4),
      0 0 60px rgba(0, 0, 255, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(0, 0, 255, 1),
      0 0 20px rgba(0, 0, 255, 0.8),
      0 0 30px rgba(0, 0, 255, 0.6),
      0 0 40px rgba(0, 0, 255, 0.4),
      0 0 60px rgba(0, 0, 255, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(80vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(0, 0, 255, 0),
      0 0 10px rgba(0, 0, 255, 0);
  }
}

@keyframes meteor18 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(34, 139, 34, 0),
      0 0 10px rgba(34, 139, 34, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(34, 139, 34, 1),
      0 0 20px rgba(34, 139, 34, 0.8),
      0 0 30px rgba(34, 139, 34, 0.6),
      0 0 40px rgba(34, 139, 34, 0.4),
      0 0 60px rgba(34, 139, 34, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(34, 139, 34, 1),
      0 0 20px rgba(34, 139, 34, 0.8),
      0 0 30px rgba(34, 139, 34, 0.6),
      0 0 40px rgba(34, 139, 34, 0.4),
      0 0 60px rgba(34, 139, 34, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(85vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(34, 139, 34, 0),
      0 0 10px rgba(34, 139, 34, 0);
  }
}

@keyframes meteor19 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 255, 0, 0),
      0 0 10px rgba(255, 255, 0, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 255, 0, 1),
      0 0 20px rgba(255, 255, 0, 0.8),
      0 0 30px rgba(255, 255, 0, 0.6),
      0 0 40px rgba(255, 255, 0, 0.4),
      0 0 60px rgba(255, 255, 0, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 255, 0, 1),
      0 0 20px rgba(255, 255, 0, 0.8),
      0 0 30px rgba(255, 255, 0, 0.6),
      0 0 40px rgba(255, 255, 0, 0.4),
      0 0 60px rgba(255, 255, 0, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(90vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 255, 0, 0),
      0 0 10px rgba(255, 255, 0, 0);
  }
}

@keyframes meteor20 {
  0% {
    transform: translateX(-100px) translateY(0) rotate(0deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 255, 255, 0),
      0 0 10px rgba(255, 255, 255, 0);
  }
  5% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 255, 255, 1),
      0 0 20px rgba(255, 255, 255, 0.8),
      0 0 30px rgba(255, 255, 255, 0.6),
      0 0 40px rgba(255, 255, 255, 0.4),
      0 0 60px rgba(255, 255, 255, 0.2);
  }
  95% {
    opacity: 1;
    box-shadow:
      0 0 10px rgba(255, 255, 255, 1),
      0 0 20px rgba(255, 255, 255, 0.8),
      0 0 30px rgba(255, 255, 255, 0.6),
      0 0 40px rgba(255, 255, 255, 0.4),
      0 0 60px rgba(255, 255, 255, 0.2);
  }
  100% {
    transform: translateX(calc(100vw + 100px)) translateY(95vh) rotate(360deg);
    opacity: 0;
    box-shadow:
      0 0 5px rgba(255, 255, 255, 0),
      0 0 10px rgba(255, 255, 255, 0);
  }
}

/* 小颗流星动画 */
@keyframes meteorS1 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(50vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS2 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(55vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS3 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(60vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS4 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(65vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS5 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(70vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS6 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(75vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS7 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(80vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS8 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(85vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS9 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(90vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS10 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(95vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS11 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS12 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(50vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS13 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(55vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS14 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(60vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS15 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(65vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS16 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(70vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS17 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(75vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS18 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(80vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS19 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(85vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes meteorS20 {
  0% {
    transform: translateX(-50px) translateY(0) rotate(0deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 50px)) translateY(90vh) rotate(360deg);
    opacity: 0;
  }
}

.star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  box-shadow:
    0 0 6px rgba(255, 255, 255, 0.9),
    0 0 12px rgba(255, 255, 255, 0.5),
    0 0 18px rgba(255, 255, 255, 0.3);
  animation: twinkle var(--duration, 3s) ease-in-out infinite var(--delay, 0s);
}

/* 大型星星带光芒 */
.star.large {
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.9) 30%, transparent 70%);
  box-shadow:
    0 0 15px rgba(255, 255, 255, 1),
    0 0 30px rgba(255, 255, 255, 0.7),
    0 0 45px rgba(255, 255, 255, 0.4),
    0 0 60px rgba(255, 255, 255, 0.2);
  animation:
    twinkle-large var(--duration, 3s) ease-in-out infinite var(--delay, 0s),
    pulse 4s ease-in-out infinite;
}

/* 中型星星 */
.star.medium {
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.8) 40%, transparent 70%);
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.9),
    0 0 16px rgba(255, 255, 255, 0.5),
    0 0 24px rgba(255, 255, 255, 0.3);
  animation:
    twinkle-medium var(--duration, 3s) ease-in-out infinite var(--delay, 0s),
    pulse 5s ease-in-out infinite;
}

/* 小型星星 */
.star.small {
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.7) 50%, transparent 70%);
  box-shadow:
    0 0 4px rgba(255, 255, 255, 0.8),
    0 0 8px rgba(255, 255, 255, 0.4);
  animation:
    twinkle-small var(--duration, 3s) ease-in-out infinite var(--delay, 0s),
    rotate 20s linear infinite;
}

/* 彩色星星效果 */
.star.colorful {
  background: radial-gradient(circle, #fff 0%, rgba(255, 255, 255, 0.8) 40%, transparent 70%);
  animation:
    twinkle-colorful var(--duration, 3s) ease-in-out infinite var(--delay, 0s),
    float 15s ease-in-out infinite;
}

.star.colorful:nth-child(5n + 1) {
  background: radial-gradient(circle, #ff6b6b 0%, rgba(255, 107, 107, 0.8) 40%, transparent 70%);
  box-shadow:
    0 0 8px rgba(255, 107, 107, 0.9),
    0 0 16px rgba(255, 107, 107, 0.5);
}

.star.colorful:nth-child(5n + 2) {
  background: radial-gradient(circle, #4ecdc4 0%, rgba(78, 205, 196, 0.8) 40%, transparent 70%);
  box-shadow:
    0 0 8px rgba(78, 205, 196, 0.9),
    0 0 16px rgba(78, 205, 196, 0.5);
}

.star.colorful:nth-child(5n + 3) {
  background: radial-gradient(circle, #45b7d1 0%, rgba(69, 183, 209, 0.8) 40%, transparent 70%);
  box-shadow:
    0 0 8px rgba(69, 183, 209, 0.9),
    0 0 16px rgba(69, 183, 209, 0.5);
}

.star.colorful:nth-child(5n + 4) {
  background: radial-gradient(circle, #96ceb4 0%, rgba(150, 206, 180, 0.8) 40%, transparent 70%);
  box-shadow:
    0 0 8px rgba(150, 206, 180, 0.9),
    0 0 16px rgba(150, 206, 180, 0.5);
}

.star.colorful:nth-child(5n + 5) {
  background: radial-gradient(circle, #feca57 0%, rgba(254, 202, 87, 0.8) 40%, transparent 70%);
  box-shadow:
    0 0 8px rgba(254, 202, 87, 0.9),
    0 0 16px rgba(254, 202, 87, 0.5);
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes twinkle-large {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

@keyframes twinkle-medium {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

@keyframes twinkle-small {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.75);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
  }
}

@keyframes twinkle-colorful {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(90deg);
  }
  50% {
    transform: translateY(0px) rotate(180deg);
  }
  75% {
    transform: translateY(10px) rotate(270deg);
  }
}

.login-card {
  width: 420px;
  /* 登录区域透明度0.1 */
  background: rgba(15, 18, 36, 0.1) !important;
  /* 高斯模糊让背景星空朦胧透出 */
  backdrop-filter: blur(16px) saturate(120%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(120%) !important;
  /* 细腻的科幻白边 */
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  /* 科技感霓虹发光阴影 */
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(0, 212, 255, 0.25) !important;
  position: relative;
  z-index: 1;
  overflow: hidden;
  padding: 40px 35px 35px !important;
}

/* 卡片顶部光效 */
.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 200%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    rgba(0, 212, 255, 0.7),
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    transform: translateX(-30%);
  }
  50% {
    transform: translateX(30%);
  }
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
  font-weight: 700;
  letter-spacing: 3px; /* 拉开字距，才有现代科技感 */
  background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 50%, #00d4ff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
  text-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
  animation: glowText 3s ease-in-out infinite;
}

.login-header p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  letter-spacing: 0.5px;
}

/* 验证码图片 */
.captcha-image {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  /* 自然融入背景的样式 */
  opacity: 0.85;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.1));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.captcha-image:hover {
  opacity: 1;
  filter: drop-shadow(0 0 12px rgba(79, 172, 254, 0.3));
  transform: translateY(-1px);
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-image span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 删除旧的按钮样式覆盖 */

.login-footer {
  margin-top: 8px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
}

.login-footer span {
  margin-right: 8px;
}

.login-links {
  margin-top: 10px;
  text-align: center;
}

/* 记住密码复选框样式 */
:deep(.n-checkbox) {
  --n-label-color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.n-checkbox__box) {
  border-color: rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s !important;
}

:deep(.n-checkbox--checked .n-checkbox__box) {
  background: linear-gradient(135deg, #00d4ff, #7b2cbf) !important;
  border-color: transparent !important;
}

/* 底部链接按钮样式 */
.login-links :deep(.n-button) {
  color: rgba(79, 172, 254, 0.7) !important;
  font-size: 13px !important;
  transition: all 0.3s !important;
}

.login-links :deep(.n-button:hover) {
  color: rgba(0, 242, 254, 1) !important;
  text-shadow: 0 0 8px rgba(0, 242, 254, 0.4) !important;
}

.login-footer :deep(.n-button) {
  color: rgba(0, 212, 255, 0.8) !important;
  font-weight: 500 !important;
  transition: all 0.3s !important;
}

.login-footer :deep(.n-button:hover) {
  color: rgba(0, 212, 255, 1) !important;
  text-shadow: 0 0 12px rgba(0, 212, 255, 0.6) !important;
}

/* 底部备案信息微调 */
:deep(.copyright-footer) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.35) !important; /* 降低不重要文字的亮度 */
  font-size: 12px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
  margin-top: 20px !important;
  padding-top: 15px !important;
}

:deep(.copyright-footer a) {
  color: rgba(79, 172, 254, 0.6) !important;
  transition: color 0.3s !important;
}

:deep(.copyright-footer a:hover) {
  color: rgba(0, 242, 254, 0.9) !important;
}

/* 光晕装饰球 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.glow-orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.35) 0%, transparent 70%);
  top: -150px;
  left: -150px;
  animation: float1 20s ease-in-out infinite;
}

.glow-orb-2 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(123, 44, 191, 0.3) 0%, transparent 70%);
  bottom: -150px;
  right: -150px;
  animation: float2 22s ease-in-out infinite;
}

/* 新增光晕装饰球 */
.glow-orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(0, 150, 255, 0.25) 0%, transparent 70%);
  top: 30%;
  right: 10%;
  animation: float3 25s ease-in-out infinite;
}

.glow-orb-4 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(123, 44, 191, 0.2) 0%, transparent 70%);
  bottom: 20%;
  left: 15%;
  animation: float4 28s ease-in-out infinite;
}

@keyframes float1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(100px, 50px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 100px) scale(0.9);
  }
}

@keyframes float2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-80px, -60px) scale(1.15);
  }
  66% {
    transform: translate(60px, -100px) scale(0.85);
  }
}

@keyframes float3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-60px, 80px) scale(1.1);
  }
  66% {
    transform: translate(40px, -60px) scale(0.9);
  }
}

@keyframes float4 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(70px, -50px) scale(1.05);
  }
  66% {
    transform: translate(-50px, 70px) scale(0.95);
  }
}

/* 添加闪烁动画 */
@keyframes sparkle {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 200px 100px;
  }
}

/* 输入框的暗色科幻微调 */
:deep(.n-input) {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  /* 极淡的半透明背景 */
  --n-color: rgba(255, 255, 255, 0.04) !important;
  --n-color-focus: rgba(255, 255, 255, 0.06) !important;
  --n-border: 1px solid rgba(255, 255, 255, 0.1) !important;
  --n-border-hover: 1px solid rgba(79, 172, 254, 0.3) !important;
  --n-border-focus: 1px solid rgba(0, 242, 254, 0.5) !important;
  --n-placeholder-color: rgba(255, 255, 255, 0.3) !important;
  --n-text-color: rgba(255, 255, 255, 0.9) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.n-input:hover) {
  --n-border: 1px solid rgba(79, 172, 254, 0.3) !important;
}

:deep(.n-input:focus-within) {
  box-shadow:
    0 0 0 3px rgba(0, 242, 254, 0.1),
    0 0 15px rgba(79, 172, 254, 0.15) !important;
}

/* 主按钮科技感样式 */
:deep(.n-button--primary) {
  background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow:
    0 4px 20px rgba(0, 212, 255, 0.5),
    0 0 0 0 rgba(0, 212, 255, 0) !important;
  font-weight: 600 !important;
  letter-spacing: 2px !important;
  height: 42px !important;
  font-size: 15px !important;
  position: relative;
  overflow: hidden;
}

:deep(.n-button--primary)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

:deep(.n-button--primary:hover)::before {
  left: 100%;
}

:deep(.n-button--primary:hover) {
  transform: translateY(-2px) !important;
  box-shadow:
    0 8px 30px rgba(0, 212, 255, 0.6),
    0 0 0 4px rgba(0, 212, 255, 0.2) !important;
}

:deep(.n-button--primary:active) {
  transform: translateY(0) !important;
}

/* 添加星空闪烁效果 */
.stars::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0, 0, 0, 0)),
    radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0)),
    radial-gradient(2px 2px at 160px 30px, #ffffff, rgba(0, 0, 0, 0));
  background-repeat: repeat;
  background-size: 200px 100px;
  animation: sparkle 10s linear infinite;
  z-index: -1;
}

/* 添加银河效果 */
.stars::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.03) 75%,
    transparent 100%
  );
  background-size: 200% 200%;
  animation: galaxy 30s ease-in-out infinite;
  z-index: -1;
  pointer-events: none;
}

@keyframes galaxy {
  0%,
  100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
}
.remember-item {
  color: white;
}
</style>
