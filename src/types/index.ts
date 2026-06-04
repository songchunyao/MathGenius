export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Semester = '上册' | '下册'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuizPhase = 'auth' | 'config' | 'loading' | 'stageMap' | 'quiz' | 'completion' | 'admin' | 'userDashboard' | 'mistakeBook'

export interface Question {
  id: number
  category: string
  title: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
  tip: string
  figure?: string
  difficulty?: Difficulty
}

export interface QuizConfig {
  grade: Grade
  semester: Semester
  questionCount: number
  difficulty?: Difficulty
  units?: string[]
}

export interface LoadingStatus {
  type: 'loading' | 'error' | 'success'
  message?: string
}

export interface GradeSemesterStats {
  grade: Grade
  semester: Semester
  count: number
}

export type QuestionFormData = Omit<Question, 'id'>

export interface User {
  id: number
  username: string
}

export interface MistakeRecord {
  id: number
  questionId: number
  wrongAnswer: string
  answeredAt: string
  isReviewed: boolean
  question: Question | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface AdventureState {
  hearts: number
  maxHearts: number
  exp: number
  level: number
  score: number
  combo: number
  bestCombo: number
  mistakes: string[]
}

export interface ProgressRecord {
  questionId: number
  correct: boolean
  answeredAt: string
}

export interface StageResult {
  stageIndex: number
  score: number
  total: number
  coins: number
  completedAt: string
}

export interface StageDef {
  category: string
  questions: Question[]
  stageIndex: number
}

export function calcLevel(exp: number): number {
  if (exp < 50) return 1
  if (exp < 150) return 2
  if (exp < 300) return 3
  if (exp < 500) return 4
  return 5
}

export function expToNextLevel(exp: number): number {
  const thresholds = [50, 150, 300, 500, Infinity]
  const level = calcLevel(exp)
  const next = thresholds[Math.min(level, thresholds.length - 1)]
  return next
}

export function calcStars(score: number, total: number): number {
  const rate = total > 0 ? score / total : 0
  if (rate >= 0.9) return 3
  if (rate >= 0.7) return 2
  if (rate >= 0.5) return 1
  return 0
}
