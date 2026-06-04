import { Router } from 'express'
import type { Grade, Semester, Difficulty } from '../types.js'
import { requireAdmin } from '../middleware/auth.js'
import { getQuestions, generateAndStore } from '../services/questionStore.js'

const router = Router()

// GET /api/questions?grade=5&semester=下册&count=25
router.get('/', (req, res) => {
  const { grade, semester, count } = req.query

  if (!grade || !semester) {
    res.status(400).json({ error: 'bad_request', message: '缺少 grade 或 semester 参数' })
    return
  }

  const g = Number(grade) as Grade
  if (isNaN(g) || g < 1 || g > 9) {
    res.status(400).json({ error: 'bad_request', message: 'grade 必须在 1-9 之间' })
    return
  }

  if (semester !== '上册' && semester !== '下册') {
    res.status(400).json({ error: 'bad_request', message: 'semester 必须是上册或下册' })
    return
  }

  const c = count ? Number(count) : undefined
  const questions = getQuestions(g, semester as Semester, c)

  res.json({
    questions,
    count: questions.length,
    requestedCount: c ?? questions.length,
  })
})

// POST /api/questions/generate
router.post('/generate', requireAdmin, async (req, res) => {
  const { grade, semester, count, units, difficulty } = req.body

  if (!grade || !semester || !count) {
    res.status(400).json({ error: 'bad_request', message: '缺少 grade、semester 或 count 参数' })
    return
  }

  const g = Number(grade) as Grade
  if (isNaN(g) || g < 1 || g > 9) {
    res.status(400).json({ error: 'bad_request', message: 'grade 必须在 1-9 之间' })
    return
  }

  if (semester !== '上册' && semester !== '下册') {
    res.status(400).json({ error: 'bad_request', message: 'semester 必须是上册或下册' })
    return
  }

  const c = Number(count)
  if (isNaN(c) || c < 1 || c > 50) {
    res.status(400).json({ error: 'bad_request', message: 'count 必须在 1-50 之间' })
    return
  }

  const diff = difficulty && ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty as Difficulty : undefined
  const unitList = Array.isArray(units) && units.length > 0 ? units : undefined

  try {
    const result = await generateAndStore(g, semester as Semester, c, diff, unitList)
    res.json({
      questions: result.questions,
      generatedCount: result.generatedCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成题目时发生未知错误'
    console.error('生成题目失败:', err)
    res.status(502).json({ error: 'ai_error', message })
  }
})

export default router
