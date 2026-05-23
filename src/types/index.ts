export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Semester = '上册' | '下册'
export type AIProvider = 'deepseek' | 'glm'
export type QuizPhase = 'config' | 'loading' | 'quiz'

export interface Question {
  id: number
  category: string
  title: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
  tip: string
}

export interface QuizConfig {
  grade: Grade
  semester: Semester
  questionCount: number
  provider: AIProvider
  model: string
  apiKey: string
}

export interface LoadingStatus {
  type: 'loading' | 'error' | 'success'
  message?: string
}
