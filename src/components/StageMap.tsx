import { motion } from 'framer-motion'
import { Sparkles, MapPin, Play } from 'lucide-react'
import type { Grade, Semester, StageResult, StageDef } from '../types'

interface StageMapProps {
  stages: StageDef[]
  stageResults: StageResult[]
  grade: Grade
  semester: Semester
  onStartStage: (stageIndex: number) => void
}

const ICONS = ['🏁', '🌲', '🏰', '👑', '⚔️', '🛡️', '🌟', '🔥', '💎', '🎉', '🌈', '⚡']

export default function StageMap({ stages, stageResults, grade, semester, onStartStage }: StageMapProps) {
  const resultMap = new Map(stageResults.map(s => [s.stageIndex, s]))

  const stageTotal = (i: number) => stages[i]?.questions.length ?? 0

  const completedCount = stages.filter(stage => {
    const r = resultMap.get(stage.stageIndex)
    return r && r.score >= stage.questions.length
  }).length

  const nextStage = (() => {
    for (let i = 0; i < stages.length; i++) {
      if (i > 0) {
        const prev = resultMap.get(i - 1)
        if (!prev || prev.score < stageTotal(i - 1)) continue
      }
      const s = resultMap.get(i)
      if (!s || s.score < stageTotal(i)) return i
    }
    return -1
  })()

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6 text-center">
        <MapPin className="mx-auto h-8 w-8 text-amber-500" />
        <h1 className="mt-2 text-2xl font-black text-slate-800 sm:text-3xl">🗺️ 闯关地图</h1>
        <p className="mt-1 text-sm text-slate-500">{grade} 年级 {semester} · {stages.length} 个知识点</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-sky-50 border border-sky-200 px-3 py-3">
          <p className="text-lg font-black text-sky-800">{completedCount}/{stages.length}</p>
          <p className="text-xs font-semibold text-sky-600">已通关</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-3">
          <p className="text-lg font-black text-emerald-800">{stageResults.reduce((s, r) => s + r.score, 0)}</p>
          <p className="text-xs font-semibold text-emerald-600">答对</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-3 py-3">
          <p className="text-lg font-black text-amber-800">{stageResults.reduce((s, r) => s + r.coins, 0)}</p>
          <p className="text-xs font-semibold text-amber-600">🪙 金币</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stages.map((stage, i) => {
          const result = resultMap.get(i)
          const total = stage.questions.length
          const isCompleted = result && result.score >= total
          const isFailed = result && result.score < total
          const prevResult = resultMap.get(i - 1)
          const isUnlocked = i === 0 || (prevResult && prevResult.score >= stageTotal(i - 1))
          const isNext = i === nextStage && !result
          const canPlay = isUnlocked

          return (
            <motion.button
              key={i}
              whileTap={canPlay ? { scale: 0.95 } : {}}
              onClick={canPlay ? () => onStartStage(i) : undefined}
              disabled={!canPlay}
              className={`rounded-[24px] border-2 p-4 text-left shadow-sm transition hover:shadow-md ${
                isCompleted ? 'border-emerald-400 bg-emerald-50' :
                isFailed ? 'border-rose-300 bg-rose-50' :
                isNext ? 'border-amber-400 bg-amber-50 animate-pulse' :
                !isUnlocked ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed' :
                'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{isUnlocked ? ICONS[i % ICONS.length] : '🔒'}</span>
                {canPlay && <Play className="h-5 w-5 text-sky-500" />}
              </div>
              <p className="mt-2 text-sm font-bold text-slate-800">{stage.category}</p>
              <p className="text-xs text-slate-500">{stage.questions.length} 题</p>
              {result && (
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                  {isCompleted ? <span className="text-emerald-700">✅ {result.score}/{total}</span> : <span className="text-rose-700">❌ {result.score}/{total}</span>}
                  <span className="text-amber-700">🪙 {result.coins}</span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {nextStage >= 0 && (
        <motion.button
          type="button" whileTap={{ scale: 0.97 }}
          onClick={() => onStartStage(nextStage)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg"
        >
          <Sparkles className="h-6 w-6" />
          {completedCount > 0 ? '继续闯关' : '开始闯关'}
        </motion.button>
      )}
    </div>
  )
}
