import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, BookX, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import type { MistakeRecord, Question } from '../types'
import { fetchMistakes, reviewMistake, deleteMistake } from '../api/client'
import MathText from './MathText'

interface MistakeBookProps {
  token: string
  onBack: () => void
}

export default function MistakeBook({ token, onBack }: MistakeBookProps) {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError(null)
    fetchMistakes(token).then(setMistakes).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(load, [token])

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这条错题记录吗？')) return
    try { await deleteMistake(token, id); setMistakes(prev => prev.filter(m => m.id !== id)) }
    catch (e: any) { setError(e.message) }
  }

  const handleReview = async (id: number) => {
    try { await reviewMistake(token, id); setMistakes(prev => prev.map(m => m.id === id ? { ...m, isReviewed: true } : m)) }
    catch (e: any) { setError(e.message) }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 min-h-screen px-4 py-6 sm:px-6">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookX className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-black text-slate-800">错题本</h1>
          </div>
          <button type="button" onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />返回
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-slate-500">加载中...</p>
      ) : mistakes.length === 0 ? (
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-10 text-center shadow-sm">
          <BookX className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-500">暂无错题记录</p>
          <p className="mt-1 text-sm text-slate-400">继续加油！</p>
          <button type="button" onClick={onBack}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            <ArrowLeft className="h-4 w-4" />返回首页
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map(m => (
            <div key={m.id} className={`rounded-[28px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ${m.isReviewed ? 'border-emerald-200 bg-emerald-50/30' : 'border-white/60 bg-white/80'}`}>
              {m.question ? (
                <MistakeCard m={m} q={m.question} onReview={handleReview} onDelete={handleDelete} />
              ) : (
                <p className="text-sm text-slate-500">题目已被删除（{m.wrongAnswer}，{new Date(m.answeredAt).toLocaleString('zh-CN')}）</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MistakeCard({ m, q, onReview, onDelete }: { m: MistakeRecord; q: Question; onReview: (id: number) => void; onDelete: (id: number) => void }) {
  const [reAnswerOpen, setReAnswerOpen] = useState(false)
  const [reAnswerSelected, setReAnswerSelected] = useState<string | null>(null)
  const [reAnswerStatus, setReAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const handleReAnswer = (option: string) => {
    const correct = option === q.answer
    setReAnswerSelected(option)
    setReAnswerStatus(correct ? 'correct' : 'wrong')
    if (correct && !m.isReviewed) {
      onReview(m.id)
    }
  }

  return (<>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-sky-700">{q.category}</p>
        <h3 className="mt-1 text-lg font-black text-slate-800">{q.title}</h3>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-slate-400">{new Date(m.answeredAt).toLocaleString('zh-CN')}</p>
        {m.isReviewed && <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" />已复习</span>}
      </div>
    </div>

    <p className="mt-3 text-sm leading-6 text-slate-700"><MathText as="span">{q.prompt}</MathText></p>

    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {q.options.map(opt => {
        const isCorrect = opt === q.answer
        const isWrong = opt === m.wrongAnswer
        return (<div key={opt} className={`rounded-2xl border-2 px-3 py-2.5 text-sm font-bold ${isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : isWrong ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200 bg-white text-slate-600'}`}>
          <MathText as="span">{opt}</MathText> {isCorrect && <CheckCircle2 className="ml-1 inline h-4 w-4" />}
        </div>)
      })}
    </div>

    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-bold text-slate-900">解析</p>
      <MathText className="mt-1">{q.explanation}</MathText>
    </div>

    {reAnswerOpen ? (
      <div className="mt-4 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-bold text-sky-900">重新作答</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {q.options.map(opt => {
            const isSelected = reAnswerSelected === opt
            const isCorrect = opt === q.answer
            const oc = reAnswerStatus !== 'idle' && isCorrect ? 'border-emerald-400 bg-emerald-50' : reAnswerStatus !== 'idle' && isSelected && !isCorrect ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-sky-300'
            return (<button key={opt} type="button" disabled={reAnswerStatus !== 'idle'} onClick={() => handleReAnswer(opt)}
              className={`rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition ${oc}`}><MathText as="span">{opt}</MathText></button>)
          })}
        </div>
        {reAnswerStatus !== 'idle' && (
          <button type="button" onClick={() => { setReAnswerOpen(false); setReAnswerSelected(null); setReAnswerStatus('idle') }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
            <RotateCcw className="h-3 w-3" />关闭
          </button>
        )}
      </div>
    ) : (
      <button type="button" onClick={() => setReAnswerOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-200">
        <RotateCcw className="h-4 w-4" />重新作答
      </button>
    )}

    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
      {!m.isReviewed && (
        <button type="button" onClick={() => onReview(m.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-200">
          <CheckCircle2 className="h-4 w-4" />标记已复习
        </button>
      )}
      <button type="button" onClick={() => onDelete(m.id)}
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-800 hover:bg-rose-200">
        <Trash2 className="h-4 w-4" />删除
      </button>
    </div>
  </>)
}
