import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { Grade, Semester } from '../types'
import { calcStars } from '../types'

interface CompletionScreenProps {
  config: { grade: Grade; semester: Semester }
  totalScore: number
  totalQuestions: number
  totalCoins: number
  bestCombo: number
  mistakeCount: number
  onRetry: () => void
  onBack: () => void
}

export default function CompletionScreen({ config, totalScore, totalQuestions, totalCoins, bestCombo, mistakeCount, onRetry, onBack }: CompletionScreenProps) {
  const stars = calcStars(totalScore, totalQuestions)
  const rate = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0

  const starEmojis = stars >= 1 ? '⭐' : ''
  const starEmojis2 = stars >= 2 ? '⭐' : ''
  const starEmojis3 = stars >= 3 ? '⭐' : ''

  const encouragement = stars === 3 ? '完美的表现！你是数学小天才！🌟' :
    stars === 2 ? '很棒的成绩！继续加油！💪' :
    stars === 1 ? '还不错，多练习会更好！📚' :
    '继续努力，下次会更好！🌈'

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 min-h-[80vh] justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] text-center"
      >
        <div className="text-5xl mb-2">🎉</div>
        <h1 className="mt-3 text-3xl font-black text-slate-800">全部通关！</h1>
        <p className="mt-1 text-sm text-slate-500">{config.grade}年级{config.semester}</p>

        <div className="mt-5 text-4xl">
          <span className="inline-block">{starEmojis}</span>
          <span className="inline-block mx-1">{starEmojis2}</span>
          <span className="inline-block">{starEmojis3}</span>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-amber-50 px-2 py-2">
            <p className="text-lg font-black text-amber-800">{totalScore}/{totalQuestions}</p>
            <p className="text-xs font-bold text-amber-600">答对</p>
          </div>
          <div className="rounded-xl bg-sky-50 px-2 py-2">
            <p className="text-lg font-black text-sky-800">{rate}%</p>
            <p className="text-xs font-bold text-sky-600">正确率</p>
          </div>
          <div className="rounded-xl bg-amber-100 px-2 py-2">
            <p className="text-lg font-black text-amber-800">🪙{totalCoins}</p>
            <p className="text-xs font-bold text-amber-600">金币</p>
          </div>
          <div className="rounded-xl bg-purple-50 px-2 py-2">
            <p className="text-lg font-black text-purple-800">x{bestCombo}</p>
            <p className="text-xs font-bold text-purple-600">最佳连击</p>
          </div>
        </div>

        <p className="mt-5 text-base font-bold text-slate-700">{encouragement}</p>

        {mistakeCount > 0 && (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-left">
            <p className="text-sm font-bold text-rose-800">📝 错题 {mistakeCount} 道</p>
            <p className="mt-1 text-xs text-rose-600">可在错题本中查看详情</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <motion.button whileTap={{ scale: 0.98 }} onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white">
            <RotateCcw className="h-4 w-4" />再来一次
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700">
            <ArrowLeft className="h-4 w-4" />返回首页
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
