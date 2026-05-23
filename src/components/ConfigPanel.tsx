import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react'
import type { Grade, Semester, AIProvider, QuizConfig } from '../types'
import { API_PROVIDERS, MIN_QUESTIONS, MAX_QUESTIONS, DEFAULT_QUESTIONS } from '../config/constants'
import { loadConfig } from '../utils/storage'

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

interface ConfigPanelProps {
  onStart: (config: QuizConfig) => void
  errorMessage?: string
  isLoading?: boolean
}

export default function ConfigPanel({ onStart, errorMessage, isLoading }: ConfigPanelProps) {
  const saved = loadConfig()

  const [grade, setGrade] = useState<Grade>(saved.grade ?? 5)
  const [semester, setSemester] = useState<Semester>(saved.semester ?? '下册')
  const [questionCount, setQuestionCount] = useState(saved.questionCount ?? DEFAULT_QUESTIONS)
  const [provider, setProvider] = useState<AIProvider>(saved.provider ?? 'deepseek')
  const [model, setModel] = useState(saved.model ?? API_PROVIDERS[saved.provider ?? 'deepseek'].defaultModel)
  const [apiKey, setApiKey] = useState(saved.apiKey ?? '')
  const [showKey, setShowKey] = useState(false)

  const providerInfo = API_PROVIDERS[provider]

  useEffect(() => {
    setModel(providerInfo.defaultModel)
  }, [provider, providerInfo.defaultModel])

  const handleStart = useCallback(() => {
    if (!apiKey.trim()) return
    onStart({ grade, semester, questionCount, provider, model, apiKey: apiKey.trim() })
  }, [grade, semester, questionCount, provider, model, apiKey, onStart])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">小学数学智能出题</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">选择年级和题目设置</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          选择年级、学期和题目数量，AI 将自动为你生成一套个性化练习。
        </p>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        {/* Grade */}
        <div>
          <p className="text-sm font-bold text-slate-700">年级</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`min-w-[44px] rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${
                  grade === g
                    ? 'border-sky-400 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Semester */}
        <div className="mt-5">
          <p className="text-sm font-bold text-slate-700">学期</p>
          <div className="mt-2 flex gap-2">
            {(['上册', '下册'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSemester(s)}
                className={`rounded-2xl border-2 px-5 py-2 text-sm font-bold transition ${
                  semester === s
                    ? 'border-sky-400 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">题目数量</p>
            <span className="text-2xl font-black text-sky-900">{questionCount}</span>
          </div>
          <input
            type="range"
            min={MIN_QUESTIONS}
            max={MAX_QUESTIONS}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{MIN_QUESTIONS}</span>
            <span>{MAX_QUESTIONS}</span>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        {/* AI Provider */}
        <div>
          <p className="text-sm font-bold text-slate-700">AI 提供商</p>
          <div className="mt-2 flex gap-2">
            {(['deepseek', 'glm'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`rounded-2xl border-2 px-4 py-2 text-sm font-bold transition ${
                  provider === p
                    ? 'border-sky-400 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                }`}
              >
                {API_PROVIDERS[p].name}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="mt-4">
          <p className="text-sm font-bold text-slate-700">模型</p>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-sky-300"
          >
            {providerInfo.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div className="mt-4">
          <p className="text-sm font-bold text-slate-700">API 密钥</p>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 API Key"
                className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-300"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">密钥仅保存在你本地浏览器中，不会上传到其他服务器</p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-bold text-rose-900">出题失败</p>
              <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        disabled={!apiKey.trim() || isLoading}
        onClick={handleStart}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles className="h-5 w-5" />
        {isLoading ? '正在生成...' : apiKey.trim() ? '✨ 开始生成题目' : '请先输入 API 密钥'}
      </motion.button>
    </div>
  )
}
