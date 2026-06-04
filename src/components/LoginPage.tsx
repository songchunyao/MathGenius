import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, BookText } from 'lucide-react'
import type { Grade, Semester, QuizConfig, Difficulty } from '../types'

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; desc: string }[] = [
  { key: 'easy', label: '😊 基础', desc: '基础概念和简单计算' },
  { key: 'medium', label: '🤔 中等', desc: '综合应用和常见题型' },
  { key: 'hard', label: '😈 较难', desc: '灵活运用和易错陷阱' },
]

const GRADE_KNOWLEDGE: Record<string, string[]> = {
  '1-上册': ['数一数', '比一比', '1~5的认识和加减法', '认识图形（一）', '6~10的认识和加减法', '11~20各数的认识', '认识钟表', '20以内的进位加法'],
  '1-下册': ['认识图形（二）', '20以内的退位减法', '100以内数的认识', '认识人民币', '100以内的加法和减法（一）', '找规律'],
  '2-上册': ['长度单位', '100以内的加法和减法（二）', '角的初步认识', '表内乘法（一）', '观察物体（一）', '表内乘法（二）', '认识时间', '数学广角——搭配（一）'],
  '2-下册': ['数据收集整理', '表内除法（一）', '图形的运动（一）', '混合运算', '有余数的除法', '万以内数的认识', '克和千克', '数学广角——推理'],
  '3-上册': ['时、分、秒', '万以内的加法和减法（一）', '测量', '倍的认识', '多位数乘一位数', '长方形和正方形', '分数的初步认识', '数学广角——集合'],
  '3-下册': ['位置与方向（一）', '除数是一位数的除法', '复式统计表', '两位数乘两位数', '面积', '年、月、日', '小数的初步认识', '数学广角——搭配（二）'],
  '4-上册': ['大数的认识', '公顷和平方千米', '角的度量', '三位数乘两位数', '平行四边形和梯形', '除数是两位数的除法', '条形统计图', '数学广角——优化'],
  '4-下册': ['四则运算', '观察物体（二）', '运算律', '小数的意义和性质', '三角形', '小数的加法和减法', '图形的运动（二）', '平均数与条形统计图', '数学广角——鸡兔同笼'],
  '5-上册': ['小数乘法', '位置', '小数除法', '可能性', '简易方程', '多边形的面积', '数学广角——植树问题'],
  '5-下册': ['观察物体（三）', '因数与倍数', '长方体和正方体', '分数的意义和性质', '图形的运动（三）', '分数的加法和减法', '折线统计图', '找次品'],
  '6-上册': ['分数乘法', '位置与方向（二）', '分数除法', '比', '圆', '百分数（一）', '扇形统计图', '数学广角——数与形'],
  '6-下册': ['负数', '百分数（二）', '圆柱与圆锥', '比例', '数学广角——鸽巢问题'],
  '7-上册': ['有理数', '整式的加减', '一元一次方程', '几何图形初步'],
  '7-下册': ['相交线与平行线', '实数', '平面直角坐标系', '二元一次方程组', '不等式与不等式组', '数据的收集、整理与描述'],
  '8-上册': ['三角形', '全等三角形', '轴对称', '整式的乘法与因式分解', '分式'],
  '8-下册': ['二次根式', '勾股定理', '平行四边形', '一次函数', '数据的分析'],
  '9-上册': ['一元二次方程', '二次函数', '旋转', '圆', '概率初步'],
  '9-下册': ['反比例函数', '相似', '锐角三角函数', '投影与视图'],
}

interface LoginPageProps {
  onStart: (config: QuizConfig) => void
  onBack?: () => void
  errorMessage?: string
}

export default function LoginPage({ onStart, onBack, errorMessage }: LoginPageProps) {
  const [grade, setGrade] = useState<Grade>(5)
  const [semester, setSemester] = useState<Semester>('下册')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set())
  const [showAllUnits, setShowAllUnits] = useState(false)

  const units = GRADE_KNOWLEDGE[`${grade}-${semester}`] ?? []

  const toggleUnit = (u: string) => {
    const next = new Set(selectedUnits)
    if (next.has(u)) next.delete(u)
    else next.add(u)
    setSelectedUnits(next)
  }

  const handleStart = () => {
    onStart({
      grade,
      semester,
      questionCount: 999,
      difficulty,
      units: selectedUnits.size > 0 ? Array.from(selectedUnits) : undefined,
    })
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">中小学数学智能出题</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">选择练习设置</h1>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">选择年级、学期、知识点和难度，开始逐题练习。</p>
      </div>

      {/* Grade & Semester */}
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        <div>
          <p className="text-sm font-bold text-slate-700">年级</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button key={g} type="button" onClick={() => setGrade(g)}
                className={`min-w-[44px] rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${grade === g ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'}`}
              >{g}</button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-bold text-slate-700">学期</p>
          <div className="mt-2 flex gap-2">
            {(['上册', '下册'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSemester(s)}
                className={`rounded-2xl border-2 px-5 py-2 text-sm font-bold transition ${semester === s ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'}`}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Difficulty */}
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        <p className="text-sm font-bold text-slate-700">难易程度</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DIFFICULTY_OPTIONS.map(d => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDifficulty(d.key)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                difficulty === d.key
                  ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-bold text-slate-800">{d.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Units */}
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">知识点范围</p>
          <button
            type="button"
            onClick={() => setShowAllUnits(!showAllUnits)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800"
          >
            {showAllUnits ? '收起' : `全部 (${units.length}个)`}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">选择要练习的知识点，不选则全部覆盖</p>
        <div className={`mt-3 flex flex-wrap gap-2 ${showAllUnits ? '' : 'max-h-[120px] overflow-hidden'}`}>
          {units.map(u => (
            <button
              key={u}
              type="button"
              onClick={() => toggleUnit(u)}
              className={`rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition ${
                selectedUnits.has(u)
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        {selectedUnits.size > 0 && (
          <p className="mt-2 text-xs text-emerald-700">已选 {selectedUnits.size} 个知识点</p>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm text-rose-700">{errorMessage}</p>
        </div>
      )}

      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={handleStart}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg"
      >
        <Sparkles className="h-5 w-5" />
        开始练习
      </motion.button>

      {onBack && (
        <button type="button" onClick={onBack}
          className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />返回首页
        </button>
      )}
    </div>
  )
}
