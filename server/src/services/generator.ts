import type { Question, Grade, Semester, Difficulty, AIProvider } from '../types.js'
import { config } from '../config.js'
import { buildSystemPrompt, buildUserMessage } from './promptBuilder.js'

export const BATCH_SIZE = 5
const API_TIMEOUT_MS = 60_000

interface ProviderInfo {
  name: string
  endpoint: string
  defaultModel: string
}

const API_PROVIDERS: Record<AIProvider, ProviderInfo> = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-v4-pro',
  },
  glm: {
    name: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-5.1',
  },
}

function getApiKey(): string {
  if (config.aiProvider === 'glm') return config.glmApiKey
  return config.deepseekApiKey
}

function tryParseJSON(raw: string): unknown {
  // Attempt 1: direct parse
  try {
    return JSON.parse(raw)
  } catch {
    // continue
  }

  // Attempt 2: strip markdown code fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // continue
  }

  // Attempt 3: extract content between first [ and last ]
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0])
    } catch {
      // continue
    }
  }

  // Attempt 4: extract content between first { and last }
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch {
      // continue
    }
  }

  throw new Error(`AI 返回的数据格式不正确，无法解析为 JSON。原始内容：${raw.slice(0, 300)}`)
}

function parseJSONResponse(raw: string): unknown[] {
  const parsed = tryParseJSON(raw)

  let questions: unknown
  if (Array.isArray(parsed)) {
    questions = parsed
  } else if (typeof parsed === 'object' && parsed !== null && 'questions' in parsed) {
    questions = (parsed as Record<string, unknown>).questions
  } else {
    throw new Error('AI 返回的数据结构不正确，缺少题目数组')
  }

  if (!Array.isArray(questions)) {
    throw new Error('题目数据必须是一个数组')
  }

  return questions
}

function validateQuestions(rawQuestions: unknown[], difficulty?: Difficulty): Omit<Question, 'id'>[] {
  const requiredStringFields = ['category', 'title', 'prompt', 'answer', 'explanation'] as const
  const valid: Omit<Question, 'id'>[] = []

  for (const raw of rawQuestions) {
    if (typeof raw !== 'object' || raw === null) continue
    const q = raw as Record<string, unknown>

    const missingField = requiredStringFields.find(
      field => typeof q[field] !== 'string' || (q[field] as string).trim() === '',
    )
    if (missingField) continue

    if (!Array.isArray(q.options) || q.options.length !== 4) continue
    if (!q.options.every(o => typeof o === 'string')) continue

    // Fix: AI often returns "A"/"B"/"C"/"D" as answer, map to actual option value
    let answer = q.answer as string
    if (!q.options.includes(answer)) {
      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(answer.toUpperCase())
      if (letterIndex >= 0 && letterIndex < q.options.length) {
        answer = q.options[letterIndex]
      }
    }
    // Still doesn't match → skip this question
    if (!(q.options as string[]).includes(answer)) continue

    valid.push({
      category: q.category as string,
      title: q.title as string,
      prompt: q.prompt as string,
      options: q.options as string[],
      answer,
      explanation: q.explanation as string,
      tip: (q.tip as string) ?? '',
      figure: typeof q.figure === 'string' && q.figure.trim() ? q.figure.trim() : '',
      difficulty: typeof q.difficulty === 'string' && ['easy', 'medium', 'hard'].includes(q.difficulty)
        ? (q.difficulty as Difficulty)
        : (difficulty ?? 'medium'),
    })
  }

  return valid
}

function parseAPIError(status: number, body: string): string {
  if (status === 401) return 'API 密钥无效，请检查后重试'
  if (status === 429) return '请求过于频繁，请稍后再试'
  if (status >= 500) return 'AI 服务暂时不可用，请稍后再试'

  try {
    const parsed = JSON.parse(body)
    if (parsed.error?.message) return `API 错误: ${parsed.error.message}`
  } catch {
    // ignore
  }
  return `请求失败 (HTTP ${status})`
}

async function makeBatchRequest(
  grade: Grade,
  semester: Semester,
  batchSize: number,
  signal?: AbortSignal,
  difficulty?: Difficulty,
  units?: string[],
): Promise<Omit<Question, 'id'>[]> {
  const provider = API_PROVIDERS[config.aiProvider as AIProvider]
  if (!provider) throw new Error(`未知的 AI 提供商: ${config.aiProvider}`)

  const systemPrompt = buildSystemPrompt(grade, semester, batchSize, difficulty)
  const userMessage = buildUserMessage(grade, semester, batchSize, difficulty, units)
  const apiKey = getApiKey()

  const requestBody = {
    model: provider.defaultModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  const combinedSignal = signal
    ? combineSignals(signal, controller.signal)
    : controller.signal

  let response: Response
  try {
    response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: combinedSignal,
    })
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接后重试')
    }
    throw new Error('网络请求失败，请检查网络连接')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(parseAPIError(response.status, errorBody))
  }

  const data = await response.json() as { choices: Array<{ message: { content: string }; finish_reason?: string }> }
  const choice = data.choices?.[0]
  const rawContent = choice?.message?.content
  if (!rawContent) throw new Error('API 返回内容为空')

  if (choice.finish_reason === 'length') {
    console.warn('AI 返回内容被截断，可能无法生成全部题目')
  }

  const parsed = parseJSONResponse(rawContent)
  const validated = validateQuestions(parsed, difficulty)

  if (validated.length === 0) {
    throw new Error('生成的题目不符合要求，请重试')
  }

  return validated
}

export async function generateQuestions(
  grade: Grade,
  semester: Semester,
  count: number,
  difficulty?: Difficulty,
  units?: string[],
): Promise<Question[]> {
  const totalBatches = Math.ceil(count / BATCH_SIZE)

  const batchConfigs = Array.from({ length: totalBatches }, (_, i) => ({
    index: i,
    batchCount: Math.min(BATCH_SIZE, count - i * BATCH_SIZE),
  }))

  // Fire all batches concurrently
  const results = await Promise.allSettled(
    batchConfigs.map(b =>
      makeBatchRequest(grade, semester, b.batchCount, undefined, difficulty, units)
        .then(qs => ({ index: b.index, questions: qs }))
    ),
  )

  // Collect successful batches, sorted by index
  const fulfilled = results
    .filter((r): r is PromiseFulfilledResult<{ index: number; questions: Omit<Question, 'id'>[] }> =>
      r.status === 'fulfilled',
    )
    .sort((a, b) => a.value.index - b.value.index)

  // If no batch succeeded, throw the first error
  if (fulfilled.length === 0) {
    const firstError = (results.find(r => r.status === 'rejected') as PromiseRejectedResult).reason
    throw firstError
  }

  // Assign sequential IDs
  const allQuestions: Question[] = []
  let idCounter = 0

  for (const { value: { questions } } of fulfilled) {
    const withIds = questions.map(q => ({ ...q, id: ++idCounter }))
    allQuestions.push(...withIds)
  }

  // Log partial failures as warnings
  const rejected = results.filter(r => r.status === 'rejected')
  for (const r of rejected) {
    console.warn('部分批次请求失败:', (r as PromiseRejectedResult).reason)
  }

  return allQuestions
}

function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}
