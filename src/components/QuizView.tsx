import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Heart, Zap, ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import type { AdventureState, StageDef } from '../types'
import { calcLevel } from '../types'
import FigureRenderer from './FigureRenderer'
import MathText from './MathText'

interface QuizViewProps {
  stage: StageDef
  adventure: AdventureState
  onAnswer: (option: string) => void
  onFinishStage: () => void
  onReset: () => void
  onBack: () => void
  stageIndex: number
  currentIndex: number
  selectedOption: string | null
  status: 'idle' | 'correct' | 'wrong'
  isStageComplete: boolean
}

export default function QuizView({
  stage, adventure,
  onAnswer, onFinishStage, onReset, onBack,
  stageIndex, currentIndex, selectedOption, status, isStageComplete,
}: QuizViewProps) {
  const questions = stage.questions
  const q = questions[currentIndex]
  const level = calcLevel(adventure.exp)
  const isAnswered = status !== 'idle'
  const total = questions.length

  if (!q) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-slate-500">题目加载中...</p></div>
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">

        {/* HUD */}
        <div className="rounded-[24px] border border-white/50 bg-white/75 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <div>
                <p className="text-xs font-bold text-sky-700">{stage.category}</p>
                <p className="text-xs text-slate-400">{stageIndex + 1}/{questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: adventure.maxHearts }, (_, i) => (
                  <Heart key={i} className={`h-4 w-4 ${i < adventure.hearts ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-amber-600">🪙 {adventure.score * 5}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Lv.{level}</span>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-2 flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full ${i < currentIndex ? 'bg-emerald-400' : i === currentIndex ? 'bg-amber-400' : 'bg-slate-200'}`} />
            ))}
            <span className="text-xs text-slate-500 ml-1">{currentIndex + 1}/{total}</span>
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.10)] sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">第 {currentIndex + 1} 题</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isAnswered ? (status === 'correct' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800') : 'bg-sky-100 text-sky-800'
            }`}>
              {isAnswered ? (status === 'correct' ? '✅ 答对了！' : '❌ 答错了') : '🤔 选答案'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
              <h2 className="text-xl font-black text-slate-800 sm:text-2xl">{q.title}</h2>
              <FigureRenderer svg={q.figure ?? ''} />
              <MathText className="mt-3 text-base leading-7 text-slate-700 sm:text-lg">{q.prompt}</MathText>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {q.options.map((option, oi) => {
                  const isSelected = selectedOption === option
                  const isCorrectOpt = option === q.answer
                  const labels = ['①', '②', '③', '④']
                  const colors = ['border-sky-300 bg-sky-50', 'border-amber-300 bg-amber-50', 'border-emerald-300 bg-emerald-50', 'border-purple-300 bg-purple-50']
                  const oc = isAnswered && isCorrectOpt ? 'ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50' :
                    isAnswered && isSelected && !isCorrectOpt ? 'ring-2 ring-rose-400 border-rose-400 bg-rose-50' :
                    `${colors[oi]} hover:shadow-md`
                  return (
                    <motion.button key={option} type="button" whileTap={{ scale: 0.97 }}
                      onClick={() => onAnswer(option)}
                      className={`relative rounded-2xl border-2 px-4 py-4 text-left text-base font-bold shadow-sm transition ${oc} ${!isAnswered ? 'hover:-translate-y-0.5' : ''}`}
                    >
                      <span className="flex items-start gap-3">
                        <span className="shrink-0 text-lg">{labels[oi]}</span>
                        <MathText as="span" className="flex-1">{option}</MathText>
                        {isAnswered && isCorrectOpt && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              {isAnswered && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 ${status === 'correct' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                  <p className="text-sm font-bold text-slate-700">📖 解析</p>
                  <MathText className="mt-1 text-sm text-slate-700">{q.explanation}</MathText>
                  {status === 'correct' && adventure.combo >= 2 && (
                    <p className="mt-2 text-xs font-bold text-amber-700"><Zap className="h-3 w-3 inline" /> {adventure.combo}连击！</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isAnswered && isStageComplete && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onFinishStage}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg">
                查看本关结果 <ArrowRight className="h-4 w-4" />
              </motion.button>
            )}
            {isAnswered && !isStageComplete && (
              <button type="button" onClick={onFinishStage}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                下一题 <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
              <RotateCcw className="h-4 w-4" />重来
            </button>
            <button type="button" onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
              <Sparkles className="h-4 w-4" />返回地图
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-2xl bg-amber-50 px-3 py-2"><span className="font-bold text-amber-800">连击</span><br /><span className="font-black text-lg">{adventure.combo}x</span></div>
          <div className="rounded-2xl bg-sky-50 px-3 py-2"><span className="font-bold text-sky-800">得分</span><br /><span className="font-black text-lg">{adventure.score}/{total}</span></div>
          <div className="rounded-2xl bg-purple-50 px-3 py-2"><span className="font-bold text-purple-800">最佳连击</span><br /><span className="font-black text-lg">{adventure.bestCombo}x</span></div>
        </div>
      </div>
    </div>
  )
}
