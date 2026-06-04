import type { Question, Grade, Semester, GradeSemesterStats, QuestionFormData, User, MistakeRecord, AuthResponse, ProgressRecord, StageResult } from '../types'

const BASE_URL = '/api'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || '请求失败')
  }
  return res.json()
}

// ======== PUBLIC ========

export async function fetchQuestions(grade: Grade, semester: Semester, count?: number): Promise<Question[]> {
  const params = new URLSearchParams({ grade: String(grade), semester })
  if (count !== undefined) params.set('count', String(count))
  const json = await apiFetch<{ questions: Question[] }>(`${BASE_URL}/questions?${params}`, { signal: AbortSignal.timeout(15000) })
  return json.questions
}

export async function generateQuestions(grade: Grade, semester: Semester, count: number, adminToken: string): Promise<Question[]> {
  const json = await apiFetch<{ questions: Question[] }>(`${BASE_URL}/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
    body: JSON.stringify({ grade, semester, count }),
    signal: AbortSignal.timeout(120_000),
  })
  return json.questions
}

// ======== ADMIN ========

function adminHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Admin-Token': token }
}

export async function fetchAdminStats(token: string): Promise<GradeSemesterStats[]> {
  const json = await apiFetch<{ stats: GradeSemesterStats[] }>(`${BASE_URL}/admin/stats`, { headers: adminHeaders(token), signal: AbortSignal.timeout(10000) })
  return json.stats
}

export async function fetchAdminQuestions(grade: Grade, semester: Semester, token: string): Promise<Question[]> {
  const json = await apiFetch<{ questions: Question[] }>(`${BASE_URL}/admin/questions?grade=${grade}&semester=${semester}`, { headers: adminHeaders(token), signal: AbortSignal.timeout(10000) })
  return json.questions
}

export async function updateQuestion(id: number, data: Partial<QuestionFormData>, token: string): Promise<Question> {
  const json = await apiFetch<{ question: Question }>(`${BASE_URL}/admin/questions/${id}`, { method: 'PUT', headers: adminHeaders(token), body: JSON.stringify(data), signal: AbortSignal.timeout(10000) })
  return json.question
}

export async function deleteQuestion(id: number, token: string): Promise<void> {
  await apiFetch(`${BASE_URL}/admin/questions/${id}`, { method: 'DELETE', headers: adminHeaders(token), signal: AbortSignal.timeout(10000) })
}

export async function appendQuestions(grade: Grade, semester: Semester, count: number, token: string, difficulty?: string, units?: string[]): Promise<{ questions: Question[]; generatedCount: number }> {
  return apiFetch(`${BASE_URL}/admin/questions/generate`, { method: 'POST', headers: adminHeaders(token), body: JSON.stringify({ grade, semester, count, difficulty, units }), signal: AbortSignal.timeout(120_000) })
}

export async function addQuestion(grade: Grade, semester: Semester, data: QuestionFormData, token: string): Promise<Question> {
  const json = await apiFetch<{ question: Question }>(`${BASE_URL}/admin/questions`, { method: 'POST', headers: adminHeaders(token), body: JSON.stringify({ grade, semester, ...data }), signal: AbortSignal.timeout(10000) })
  return json.question
}

// ======== AUTH ========

export async function register(username: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(10000) })
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(10000) })
}

export async function logout(token: string): Promise<void> {
  await apiFetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers: { 'X-Auth-Token': token }, signal: AbortSignal.timeout(5000) })
}

export async function fetchMe(token: string): Promise<User> {
  const json = await apiFetch<{ user: User }>(`${BASE_URL}/auth/me`, { headers: { 'X-Auth-Token': token }, signal: AbortSignal.timeout(10000) })
  return json.user
}

// ======== MISTAKES ========

function authHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Auth-Token': token }
}

export async function fetchMistakes(token: string): Promise<MistakeRecord[]> {
  const json = await apiFetch<{ mistakes: MistakeRecord[] }>(`${BASE_URL}/mistakes`, { headers: authHeaders(token), signal: AbortSignal.timeout(10000) })
  return json.mistakes
}

export async function recordMistake(token: string, questionId: number, wrongAnswer: string): Promise<void> {
  await apiFetch(`${BASE_URL}/mistakes`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ questionId, wrongAnswer }), signal: AbortSignal.timeout(10000) })
}

export async function reviewMistake(token: string, mistakeId: number): Promise<void> {
  await apiFetch(`${BASE_URL}/mistakes/${mistakeId}/review`, { method: 'PUT', headers: authHeaders(token), signal: AbortSignal.timeout(10000) })
}

export async function deleteMistake(token: string, mistakeId: number): Promise<void> {
  await apiFetch(`${BASE_URL}/mistakes/${mistakeId}`, { method: 'DELETE', headers: authHeaders(token), signal: AbortSignal.timeout(10000) })
}

// ======== PROGRESS ========

export async function recordProgress(token: string, grade: Grade, semester: Semester, questionId: number, correct: boolean): Promise<void> {
  await apiFetch(`${BASE_URL}/progress`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ grade, semester, questionId, correct }), signal: AbortSignal.timeout(10000) })
}

export async function fetchProgress(token: string, grade: Grade, semester: Semester): Promise<ProgressRecord[]> {
  const json = await apiFetch<{ progress: ProgressRecord[] }>(`${BASE_URL}/progress?grade=${grade}&semester=${semester}`, { headers: authHeaders(token), signal: AbortSignal.timeout(10000) })
  return json.progress
}

// ======== STAGE RESULTS ========

export async function saveStageResult(token: string, grade: Grade, semester: Semester, stageIndex: number, score: number, total: number, coins: number): Promise<void> {
  await apiFetch(`${BASE_URL}/progress/stage`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ grade, semester, stageIndex, score, total, coins }), signal: AbortSignal.timeout(10000) })
}

export async function fetchStageResults(token: string, grade: Grade, semester: Semester): Promise<StageResult[]> {
  const json = await apiFetch<{ stages: StageResult[] }>(`${BASE_URL}/progress/stages?grade=${grade}&semester=${semester}`, { headers: authHeaders(token), signal: AbortSignal.timeout(10000) })
  return json.stages
}
