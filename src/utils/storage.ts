import type { QuizConfig } from '../types'

export function saveConfig(config: QuizConfig): void {
  try {
    localStorage.setItem('math_quiz_grade', String(config.grade))
    localStorage.setItem('math_quiz_semester', config.semester)
    localStorage.setItem('math_quiz_question_count', String(config.questionCount))
  } catch {
    // localStorage may be unavailable
  }
}

export function loadConfig(): Partial<QuizConfig> {
  try {
    const config: Partial<QuizConfig> = {}
    const grade = localStorage.getItem('math_quiz_grade')
    const semester = localStorage.getItem('math_quiz_semester')
    const questionCount = localStorage.getItem('math_quiz_question_count')

    if (grade) config.grade = Number(grade) as QuizConfig['grade']
    if (semester === '上册' || semester === '下册') config.semester = semester
    if (questionCount) config.questionCount = Number(questionCount)

    return config
  } catch {
    return {}
  }
}
