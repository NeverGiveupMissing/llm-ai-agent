const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')
const { estimateTokens } = require('./token-estimator')
const config = require('../config')

const LOG_DIR = path.join(process.cwd(), config.log.dir)

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

/**
 * 记录聊天日志
 * @param {Array} messages - 消息数组
 * @param {string} response - 响应内容
 * @param {number} duration - 耗时（秒）
 * @param {string} [model] - 模型名称
 * @param {string} [error] - 错误信息
 * @param {boolean} [stream=false] - 是否流式
 * @param {string} [traceId] - 追踪 ID
 * @param {string} [sessionId] - 会话 ID
 * @returns {string} trace_id
 */
function logChat(messages, response, duration, model, error, stream = false, traceId, sessionId) {
  if (!traceId) {
    traceId = uuidv4()
  }

  const inputText = messages.map((msg) => msg.content).join('\n')
  const now = dayjs()

  const log = {
    trace_id: traceId,
    session_id: sessionId || 'default',
    time: now.toISOString(),
    model: model || 'unknown',
    duration: Math.round(duration * 1000) / 1000,
    input: messages || [],
    input_preview: inputText.length > 200 ? inputText.substring(0, 200) : inputText,
    output: response || '',
    output_preview:
      (response || '').length > 200 ? (response || '').substring(0, 200) : response || '',
    tokens: {
      input: estimateTokens(inputText),
      output: estimateTokens(response || ''),
    },
    stream,
    error: error || null,
    status: error ? 'error' : 'success',
  }

  const logFile = path.join(LOG_DIR, `chat_${now.format('YYYY-MM-DD')}.jsonl`)
  fs.appendFileSync(logFile, JSON.stringify(log) + '\n', 'utf-8')

  const statusIcon = error ? '❌' : '✅'
  const tokenInfo = `Tokens: ${log.tokens.input}→${log.tokens.output}`
  console.log(
    `${statusIcon} [${traceId.substring(0, 8)}] ${tokenInfo} | 耗时: ${duration.toFixed(2)}s`,
  )

  return traceId
}

module.exports = { logChat }
