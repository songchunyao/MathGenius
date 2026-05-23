import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Question, QuizConfig, QuizPhase, LoadingStatus } from './types'
import { questions as staticQuestions } from './data/questions'
import { generateQuestions } from './api/provider'
import { saveConfig, loadConfig } from './utils/storage'
import { DEFAULT_QUESTIONS } from './config/constants'
import ConfigPanel from './components/ConfigPanel'
import LoadingView from './components/LoadingView'

const progressColor = ['from-amber-300 to-orange-400', 'from-sky-300 to-cyan-400', 'from-emerald-300 to-lime-400']

const defaultConfig: QuizConfig = {
  grade: 5,
  semester: '下册',
  questionCount: DEFAULT_QUESTIONS,
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKey: '',
}

function App() {
  const saved = loadConfig()
  const [phase, setPhase] = useState<QuizPhase>('config')
  const [config, setConfig] = useState<QuizConfig>({ ...defaultConfig, ...saved })
  const [questions, setQuestions] = useState<Question[]>(staticQuestions)
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({ type: 'loading' })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [mistakes, setMistakes] = useState<string[]>([])

  // Quiz derived values (must be before early returns for hooks consistency)
  const progress = useMemo(() => {
    if (!questions.length) return 0
    return Math.round(((currentIndex + (status !== 'idle' ? 1 : 0)) / questions.length) * 100)
  }, [currentIndex, status, questions.length])

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const isFinished = isLastQuestion && status !== 'idle' && questions.length > 0
  const levelClass = progress < 25 ? progressColor[0] : progress < 75 ? progressColor[1] : progressColor[2]

  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.category))
    return Array.from(set)
  }, [questions])

  const handleAnswer = (option: string) => {
    if (status !== 'idle' || !currentQuestion) return

    const isCorrect = option === currentQuestion.answer
    setSelectedOption(option)
    setStatus(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      setScore((prev) => prev + 1)
      setCombo((prev) => {
        const next = prev + 1
        setBestCombo((best) => Math.max(best, next))
        return next
      })
    } else {
      setCombo(0)
      setMistakes((prev) => [...prev, currentQuestion.prompt])
    }
  }

  const handleNext = () => {
    if (isLastQuestion) return
    setCurrentIndex((prev) => prev + 1)
    setSelectedOption(null)
    setStatus('idle')
  }

  const resetQuizState = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setStatus('idle')
    setScore(0)
    setCombo(0)
    setBestCombo(0)
    setMistakes([])
  }

  const handleStart = async (newConfig: QuizConfig) => {
    setErrorMessage(null)
    setConfig(newConfig)
    saveConfig(newConfig)
    setPhase('loading')
    setLoadingStatus({ type: 'loading' })

    try {
      const result = await generateQuestions(newConfig)
      console.log(`成功生成 ${result.length} 道题目`)
      setQuestions(result)
      setPhase('quiz')
      resetQuizState()
    } catch (err) {
      console.error('生成题目失败:', err)
      const message = err instanceof Error ? err.message : '生成失败，请检查 API 密钥和网络连接后重试'
      setErrorMessage(message)
      setPhase('config')
    }
  }

  const handleRetry = () => {
    handleStart(config)
  }

  const handleBackToConfig = () => {
    setPhase('config')
  }

  // -------- Render by phase --------
  if (phase === 'config') {
    return <ConfigPanel onStart={handleStart} errorMessage={errorMessage ?? undefined} />
  }

  if (phase === 'loading') {
    return (
      <LoadingView
        status={loadingStatus}
        config={config}
        onRetry={handleRetry}
        onBack={handleBackToConfig}
      />
    )
  }

  // -------- Quiz View --------
  if (!questions.length || !currentQuestion) {
    return <ConfigPanel onStart={handleStart} errorMessage="没有可用的题目数据，请重新生成" />
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                {config.grade} 年级 {config.semester} · 数学练习
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-800 sm:text-4xl">像玩游戏一样练数学</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                共 {questions.length} 道题，涵盖 {categories.length} 个知识点。卡片式答题和即时反馈帮助你快速进步。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-amber-100 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-amber-800">得分</p>
                <p className="mt-1 text-2xl font-black text-amber-900">{score}</p>
              </div>
              <div className="rounded-2xl bg-sky-100 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-sky-800">当前连击</p>
                <p className="mt-1 text-2xl font-black text-sky-900">x{combo}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-emerald-800">最佳连击</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">x{bestCombo}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>完成进度</span>
              <span>{progress}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${levelClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <motion.section
            layout
            className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sky-700">第 {currentIndex + 1} / {questions.length} 题</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  <Star className="h-4 w-4 text-amber-400" />
                  {currentQuestion.category}
                </div>
              </div>
              <div className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">
                {status === 'correct' ? '太棒了！' : status === 'wrong' ? '再试一次' : '准备开始'}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="mt-5 rounded-[28px] bg-gradient-to-br from-amber-100 via-sky-50 to-emerald-100 p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">题目</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-800 sm:text-3xl">{currentQuestion.title}</h2>
                  </div>
                  <div className="rounded-2xl bg-white/90 px-3 py-2 text-center shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">提示</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{currentQuestion.tip || '仔细读题'}</p>
                  </div>
                </div>

                <p className="mt-5 text-lg leading-8 text-slate-700 sm:text-xl">{currentQuestion.prompt}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOption === option
                    const isCorrectOpt = option === currentQuestion.answer
                    const optionClass =
                      status === 'correct' && isCorrectOpt
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : status === 'wrong' && isSelected
                          ? 'border-rose-400 bg-rose-50 text-rose-900'
                          : 'border-slate-200 bg-white text-slate-700'

                    return (
                      <motion.button
                        key={option}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(option)}
                        className={`rounded-[24px] border-2 px-4 py-4 text-left text-base font-bold shadow-sm transition ${optionClass} ${status === 'idle' ? 'hover:-translate-y-0.5 hover:border-sky-300' : ''}`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{option}</span>
                          {status === 'correct' && isCorrectOpt && <CheckCircle2 className="h-5 w-5" />}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>

                {status !== 'idle' && (
                  <div className={`mt-5 rounded-[24px] border px-4 py-4 ${status === 'correct' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                    <p className="text-sm font-semibold text-slate-700">解析</p>
                    <p className="mt-2 text-base text-slate-800">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {status !== 'idle' && !isLastQuestion && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                    >
                      下一题
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  )}

                  <button
                    type="button"
                    onClick={resetQuizState}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    重新开始
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToConfig}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    重新选题
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-800">阶段激励</h3>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-amber-50 px-4 py-3">
                  <p className="font-bold text-amber-900">25% 达标</p>
                  <p className="mt-1">大家一起打卡，连对几题都能更有成就感。</p>
                </div>
                <div className="rounded-2xl bg-sky-50 px-4 py-3">
                  <p className="font-bold text-sky-900">50% 挑战</p>
                  <p className="mt-1">继续保持专注，正确率会越来越高。</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                  <p className="font-bold text-emerald-900">75% 冲刺</p>
                  <p className="mt-1">最后几题也不要放松，准备好收获奖励吧。</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-2">
                <BookOpenText className="h-5 w-5 text-sky-500" />
                <h3 className="text-lg font-black text-slate-800">本次练习</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {config.grade} 年级 {config.semester}，共 {questions.length} 道题，由 AI 自动生成。
              </p>
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-bold text-slate-900">覆盖知识点</p>
                <ul className="mt-2 space-y-1">
                  {categories.map((cat) => (
                    <li key={cat}>• {cat}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-black text-slate-800">下步准备</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• 完整的答对/答错反馈动效</li>
                <li>• 连击与阶段性撒花</li>
                <li>• 结算页与错题本查看</li>
              </ul>
            </div>
          </aside>
        </div>

        {isFinished && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-950">测试完成</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">你已经完成了本轮练习</h3>
                <p className="mt-2 text-sm text-slate-700">
                  本轮得分 {score} / {questions.length}，错题 {mistakes.length} 个。继续挑战，下一关会更有趣！
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 font-bold text-slate-900">
                <Trophy className="h-5 w-5 text-amber-500" />
                继续加油
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </main>
  )
}

export default App
