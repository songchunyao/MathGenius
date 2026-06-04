import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Sparkles, ShieldCheck, Shield } from 'lucide-react'
import type { Grade, Semester, QuizConfig } from '../types'
import { MIN_QUESTIONS, MAX_QUESTIONS, DEFAULT_QUESTIONS } from '../config/constants'
import AdminModal from './AdminModal'

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

interface ConfigPanelProps {
  onStart: (config: QuizConfig) => void
  onAdminLogin: (token: string) => void
  errorMessage?: string
  isLoading?: boolean
}

export default function ConfigPanel({ onStart, onAdminLogin, errorMessage, isLoading }: ConfigPanelProps) {
  const [grade, setGrade] = useState<Grade>(5)
  const [semester, setSemester] = useState<Semester>('下册')
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTIONS)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('admin_token') ?? '')

  const isAdmin = !!adminToken
  const busy = isLoading

  const handleStart = () => {
    onStart({ grade, semester, questionCount })
  }

  const handleAdminConfirm = (password: string) => {
    sessionStorage.setItem('admin_token', password)
    setAdminToken(password)
    setAdminModalOpen(false)
    onAdminLogin(password)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">中小学数学智能出题</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">选择练习设置</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">选择年级、学期和题目数量，从题库加载练习题目。</p>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        <div>
          <p className="text-sm font-bold text-slate-700">年级</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                key={g} type="button" onClick={() => setGrade(g)}
                className={`min-w-[44px] rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${
                  grade === g ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                }`}
              >{g}</button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <p className="text-sm font-bold text-slate-700">学期</p>
          <div className="mt-2 flex gap-2">
            {(['上册', '下册'] as const).map((s) => (
              <button
                key={s} type="button" onClick={() => setSemester(s)}
                className={`rounded-2xl border-2 px-5 py-2 text-sm font-bold transition ${
                  semester === s ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">题目数量</p>
            <span className="text-2xl font-black text-sky-900">{questionCount}</span>
          </div>
          <input type="range" min={MIN_QUESTIONS} max={MAX_QUESTIONS} value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))} className="mt-2 w-full" />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{MIN_QUESTIONS}</span><span>{MAX_QUESTIONS}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-bold text-rose-900">提示</p>
              <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <motion.button
        type="button" whileTap={{ scale: 0.98 }}
        disabled={busy} onClick={handleStart}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles className="h-5 w-5" />
        {busy ? '加载中...' : '✨ 开始练习'}
      </motion.button>

      {/* Admin section */}
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {isAdmin ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <Shield className="h-4 w-4 text-slate-400" />}
            <span>{isAdmin ? '管理员已登录' : '管理员'}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  onAdminLogin(adminToken)
                } else {
                  setAdminModalOpen(true)
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              {isAdmin ? '管理后台' : '登录'}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('admin_token')
                  setAdminToken('')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
              >
                退出
              </button>
            )}
          </div>
        </div>
        {!isAdmin && <p className="mt-2 text-xs text-slate-400">登录后可管理题库</p>}
      </div>

      <AdminModal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} onConfirm={handleAdminConfirm} />
    </div>
  )
}
