<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- 消息列表 -->
      <div class="messages" ref="messagesRef">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>

        <!-- 加载状态（AI 正在思考） -->
        <div v-if="loading" class="message assistant">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="message-text thinking"><span>.</span><span>.</span><span>.</span></div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            v-model="inputText"
            class="message-input"
            placeholder="输入你的问题... (Enter 发送)"
            rows="1"
            @keydown.enter.prevent="sendMessage"
          ></textarea>
          <button class="send-btn" :disabled="!inputText.trim() || loading" @click="sendMessage">
            {{ loading ? '发送中...' : '发送' }}
          </button>
        </div>
        <button v-if="loading" class="stop-btn" @click="stopMessage">停止生成</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import * as chatApi from '@/api/chat'

// 消息列表
const messages = ref([
  {
    role: 'assistant',
    content: '你好！我是 AI 助手，有什么可以帮助你的吗？',
    time: getCurrentTime(),
  },
])

const inputText = ref('写一篇5000字作文 主题python的介绍')
const loading = ref(false)
let abortController = null
const messagesRef = ref(null)

// 获取当前时间
function getCurrentTime() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

// 发送消息
const sendMessage = async () => {
  const text = inputText.value.trim()

  // 防止重复调用
  if (!text || loading.value) return

  // 立即清空输入框并锁定
  inputText.value = ''
  loading.value = true

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: text,
    time: getCurrentTime(),
  })
  scrollToBottom()

  // 添加 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    time: getCurrentTime(),
  })
  scrollToBottom()

  // 准备消息历史
  const chatMessages = messages.value
    .filter((msg) => msg.content)
    .slice(-10)
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    await chatApi.streamChat(
      { messages: chatMessages },
      {
        onChunk: (chunk) => {
          console.log('收到 chunk:', chunk)
          // if (messages.value[aiMessageIndex]) {
          //   messages.value[aiMessageIndex].content += chunk
          //   scrollToBottom()
          // }

          // chunk 可能是 "代码"、"不仅" 这样的词组
          // if (messages.value[aiMessageIndex]) {
          //   // 逐字添加到消息中，模拟打字机效果
          //   for (let i = 0; i < chunk.length; i++) {
          //     setTimeout(() => {
          //       if (messages.value[aiMessageIndex]) {
          //         messages.value[aiMessageIndex].content += chunk[i]
          //         scrollToBottom()
          //       }
          //     }, i * 30)
          //   }
          // }
          // 清理可能的多余前缀
          let cleanChunk = chunk
          // 去除 data: 前缀（如果有）
          while (cleanChunk.startsWith('data: ')) {
            cleanChunk = cleanChunk.substring(6)
          }
          // 去除开头的空格
          cleanChunk = cleanChunk.trim()

          if (cleanChunk && messages.value[aiMessageIndex]) {
            messages.value[aiMessageIndex].content += cleanChunk
            scrollToBottom()
          }
        },
        onDone: () => {
          console.log('对话完成')
          loading.value = false
          abortController = null
          scrollToBottom()
        },
        onError: (err) => {
          console.error('错误:', err)
          loading.value = false
          abortController = null
          if (messages.value[aiMessageIndex] && !messages.value[aiMessageIndex].content) {
            messages.value[aiMessageIndex].content = '连接失败，请重试'
          }
          scrollToBottom()
        },
      },
      abortController.signal,
    )
  } catch (err) {
    console.error('异常:', err)
    loading.value = false
    if (messages.value[aiMessageIndex] && !messages.value[aiMessageIndex].content) {
      messages.value[aiMessageIndex].content = '请求失败，请重试'
    }
    scrollToBottom()
  }
}

// 停止生成
const stopMessage = () => {
  if (abortController) {
    abortController.abort()
    loading.value = false
  }
}
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
}

/* 消息列表 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e8ecf0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #1677ff;
  color: white;
}

.message-content {
  flex: 1;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .message-text {
  background: #1677ff;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.message.user .message-time {
  text-align: left;
}

/* 思考动画 */
.thinking {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.thinking span {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.thinking span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 输入区域 */
.input-area {
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #1677ff;
}

.send-btn {
  padding: 8px 20px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  height: 40px;
}

.send-btn:hover:not(:disabled) {
  background: #0958d9;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.stop-btn {
  margin-top: 12px;
  width: 100%;
  padding: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.stop-btn:hover {
  background: #f0f0f0;
  border-color: #ccc;
}
.messages {
  flex: 1;
  overflow-y: auto; /* 垂直滚动 */
  overflow-x: hidden; /* 隐藏水平滚动 */
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 100%; /* 确保高度限制 */
}
</style>
