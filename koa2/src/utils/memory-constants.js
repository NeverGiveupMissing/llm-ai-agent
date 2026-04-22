/**
 * AI Agent 记忆配置常量
 * 定义了记忆的类型、标签以及记忆管理的默认设置
 */

// 定义记忆的类别（枚举风格对象）
const MEMORY_TYPES = {
  FACT: 'fact', // 事实：客观存在的信息（例如：“天空是蓝色的”）
  PREFERENCE: 'preference', // 偏好：用户的喜好或厌恶（例如：“我喜欢咖啡”）
  GOAL: 'goal', // 目标：用户的目标或意图
  EVENT: 'event', // 事件：具体发生的经历或事情
  OPINION: 'opinion', // 观点：主观的看法或信念
}

// 定义记忆的上下文标签（用于分类记忆所属领域）
const MEMORY_TAGS = {
  PERSONAL: 'personal', // 个人生活相关
  WORK: 'work', // 工作或职业相关
  TECH: 'tech', // 技术相关
  HOBBY: 'hobby', // 兴趣爱好相关
  LOCATION: 'location', // 地理位置相关
  LANGUAGE: 'language', // 语言偏好或学习相关
  PROJECT: 'project', // 特定项目相关
}

// 记忆检索与存储的默认配置参数
const DEFAULT_MEMORY_CONFIG = {
  MAX_RETRIEVE_COUNT: 5, // 每次查询最多检索的记忆数量
  MIN_SIMILARITY: 0.7, // 记忆相关性判定的最小相似度阈值（余弦相似度）
  MIN_SIMILARITY_FOR_DEDUP: 0.9, // 用于判断重复记忆的最小相似度阈值（高于此值视为重复）
  MAX_MEMORIES_PER_USER: 100, // 每个用户允许存储的最大记忆数量（用于控制成本和性能）
  IMPORTANCE_THRESHOLD: 6, // 重要性分数阈值，超过此分数的记忆被视为“高重要性”
  MIN_IMPORTANCE_FOR_SAVE: 4, // 保存记忆所需的最低重要性分数
  CONTEXT_WINDOW_TOKENS: 4000, // 注入记忆上下文时预估消耗的 Token 预算
}

// 导出常量供其他模块使用
// 注意：如果您的项目（Vite/Vue3）主要使用 ES Module (import/export)，
// 建议将下方的 module.exports 替换为 export 语法以保持一致性。
module.exports = {
  MEMORY_TYPES,
  MEMORY_TAGS,
  DEFAULT_MEMORY_CONFIG,
}
