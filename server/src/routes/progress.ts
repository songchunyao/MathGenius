import { Router } from 'express'
import { requireUser } from '../middleware/auth.js'
import { recordProgress, getProgressByUserAndGrade, saveStageResult, getStageResultsByUserAndGrade } from '../db/index.js'

const router = Router()

router.use(requireUser)

// POST /api/progress — record a progress entry
router.post('/', (req, res) => {
  const { grade, semester, questionId, correct } = req.body
  if (!grade || !semester || questionId === undefined || correct === undefined) {
    res.status(400).json({ error: 'bad_request', message: '缺少参数' })
    return
  }
  const p = recordProgress(req.userId!, Number(grade), String(semester), Number(questionId), Boolean(correct))
  res.status(201).json({ progress: p })
})

// GET /api/progress?grade=X&semester=Y
router.get('/', (req, res) => {
  const { grade, semester } = req.query
  if (!grade || !semester) {
    res.status(400).json({ error: 'bad_request', message: '缺少 grade 或 semester' })
    return
  }
  const records = getProgressByUserAndGrade(req.userId!, Number(grade), String(semester))
  res.json({ progress: records })
})

// POST /api/progress/stage — save stage result
router.post('/stage', (req, res) => {
  const { grade, semester, stageIndex, score, total, coins } = req.body
  if (grade === undefined || !semester || stageIndex === undefined || score === undefined || total === undefined || coins === undefined) {
    res.status(400).json({ error: 'bad_request', message: '缺少参数' })
    return
  }
  saveStageResult(req.userId!, Number(grade), String(semester), Number(stageIndex), Number(score), Number(total), Number(coins))
  res.json({ success: true })
})

// GET /api/progress/stages?grade=X&semester=Y
router.get('/stages', (req, res) => {
  const { grade, semester } = req.query
  if (!grade || !semester) {
    res.status(400).json({ error: 'bad_request', message: '缺少 grade 或 semester' })
    return
  }
  const results = getStageResultsByUserAndGrade(req.userId!, Number(grade), String(semester))
  res.json({ stages: results })
})

export default router
