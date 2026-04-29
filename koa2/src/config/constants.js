/**
 * 应用全局常量配置
 * 集中管理所有业务常量、枚举和默认参数
 */

// ==================== 记忆类型枚举 ====================
const MEMORY_TYPES = {
  FACT: 'fact', // 事实：客观存在的信息
  PREFERENCE: 'preference', // 偏好：用户的喜好或厌恶
  GOAL: 'goal', // 目标：用户的目标或意图
  EVENT: 'event', // 事件：具体发生的经历或事情
  OPINION: 'opinion', // 观点：主观的看法或信念
}

// ==================== 记忆标签分类 ====================
const MEMORY_TAGS = {
  PERSONAL: 'personal', // 个人生活相关
  WORK: 'work', // 工作或职业相关
  TECH: 'tech', // 技术相关
  HOBBY: 'hobby', // 兴趣爱好相关
  LOCATION: 'location', // 地理位置相关
  LANGUAGE: 'language', // 语言偏好或学习相关
  PROJECT: 'project', // 特定项目相关
}

// ==================== 记忆管理默认配置 ====================
const DEFAULT_MEMORY_CONFIG = {
  MAX_RETRIEVE_COUNT: 5, // 每次查询最多检索的记忆数量
  MIN_SIMILARITY: 0.7, // 记忆相关性判定的最小相似度阈值
  MIN_SIMILARITY_FOR_DEDUP: 0.9, // 用于判断重复记忆的最小相似度阈值
  MAX_MEMORIES_PER_USER: 100, // 每个用户允许存储的最大记忆数量
  IMPORTANCE_THRESHOLD: 6, // 重要性分数阈值（超过此值视为高重要性）
  MIN_IMPORTANCE_FOR_SAVE: 4, // 保存记忆所需的最低重要性分数
  CONTEXT_WINDOW_TOKENS: 4000, // 注入记忆上下文时预估消耗的 Token 预算
}

// ==================== 日志配置 ====================
const LOG_CONFIG = {
  DEFAULT_DIR: 'logs/chat_history',
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },
}

// ==================== 数据库配置 ====================
const DB_CONFIG = {
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: 5432,
  DEFAULT_USER: 'postgres',
  DEFAULT_PASSWORD: '',
  DEFAULT_NAME: 'postgres',
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 10000,
  VECTOR_DIMENSION: 1536, // 向量维度
  IVFFLAT_LISTS: 100, // IVF 索引列表数
}

// ==================== 服务器配置 ====================
const SERVER_CONFIG = {
  DEFAULT_HOST: '127.0.0.1',
  DEFAULT_PORT: 8000,
  DEFAULT_PREFIX: '/koa2api',
}

// ==================== AI API 配置 ====================
const AI_API_CONFIG = {
  DEFAULT_BASE_URL: 'https://api.moonshot.cn/v1',
  DEFAULT_MODEL: 'moonshot-v1-8k',
  DEFAULT_EMBEDDING_MODEL: 'text-embedding-ada-002',
}

module.exports = {
  MEMORY_TYPES,
  MEMORY_TAGS,
  DEFAULT_MEMORY_CONFIG,
  LOG_CONFIG,
  DB_CONFIG,
  SERVER_CONFIG,
  AI_API_CONFIG,
}
