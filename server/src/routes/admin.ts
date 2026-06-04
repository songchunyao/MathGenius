import { Router } from 'express'
import type { Grade, Semester, Difficulty } from '../types.js'
import { requireAdmin } from '../middleware/auth.js'
import {
  getGradeSemesterStats,
  getAdminQuestions,
  getQuestionByIdSvc,
  updateQuestionSvc,
  deleteQuestionByIdSvc,
  appendAndStore,
  addQuestionSvc,
} from '../services/questionStore.js'

const router = Router()

// All admin routes require auth
router.use(requireAdmin)

// GET /api/admin/stats — 题库统计
router.get('/stats', (_req, res) => {
  const stats = getGradeSemesterStats()
  res.json({ stats })
})

// GET /api/admin/questions?grade=X&semester=Y — 查看全部题目
router.get('/questions', (req, res) => {
  const { grade, semester } = req.query
  if (!grade || !semester) {
    res.status(400).json({ error: 'bad_request', message: '缺少 grade 或 semester 参数' })
    return
  }
  const g = Number(grade)
  if (isNaN(g) || g < 1 || g > 9) {
    res.status(400).json({ error: 'bad_request', message: 'grade 必须在 1-9 之间' })
    return
  }
  if (semester !== '上册' && semester !== '下册') {
    res.status(400).json({ error: 'bad_request', message: 'semester 必须是上册或下册' })
    return
  }
  const questions = getAdminQuestions(g as Grade, semester as Semester)
  res.json({ questions })
})

// PUT /api/admin/questions/:id — 编辑题目
router.put('/questions/:id', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) {
    res.status(400).json({ error: 'bad_request', message: '无效的题目 ID' })
    return
  }

  const { grade, semester, category, title, prompt, options, answer, explanation, tip, figure, difficulty } = req.body

  // Build partial data (only provide what was sent)
  const data: any = {}
  if (grade !== undefined) { const g = Number(grade); if (g < 1 || g > 9) { res.status(400).json({ error: 'bad_request', message: 'grade 必须在 1-9 之间' }); return }; data.grade = g }
  if (semester !== undefined) { if (semester !== '上册' && semester !== '下册') { res.status(400).json({ error: 'bad_request', message: 'semester 必须是上册或下册' }); return }; data.semester = semester }
  if (category !== undefined) data.category = String(category)
  if (title !== undefined) data.title = String(title)
  if (prompt !== undefined) data.prompt = String(prompt)
  if (options !== undefined) { if (!Array.isArray(options) || options.length !== 4) { res.status(400).json({ error: 'bad_request', message: 'options 必须是包含4个字符串的数组' }); return }; data.options = options }
  if (answer !== undefined) data.answer = String(answer)
  if (explanation !== undefined) data.explanation = String(explanation)
  if (tip !== undefined) data.tip = String(tip)
  if (figure !== undefined) data.figure = String(figure)
  if (difficulty !== undefined) data.difficulty = String(difficulty)

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'bad_request', message: '未提供任何需要更新的字段' })
    return
  }

  const updated = updateQuestionSvc(id, data)
  if (!updated) {
    res.status(404).json({ error: 'not_found', message: '题目不存在' })
    return
  }

  res.json({ question: updated })
})

// DELETE /api/admin/questions/:id — 删除单题
router.delete('/questions/:id', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) {
    res.status(400).json({ error: 'bad_request', message: '无效的题目 ID' })
    return
  }

  const ok = deleteQuestionByIdSvc(id)
  if (!ok) {
    res.status(404).json({ error: 'not_found', message: '题目不存在' })
    return
  }

  res.json({ success: true })
})

// POST /api/admin/questions/generate — AI追加生成
router.post('/questions/generate', async (req, res) => {
  const { grade, semester, count, units, difficulty } = req.body

  if (!grade || !semester || !count) {
    res.status(400).json({ error: 'bad_request', message: '缺少 grade、semester 或 count 参数' })
    return
  }

  const g = Number(grade) as Grade
  if (isNaN(g) || g < 1 || g > 9) { res.status(400).json({ error: 'bad_request', message: 'grade 必须在 1-9 之间' }); return }
  if (semester !== '上册' && semester !== '下册') { res.status(400).json({ error: 'bad_request', message: 'semester 必须是上册或下册' }); return }
  const c = Number(count)
  if (isNaN(c) || c < 1 || c > 50) { res.status(400).json({ error: 'bad_request', message: 'count 必须在 1-50 之间' }); return }

  const diff = difficulty && ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty as Difficulty : undefined
  const unitList = Array.isArray(units) && units.length > 0 ? units : undefined

  try {
    const result = await appendAndStore(g, semester as Semester, c, diff, unitList)
    res.json({ questions: result.questions, generatedCount: result.generatedCount })
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成题目时发生未知错误'
    console.error('追加生成失败:', err)
    res.status(502).json({ error: 'ai_error', message })
  }
})

// POST /api/admin/questions — 手动新增题目
router.post('/questions', (req, res) => {
  const { grade, semester, category, title, prompt, options, answer, explanation, tip, figure } = req.body

  if (!grade || !semester || !category || !title || !prompt || !options || !answer || !explanation) {
    res.status(400).json({ error: 'bad_request', message: '缺少必要参数 (grade, semester, category, title, prompt, options, answer, explanation)' })
    return
  }

  const g = Number(grade) as Grade
  if (isNaN(g) || g < 1 || g > 9) { res.status(400).json({ error: 'bad_request', message: 'grade 必须在 1-9 之间' }); return }
  if (semester !== '上册' && semester !== '下册') { res.status(400).json({ error: 'bad_request', message: 'semester 必须是上册或下册' }); return }
  if (!Array.isArray(options) || options.length !== 4 || !options.every((o: unknown) => typeof o === 'string')) {
    res.status(400).json({ error: 'bad_request', message: 'options 必须是包含4个字符串的数组' })
    return
  }

  const question = addQuestionSvc(g, semester as Semester, {
    category: String(category),
    title: String(title),
    prompt: String(prompt),
    options: options as string[],
    answer: String(answer),
    explanation: String(explanation),
    tip: String(tip ?? ''),
    figure: String(figure ?? ''),
  })

  res.status(201).json({ question })
})

export default router
