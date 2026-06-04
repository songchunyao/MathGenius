import type { Grade, Semester, Question, Difficulty } from '../types.js'
import {
  queryQuestions, insertQuestion, deleteQuestions, logAdmin, persist,
  getQuestionById, updateQuestion as dbUpdateQuestion, deleteQuestionById as dbDeleteQuestionById,
  getAllGradeSemesterStats, addManualQuestion,
} from '../db/index.js'
import { getCache, setCache, invalidateCache } from '../middleware/cache.js'
import { generateQuestions } from './generator.js'

function toQuestion(row: any): Question {
  const options = JSON.parse(row.options)
  let answer = row.answer
  // Fix: AI sometimes stores "A"/"B" as answer instead of the option value
  if (!options.includes(answer) && /^[A-D]$/i.test(answer)) {
    const idx = ['A', 'B', 'C', 'D'].indexOf(answer.toUpperCase())
    if (idx >= 0 && idx < options.length) answer = options[idx]
  }
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    prompt: row.prompt,
    options,
    answer,
    explanation: row.explanation,
    tip: row.tip || '',
    figure: row.figure || '',
    difficulty: row.difficulty || undefined,
  }
}

// ======== PUBLIC (cached) ========

export function getQuestions(grade: Grade, semester: Semester, count?: number): Question[] {
  const cached = getCache(grade, semester)
  if (cached) return count ? cached.slice(0, count) : cached

  const rows = queryQuestions(grade, semester)
  const qs = rows.map(toQuestion)
  setCache(grade, semester, qs)
  return count ? qs.slice(0, count) : qs
}

export async function generateAndStore(grade: Grade, semester: Semester, count: number, difficulty?: Difficulty, units?: string[]): Promise<{ questions: Question[]; generatedCount: number }> {
  const questions = await generateQuestions(grade, semester, count, difficulty, units)
  deleteQuestions(grade, semester)
  for (const q of questions) {
    insertQuestion({ grade, semester, category: q.category, title: q.title, prompt: q.prompt, options: JSON.stringify(q.options), answer: q.answer, explanation: q.explanation, tip: q.tip || '', figure: q.figure || '', difficulty: q.difficulty || '' })
  }
  logAdmin('generate', grade, semester, count, questions.length)
  persist()
  setCache(grade, semester, questions)
  console.log(`✅ 已生成 ${questions.length} 道题目（${grade}年级${semester}）`)
  return { questions, generatedCount: questions.length }
}

// ======== ADMIN CRUD (uncached + cache invalidate) ========

export function getAdminQuestions(grade: Grade, semester: Semester): Question[] {
  return queryQuestions(grade, semester).map(toQuestion)
}

export function getGradeSemesterStats(): Array<{ grade: number; semester: string; count: number }> {
  return getAllGradeSemesterStats()
}

export function getQuestionByIdSvc(id: number): Question | null {
  const row = getQuestionById(id)
  return row ? toQuestion(row) : null
}

export function updateQuestionSvc(id: number, data: Partial<Omit<Question, 'id'>> & { grade?: number; semester?: string }): Question | null {
  // Stringify options if present
  const dbData: any = { ...data }
  if (dbData.options && Array.isArray(dbData.options)) {
    dbData.options = JSON.stringify(dbData.options)
  }
  // Get old question for cache invalidation
  const old = getQuestionById(id)
  const updated = dbUpdateQuestion(id, dbData)
  if (!updated) return null
  persist()
  // Invalidate both old and new cache keys in case grade/semester changed
  if (old) invalidateCache(old.grade, old.semester)
  if (updated.grade && updated.semester && (!old || old.grade !== updated.grade || old.semester !== updated.semester)) {
    invalidateCache(updated.grade, updated.semester)
  }
  return toQuestion(updated)
}

export function deleteQuestionByIdSvc(id: number): boolean {
  const q = getQuestionById(id)
  if (!q) return false
  const ok = dbDeleteQuestionById(id)
  if (ok) {
    persist()
    invalidateCache(q.grade, q.semester)
  }
  return ok
}

export async function appendAndStore(grade: Grade, semester: Semester, count: number, difficulty?: Difficulty, units?: string[]): Promise<{ questions: Question[]; generatedCount: number }> {
  const questions = await generateQuestions(grade, semester, count, difficulty, units)
  for (const q of questions) {
    insertQuestion({ grade, semester, category: q.category, title: q.title, prompt: q.prompt, options: JSON.stringify(q.options), answer: q.answer, explanation: q.explanation, tip: q.tip || '', figure: q.figure || '', difficulty: q.difficulty || '' })
  }
  logAdmin('generate_append', grade, semester, count, questions.length)
  persist()
  invalidateCache(grade, semester)
  console.log(`✅ 已追加 ${questions.length} 道题目（${grade}年级${semester}）`)
  return { questions, generatedCount: questions.length }
}

export function addQuestionSvc(grade: Grade, semester: Semester, data: Omit<Question, 'id'>): Question {
  const row = addManualQuestion({ grade, semester, category: data.category, title: data.title, prompt: data.prompt, options: JSON.stringify(data.options), answer: data.answer, explanation: data.explanation, tip: data.tip || '' })
  persist()
  invalidateCache(grade, semester)
  return toQuestion(row)
}
