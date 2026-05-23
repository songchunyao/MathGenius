import type { Question, QuizConfig } from '../types'
import { API_PROVIDERS, API_TIMEOUT_MS } from '../config/constants'
import { buildSystemPrompt, buildUserMessage } from '../prompts/templates'

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

  // Handle both { questions: [...] } and direct array
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

function validateQuestions(rawQuestions: unknown[]): Omit<Question, 'id'>[] {
  const requiredStringFields = ['category', 'title', 'prompt', 'answer', 'explanation'] as const
  const valid: Omit<Question, 'id'>[] = []

  for (const raw of rawQuestions) {
    if (typeof raw !== 'object' || raw === null) continue
    const q = raw as Record<string, unknown>

    // Check all required string fields (tip is optional)
    const missingField = requiredStringFields.find(
      field => typeof q[field] !== 'string' || (q[field] as string).trim() === '',
    )
    if (missingField) continue

    if (!Array.isArray(q.options) || q.options.length !== 4) continue
    if (!q.options.every(o => typeof o === 'string')) continue
    if (!(q.options as string[]).includes(q.answer as string)) continue

    valid.push({
      category: q.category as string,
      title: q.title as string,
      prompt: q.prompt as string,
      options: q.options as string[],
      answer: q.answer as string,
      explanation: q.explanation as string,
      tip: (q.tip as string) ?? '',
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

export async function generateQuestions(
  config: QuizConfig,
  signal?: AbortSignal,
): Promise<Question[]> {
  const provider = API_PROVIDERS[config.provider]
  if (!provider) throw new Error(`未知的 AI 提供商: ${config.provider}`)

  const systemPrompt = buildSystemPrompt(config.grade, config.semester, config.questionCount)
  const userMessage = buildUserMessage(config.grade, config.semester, config.questionCount)

  const requestBody = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 16384,
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
        Authorization: `Bearer ${config.apiKey}`,
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

  // Detect truncation
  if (choice.finish_reason === 'length') {
    console.warn('AI 返回内容被截断，可能无法生成全部题目。请尝试减少题目数量。')
  }

  const parsed = parseJSONResponse(rawContent)
  const validated = validateQuestions(parsed)

  if (validated.length === 0) {
    throw new Error('生成的题目不符合要求，请重试')
  }

  // Assign sequential IDs
  return validated.map((q, i) => ({ ...q, id: i + 1 }))
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
