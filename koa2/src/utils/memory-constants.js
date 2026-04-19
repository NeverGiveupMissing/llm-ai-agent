const MEMORY_TYPES = {
  FACT: 'fact',
  PREFERENCE: 'preference',
  GOAL: 'goal',
  EVENT: 'event',
  OPINION: 'opinion',
}

const MEMORY_TAGS = {
  PERSONAL: 'personal',
  WORK: 'work',
  TECH: 'tech',
  HOBBY: 'hobby',
  LOCATION: 'location',
  LANGUAGE: 'language',
  PROJECT: 'project',
}

const DEFAULT_MEMORY_CONFIG = {
  MAX_RETRIEVE_COUNT: 5,
  MIN_SIMILARITY: 0.7,
  MIN_SIMILARITY_FOR_DEDUP: 0.9,
  MAX_MEMORIES_PER_USER: 100,
  IMPORTANCE_THRESHOLD: 6,
  CONTEXT_WINDOW_TOKENS: 4000,
}

module.exports = {
  MEMORY_TYPES,
  MEMORY_TAGS,
  DEFAULT_MEMORY_CONFIG,
}
