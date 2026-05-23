import type { AIProvider } from '../types'

export interface APIProviderInfo {
  name: string
  endpoint: string
  defaultModel: string
  models: string[]
}

export const API_PROVIDERS: Record<AIProvider, APIProviderInfo> = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-v4-pro',
    models: ['deepseek-v4-pro'],
  },
  glm: {
    name: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-5.1',
    models: ['glm-5.1'],
  },
}

export const MIN_QUESTIONS = 1
export const MAX_QUESTIONS = 50
export const DEFAULT_QUESTIONS = 25
export const API_TIMEOUT_MS = 60_000
