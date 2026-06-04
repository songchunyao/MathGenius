export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Semester = '上册' | '下册'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AIProvider = 'deepseek' | 'glm'

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

export interface DbQuestion {
  id: number
  grade: number
  semester: string
  category: string
  title: string
  prompt: string
  options: string
  answer: string
  explanation: string
  tip: string
  figure?: string
  difficulty?: string
  generated_at: string
}

export interface GenerateRequest {
  grade: Grade
  semester: Semester
  count: number
  units?: string[]
  difficulty?: Difficulty
}
