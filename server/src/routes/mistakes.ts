import { Router } from 'express'
import { requireUser } from '../middleware/auth.js'
import { createMistake, findMistakesByUserId, findMistakeById, updateMistake, deleteMistake, getQuestionById } from '../db/index.js'

const router = Router()

// All routes require user auth
router.use(requireUser)

// POST /api/mistakes — record a mistake
router.post('/', (req, res) => {
  const { questionId, wrongAnswer } = req.body
  if (!questionId || !wrongAnswer) {
    res.status(400).json({ error: 'bad_request', message: '缺少 questionId 或 wrongAnswer' })
    return
  }

  // Verify question exists
  const question = getQuestionById(Number(questionId))
  if (!question) {
    res.status(404).json({ error: 'not_found', message: '题目不存在' })
    return
  }

  const mistake = createMistake(req.userId!, Number(questionId), String(wrongAnswer))
  res.status(201).json({ mistake: { ...mistake, question } })
})

// GET /api/mistakes — get user's mistakes with full question data
router.get('/', (req, res) => {
  const mistakes = findMistakesByUserId(req.userId!)
  const enriched = mistakes.map(m => ({
    id: m.id,
    questionId: m.questionId,
    wrongAnswer: m.wrongAnswer,
    answeredAt: m.answeredAt,
    isReviewed: m.isReviewed,
    question: getQuestionById(m.questionId) ?? null,
  }))
  res.json({ mistakes: enriched })
})

// PUT /api/mistakes/:id/review — mark as reviewed
router.put('/:id/review', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) { res.status(400).json({ error: 'bad_request', message: '无效的错题 ID' }); return }

  const mistake = findMistakeById(id)
  if (!mistake) { res.status(404).json({ error: 'not_found', message: '错题不存在' }); return }
  if (mistake.userId !== req.userId) { res.status(403).json({ error: 'forbidden', message: '无权操作' }); return }

  const updated = updateMistake(id, { isReviewed: true })
  res.json({ mistake: updated })
})

// DELETE /api/mistakes/:id — delete a mistake
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) { res.status(400).json({ error: 'bad_request', message: '无效的错题 ID' }); return }

  const mistake = findMistakeById(id)
  if (!mistake) { res.status(404).json({ error: 'not_found', message: '错题不存在' }); return }
  if (mistake.userId !== req.userId) { res.status(403).json({ error: 'forbidden', message: '无权操作' }); return }

  deleteMistake(id)
  res.json({ success: true })
})

export default router
