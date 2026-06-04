import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  adminToken: process.env.ADMIN_TOKEN || '',
  aiProvider: process.env.AI_PROVIDER || 'deepseek',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  glmApiKey: process.env.GLM_API_KEY || '',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, './data/math-test.db'),
} as const

export function validateConfig(): string | null {
  if (!config.adminToken) return '缺少 ADMIN_TOKEN 配置'
  if (!config.deepseekApiKey && config.aiProvider === 'deepseek') return '缺少 DEEPSEEK_API_KEY 配置'
  if (!config.glmApiKey && config.aiProvider === 'glm') return '缺少 GLM_API_KEY 配置'
  return null
}
