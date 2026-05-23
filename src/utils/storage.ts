import type { QuizConfig } from '../types'

const KEYS = {
  apiKey: 'math_quiz_api_key',
  provider: 'math_quiz_provider',
  model: 'math_quiz_model',
  grade: 'math_quiz_grade',
  semester: 'math_quiz_semester',
  questionCount: 'math_quiz_question_count',
} as const

export function saveConfig(config: QuizConfig): void {
  try {
    localStorage.setItem(KEYS.apiKey, config.apiKey)
    localStorage.setItem(KEYS.provider, config.provider)
    localStorage.setItem(KEYS.model, config.model)
    localStorage.setItem(KEYS.grade, String(config.grade))
    localStorage.setItem(KEYS.semester, config.semester)
    localStorage.setItem(KEYS.questionCount, String(config.questionCount))
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }
}

export function loadConfig(): Partial<QuizConfig> {
  try {
    const config: Partial<QuizConfig> = {}
    const apiKey = localStorage.getItem(KEYS.apiKey)
    const provider = localStorage.getItem(KEYS.provider)
    const model = localStorage.getItem(KEYS.model)
    const grade = localStorage.getItem(KEYS.grade)
    const semester = localStorage.getItem(KEYS.semester)
    const questionCount = localStorage.getItem(KEYS.questionCount)

    if (apiKey) config.apiKey = apiKey
    if (provider === 'deepseek' || provider === 'glm') config.provider = provider
    if (model) config.model = model
    if (grade) config.grade = Number(grade) as QuizConfig['grade']
    if (semester === '上册' || semester === '下册') config.semester = semester
    if (questionCount) config.questionCount = Number(questionCount)

    return config
  } catch {
    return {}
  }
}
