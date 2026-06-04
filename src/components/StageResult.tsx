import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import Confetti from 'react-confetti'

interface StageResultProps {
  stageIndex: number
  category: string
  score: number
  total: number
  coins: number
  onNextStage: () => void
  onRetry: () => void
  onBack: () => void
}

function playSound(success: boolean) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.6 : 0.5))

    if (success) {
      // 欢快上行音
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)       // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3)  // G5
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } else {
      // 下行失败音
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(392, ctx.currentTime)         // G4
      osc.frequency.linearRampToValueAtTime(196, ctx.currentTime + 0.4) // G3
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    }
  } catch {
    // 浏览器不支持 AudioContext 时静默忽略
  }
}

export default function StageResult({ stageIndex, category, score, total, coins, onNextStage, onRetry, onBack }: StageResultProps) {
  const allCorrect = score === total

  useEffect(() => {
    playSound(allCorrect)
  }, [allCorrect])

  return (
    <>
      {allCorrect && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-4 w-full max-w-sm rounded-[28px] bg-white/95 border border-white/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)] text-center"
        >
          <div className="text-6xl mb-2">{allCorrect ? '🎉' : '😢'}</div>
          <h2 className="text-lg font-bold text-slate-500">{category}</h2>
          <h3 className="text-2xl font-black text-slate-800">第 {stageIndex + 1} 关 {allCorrect ? '闯关成功' : '闯关失败'}</h3>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-sky-50 px-3 py-3">
              <p className="text-2xl font-black text-sky-800">{score}/{total}</p>
              <p className="text-xs font-bold text-sky-600">答对</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-3">
              <p className="text-2xl font-black text-amber-800">🪙 {coins}</p>
              <p className="text-xs font-bold text-amber-600">金币</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-3">
              <p className="text-2xl font-black text-emerald-800">{Math.round(score / total * 100)}%</p>
              <p className="text-xs font-bold text-emerald-600">正确率</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {allCorrect ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onNextStage}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-base font-bold text-white shadow-lg">
                下一关 <ArrowRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3.5 text-base font-bold text-white shadow-lg">
                <RotateCcw className="h-5 w-5" /> 重新挑战
              </motion.button>
            )}
            {allCorrect && (
              <button type="button" onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700">
                <RotateCcw className="h-4 w-4" />重玩本关
              </button>
            )}
            <button type="button" onClick={onBack}
              className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <Sparkles className="h-4 w-4" />返回地图
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
