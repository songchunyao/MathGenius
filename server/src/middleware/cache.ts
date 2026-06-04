import type { Question } from '../types.js'

interface CacheEntry {
  questions: Question[]
  cachedAt: number
}

const cache = new Map<string, CacheEntry>()

function makeKey(grade: number, semester: string): string {
  return `${grade}-${semester}`
}

export function getCache(grade: number, semester: string): Question[] | null {
  const entry = cache.get(makeKey(grade, semester))
  if (!entry) return null
  return entry.questions
}

export function setCache(grade: number, semester: string, questions: Question[]): void {
  cache.set(makeKey(grade, semester), { questions, cachedAt: Date.now() })
}

export function invalidateCache(grade: number, semester: string): void {
  cache.delete(makeKey(grade, semester))
}

export function clearCache(): void {
  cache.clear()
}

export function getCacheSize(): number {
  return cache.size
}
