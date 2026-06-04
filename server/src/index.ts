import express from 'express'
import cors from 'cors'
import { config, validateConfig } from './config.js'
import { initDatabase } from './db/index.js'
import healthRouter from './routes/health.js'
import questionsRouter from './routes/questions.js'
import adminRouter from './routes/admin.js'
import authRouter from './routes/auth.js'
import mistakesRouter from './routes/mistakes.js'
import progressRouter from './routes/progress.js'

// Validate environment
const configError = validateConfig()
if (configError) {
  console.error(`❌ 配置错误: ${configError}`)
  process.exit(1)
}

function main() {
  // Initialize database
  initDatabase()

  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())

  // Routes
  app.use('/api', healthRouter)
  app.use('/api/questions', questionsRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/mistakes', mistakesRouter)
  app.use('/api/progress', progressRouter)

  // Start server
  app.listen(config.port, () => {
    console.log(`🚀 MathTest API 服务器已启动: http://localhost:${config.port}`)
    console.log(`📡 AI 提供商: ${config.aiProvider}`)
  })
}

main()
