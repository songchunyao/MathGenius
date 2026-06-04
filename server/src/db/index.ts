import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { config } from '../config.js'

interface StoredQuestion {
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
}

interface User {
  id: number
  username: string
  passwordHash: string
  createdAt: string
}

interface Session {
  token: string
  userId: number
  createdAt: string
}

interface Mistake {
  id: number
  userId: number
  questionId: number
  wrongAnswer: string
  answeredAt: string
  isReviewed: boolean
}

interface ProgressRecord {
  id: number
  userId: number
  grade: number
  semester: string
  questionId: number
  correct: boolean
  answeredAt: string
}

interface StageResultStore {
  id: number
  userId: number
  grade: number
  semester: string
  stageIndex: number
  score: number
  total: number
  coins: number
  completedAt: string
}

interface Store {
  questions: StoredQuestion[]
  adminLogs: Array<{ action: string; grade: number; semester: string; count: number; generated: number; at: string }>
  users: User[]
  sessions: Session[]
  mistakes: Mistake[]
  progressRecords: ProgressRecord[]
  stageResults: StageResultStore[]
}

const DB_PATH = config.dbPath.replace('.db', '.json')
const dataDir = path.dirname(DB_PATH)

let store: Store = { questions: [], adminLogs: [], users: [], sessions: [], mistakes: [], progressRecords: [], stageResults: [] }

function load(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
      store = { questions: raw.questions ?? [], adminLogs: raw.adminLogs ?? [], users: raw.users ?? [], sessions: raw.sessions ?? [], mistakes: raw.mistakes ?? [], progressRecords: raw.progressRecords ?? [], stageResults: raw.stageResults ?? [] }
    } catch { /* ignore */ }
  }
}

function save(): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(store), 'utf-8')
}

let nextId = 1
let nextUserId = 1
let nextMistakeId = 1
let nextProgressId = 1

export function initDatabase(): void {
  load()
  if (store.questions.length > 0) nextId = Math.max(...store.questions.map(q => q.id)) + 1
  if (store.users.length > 0) nextUserId = Math.max(...store.users.map(u => u.id)) + 1
  if (store.mistakes.length > 0) nextMistakeId = Math.max(...store.mistakes.map(m => m.id)) + 1
  if (store.progressRecords.length > 0) nextProgressId = Math.max(...store.progressRecords.map(p => p.id)) + 1
  console.log(`✅ 数据库初始化完成（${store.questions.length} 题，${store.users.length} 用户，${store.mistakes.length} 错题，${store.progressRecords.length} 进度记录）`)
}

// ======== Questions ========

export function queryQuestions(grade: number, semester: string): StoredQuestion[] {
  return store.questions.filter(q => q.grade === grade && q.semester === semester).sort((a, b) => a.id - b.id)
}

export function insertQuestion(q: Omit<StoredQuestion, 'id'>): void { store.questions.push({ ...q, id: nextId++ }) }
export function deleteQuestions(grade: number, semester: string): void { store.questions = store.questions.filter(q => !(q.grade === grade && q.semester === semester)) }
export function logAdmin(action: string, grade: number, semester: string, count: number, generated: number): void { store.adminLogs.push({ action, grade, semester, count, generated, at: new Date().toISOString() }) }
export function persist(): void { save() }
export function getQuestionById(id: number): StoredQuestion | undefined { return store.questions.find(q => q.id === id) }
export function updateQuestion(id: number, data: Partial<Omit<StoredQuestion, 'id'>>): StoredQuestion | null {
  const idx = store.questions.findIndex(q => q.id === id); if (idx === -1) return null; store.questions[idx] = { ...store.questions[idx], ...data }; return store.questions[idx]
}
export function deleteQuestionById(id: number): boolean {
  const idx = store.questions.findIndex(q => q.id === id); if (idx === -1) return false; store.questions.splice(idx, 1); return true
}
export function getAllGradeSemesterStats(): Array<{ grade: number; semester: string; count: number }> {
  const map = new Map<string, { grade: number; semester: string; count: number }>()
  for (const q of store.questions) { const k = `${q.grade}-${q.semester}`; const e = map.get(k); if (e) e.count++; else map.set(k, { grade: q.grade, semester: q.semester, count: 1 }) }
  return Array.from(map.values()).sort((a, b) => a.grade - b.grade || a.semester.localeCompare(b.semester))
}
export function addManualQuestion(data: Omit<StoredQuestion, 'id'>): StoredQuestion { const q = { ...data, id: nextId++ }; store.questions.push(q); return q }

// ======== Users ========

export function createUser(username: string, passwordHash: string): User {
  const user: User = { id: nextUserId++, username, passwordHash, createdAt: new Date().toISOString() }
  store.users.push(user)
  save()
  return user
}

export function findUserByUsername(username: string): User | undefined { return store.users.find(u => u.username === username) }
export function findUserById(id: number): User | undefined { return store.users.find(u => u.id === id) }

// ======== Sessions ========

export function createSession(userId: number): Session {
  const session: Session = { token: crypto.randomUUID(), userId, createdAt: new Date().toISOString() }
  store.sessions.push(session)
  save()
  return session
}

export function findSessionByToken(token: string): Session | undefined { return store.sessions.find(s => s.token === token) }
export function deleteSession(token: string): void { store.sessions = store.sessions.filter(s => s.token !== token); save() }

// ======== Mistakes ========

export function createMistake(userId: number, questionId: number, wrongAnswer: string): Mistake {
  const m: Mistake = { id: nextMistakeId++, userId, questionId, wrongAnswer, answeredAt: new Date().toISOString(), isReviewed: false }
  store.mistakes.push(m)
  save()
  return m
}

export function findMistakesByUserId(userId: number): Mistake[] { return store.mistakes.filter(m => m.userId === userId).sort((a, b) => b.id - a.id) }
export function findMistakeById(id: number): Mistake | undefined { return store.mistakes.find(m => m.id === id) }

export function updateMistake(id: number, data: Partial<Mistake>): Mistake | null {
  const idx = store.mistakes.findIndex(m => m.id === id); if (idx === -1) return null; store.mistakes[idx] = { ...store.mistakes[idx], ...data }; save(); return store.mistakes[idx]
}

export function deleteMistake(id: number): boolean {
  const idx = store.mistakes.findIndex(m => m.id === id); if (idx === -1) return false; store.mistakes.splice(idx, 1); save(); return true
}

// ======== Progress Records ========

export function recordProgress(userId: number, grade: number, semester: string, questionId: number, correct: boolean): ProgressRecord {
  const p: ProgressRecord = { id: nextProgressId++, userId, grade, semester, questionId, correct, answeredAt: new Date().toISOString() }
  store.progressRecords.push(p)
  save()
  return p
}

export function getProgressByUserAndGrade(userId: number, grade: number, semester: string): ProgressRecord[] {
  return store.progressRecords.filter(p => p.userId === userId && p.grade === grade && p.semester === semester)
}

// ======== Stage Results ========

export function saveStageResult(userId: number, grade: number, semester: string, stageIndex: number, score: number, total: number, coins: number): void {
  // Upsert: if a record exists for this user+grade+semester+stageIndex, update it; otherwise insert
  const existing = store.stageResults.findIndex(r => r.userId === userId && r.grade === grade && r.semester === semester && r.stageIndex === stageIndex)
  if (existing >= 0) {
    store.stageResults[existing] = { ...store.stageResults[existing], score, total, coins, completedAt: new Date().toISOString() }
  } else {
    store.stageResults.push({ id: 0, userId, grade, semester, stageIndex, score, total, coins, completedAt: new Date().toISOString() })
  }
  save()
}

export function getStageResultsByUserAndGrade(userId: number, grade: number, semester: string): StageResultStore[] {
  return store.stageResults.filter(r => r.userId === userId && r.grade === grade && r.semester === semester).sort((a, b) => a.stageIndex - b.stageIndex)
}
