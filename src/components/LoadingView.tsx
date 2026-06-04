import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import type { LoadingStatus, QuizConfig } from '../types'

interface LoadingViewProps {
  status: LoadingStatus
  config: QuizConfig
  onRetry?: () => void
  onBack: () => void
}

export default function LoadingView({ status, config, onRetry, onBack }: LoadingViewProps) {
  if (status.type === 'error') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 min-h-[60vh]">
        <div className="w-full rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-4 text-xl font-black text-rose-900">出题失败</h2>
          <p className="mt-2 text-sm text-rose-700">{status.message ?? '发生了未知错误，请重试'}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                重试
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              返回设置
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <LoadingProgress config={config} message={status.message} onBack={onBack} />
}

function LoadingProgress({
  config,
  message,
  onBack,
}: {
  config: QuizConfig
  message?: string
  onBack: () => void
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000)
    }, 200)
    return () => clearInterval(timer)
  }, [])

  const pct = Math.min(Math.round(95 * (1 - Math.exp(-elapsed / 22))), 95)

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 min-h-[60vh]">
      <div className="w-full rounded-[28px] border border-white/60 bg-white/80 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        {/* Animated math symbols */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
            {['+', '−', '×', '÷'].map((symbol, i) => (
              <span
                key={symbol}
                className="absolute text-2xl font-black text-sky-600"
                style={{
                  top: `${50 - 40 * Math.cos((i * 90 * Math.PI) / 180)}%`,
                  left: `${50 + 40 * Math.sin((i * 90 * Math.PI) / 180)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {symbol}
              </span>
            ))}
          </div>
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite_reverse]">
            {['∑', 'π', '√', '∫'].map((symbol, i) => (
              <span
                key={symbol}
                className="absolute text-lg font-black text-amber-500"
                style={{
                  top: `${50 - 28 * Math.cos(((i * 90 + 45) * Math.PI) / 180)}%`,
                  left: `${50 + 28 * Math.sin(((i * 90 + 45) * Math.PI) / 180)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>

        <h2 className="mt-6 text-xl font-black text-slate-800">
          {message || '正在加载题目...'}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          {config.grade} 年级 {config.semester} · {config.questionCount} 道题目
        </p>

        {/* Animated progress bar */}
        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(pct, 3)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{pct}%</span>
            <span>
              {elapsed < 10 ? '正在准备...' : '即将完成...'}
            </span>
            <span>{elapsed.toFixed(0)}s</span>
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-500">
          {elapsed < 10 ? '正在连接服务器...' : '服务器处理中，请耐心等待...'}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          取消
        </button>
      </div>
    </div>
  )
}
