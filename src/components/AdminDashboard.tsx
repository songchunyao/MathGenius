import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, BookOpenText, LogOut, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { Grade, Semester, Difficulty, Question, GradeSemesterStats, QuestionFormData } from '../types'
import { fetchAdminStats, fetchAdminQuestions, updateQuestion, deleteQuestion, appendQuestions, addQuestion } from '../api/client'

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

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

interface AdminDashboardProps {
  adminToken: string
  onLogout: () => void
  onBackToConfig: () => void
}

export default function AdminDashboard({ adminToken, onLogout, onBackToConfig }: AdminDashboardProps) {
  const [stats, setStats] = useState<GradeSemesterStats[]>([])
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generateCount, setGenerateCount] = useState(10)
  const [generateDifficulty, setGenerateDifficulty] = useState<Difficulty>('medium')
  const [generateUnits, setGenerateUnits] = useState<Set<string>>(new Set())
  const [generateLoading, setGenerateLoading] = useState(false)

  // Load stats on mount
  useEffect(() => {
    fetchAdminStats(adminToken)
      .then(setStats)
      .catch(e => setError(e.message))
  }, [adminToken])

  // Load questions when filter changes
  useEffect(() => {
    if (selectedGrade && selectedSemester) {
      setLoading(true)
      setError(null)
      fetchAdminQuestions(selectedGrade, selectedSemester, adminToken)
        .then(setQuestions)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }
  }, [selectedGrade, selectedSemester, adminToken])

  const refreshStats = () => {
    fetchAdminStats(adminToken).then(setStats).catch(() => {})
  }

  const refreshQuestions = () => {
    if (selectedGrade && selectedSemester) {
      fetchAdminQuestions(selectedGrade, selectedSemester, adminToken)
        .then(setQuestions)
        .catch(e => setError(e.message))
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这道题目吗？')) return
    try {
      await deleteQuestion(id, adminToken)
      refreshQuestions()
      refreshStats()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleEditSave = async (id: number, data: Partial<QuestionFormData>) => {
    try {
      await updateQuestion(id, data, adminToken)
      setEditingQuestion(null)
      refreshQuestions()
      refreshStats()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleAddSave = async (data: QuestionFormData) => {
    if (!selectedGrade || !selectedSemester) return
    try {
      await addQuestion(selectedGrade, selectedSemester, data, adminToken)
      setShowAddForm(false)
      refreshQuestions()
      refreshStats()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleGenerate = async () => {
    if (!selectedGrade || !selectedSemester) return
    setGenerateLoading(true)
    try {
      await appendQuestions(selectedGrade, selectedSemester, generateCount, adminToken, generateDifficulty, Array.from(generateUnits))
      setShowGenerate(false)
      refreshQuestions()
      refreshStats()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerateLoading(false)
    }
  }

  const selectedStats = selectedGrade && selectedSemester
    ? stats.find(s => s.grade === selectedGrade && s.semester === selectedSemester)
    : null

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpenText className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">管理员面板</p>
                <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">题库管理</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onBackToConfig}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                返回出题
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
          <h2 className="text-lg font-black text-slate-800">题库概览</h2>
          {stats.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">暂无题目数据</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {stats.map((s) => (
                <button
                  key={`${s.grade}-${s.semester}`}
                  type="button"
                  onClick={() => { setSelectedGrade(s.grade); setSelectedSemester(s.semester) }}
                  className={`rounded-2xl border-2 p-3 text-center transition ${
                    selectedGrade === s.grade && selectedSemester === s.semester
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-emerald-200'
                  }`}
                >
                  <p className="text-lg font-black text-slate-800">{s.grade} 年级</p>
                  <p className="text-xs font-semibold text-slate-500">{s.semester}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700">{s.count} 题</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Admin Controls */}
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Grade filter */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-slate-700">年级</span>
              <div className="flex flex-wrap gap-1.5">
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setSelectedGrade(g); setSelectedSemester(null) }}
                    className={`min-w-[36px] rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold transition ${
                      selectedGrade === g ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-slate-700">学期</span>
              {(['上册', '下册'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { if (selectedGrade) setSelectedSemester(s) }}
                  disabled={!selectedGrade}
                  className={`rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition disabled:opacity-30 ${
                    selectedSemester === s ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {selectedGrade && selectedSemester && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowGenerate(true)}
                className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-200"
              >
                <Sparkles className="h-4 w-4" />
                追加生成
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2.5 text-sm font-bold text-sky-800 hover:bg-sky-200"
              >
                <Plus className="h-4 w-4" />
                手动添加
              </button>
              <span className="text-sm text-slate-500">
                {selectedStats ? `${selectedStats.count}` : '0'} 道题目
              </span>
            </div>
          )}
        </div>

        {/* Questions Table */}
        {selectedGrade && selectedSemester && (
          <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
            <h2 className="mb-4 text-lg font-black text-slate-800">
              {selectedGrade} 年级 {selectedSemester} · 全部题目
            </h2>
            {loading ? (
              <p className="text-sm text-slate-500">加载中...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-slate-500">暂无题目，请先生成或添加</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="pb-2 pr-2">ID</th>
                      <th className="pb-2 pr-2">分类</th>
                      <th className="pb-2 pr-2">标题</th>
                      <th className="pb-2 pr-2">答案</th>
                      <th className="pb-2 pr-2">题目</th>
                      <th className="pb-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id} className="border-b border-slate-100 text-slate-700 last:border-0">
                        <td className="py-2 pr-2 font-mono text-xs text-slate-400">{q.id}</td>
                        <td className="py-2 pr-2 text-xs font-semibold">{q.category}</td>
                        <td className="py-2 pr-2 font-medium">{q.title}</td>
                        <td className="py-2 pr-2 text-emerald-700 font-semibold">{q.answer}</td>
                        <td className="py-2 pr-2 max-w-[200px] truncate text-xs text-slate-500">{q.prompt}</td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingQuestion(q)}
                              className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50"
                              title="编辑"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(q.id)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Filter hint */}
        {!selectedGrade && !selectedSemester && (
          <div className="rounded-[28px] border border-white/60 bg-white/80 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <BookOpenText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-500">点击上方年级或统计卡片查看题目</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <QuestionFormModal
          title="编辑题目"
          initial={editingQuestion}
          onSave={(data) => handleEditSave(editingQuestion.id, data)}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* Add Modal */}
      {showAddForm && (
        <QuestionFormModal
          title="手动添加题目"
          onSave={handleAddSave}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Generate Modal */}
      {showGenerate && selectedGrade && selectedSemester && (
        <GenerateModal
          grade={selectedGrade}
          semester={selectedSemester}
          count={generateCount}
          difficulty={generateDifficulty}
          selectedUnits={generateUnits}
          loading={generateLoading}
          onCountChange={setGenerateCount}
          onDifficultyChange={setGenerateDifficulty}
          onUnitsChange={setGenerateUnits}
          onGenerate={handleGenerate}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  )
}

// ======== Generate Modal ========

interface GenerateModalProps {
  grade: Grade
  semester: Semester
  count: number
  difficulty: Difficulty
  selectedUnits: Set<string>
  loading: boolean
  onCountChange: (c: number) => void
  onDifficultyChange: (d: Difficulty) => void
  onUnitsChange: (u: Set<string>) => void
  onGenerate: () => void
  onClose: () => void
}

function GenerateModal({ grade, semester, count, difficulty, selectedUnits, loading, onCountChange, onDifficultyChange, onUnitsChange, onGenerate, onClose }: GenerateModalProps) {
  const units = GRADE_KNOWLEDGE[`${grade}-${semester}`] ?? []

  const toggleUnit = (u: string) => {
    const next = new Set(selectedUnits)
    if (next.has(u)) next.delete(u)
    else next.add(u)
    onUnitsChange(next)
  }

  const DIFFICULTY_OPTIONS: { key: Difficulty; label: string }[] = [
    { key: 'easy', label: '😊 基础' },
    { key: 'medium', label: '🤔 中等' },
    { key: 'hard', label: '😈 较难' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-black text-slate-800">
              {loading ? '正在生成...' : 'AI 追加生成'}
            </h2>
          </div>
          {!loading && (
            <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {loading ? (
          <div className="py-8 text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-[spin_2s_linear_infinite] rounded-full border-4 border-slate-200 border-t-amber-500" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">AI 正在生成题目...</p>
            <p className="mt-1 text-xs text-slate-500">请耐心等待，约需 30-60 秒</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              为 {grade} 年级 {semester} 追加新题目（不覆盖已有题目）
            </p>

            <div className="mt-4">
              <p className="text-sm font-bold text-slate-700">生成数量</p>
              <input type="number" min={1} max={50} value={count}
                onChange={e => onCountChange(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-300" />
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-slate-700">难易程度</p>
              <div className="mt-2 flex gap-2">
                {DIFFICULTY_OPTIONS.map(d => (
                  <button key={d.key} type="button" onClick={() => onDifficultyChange(d.key)}
                    className={`flex-1 rounded-2xl border-2 px-3 py-2 text-xs font-bold transition ${
                      difficulty === d.key ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >{d.label}</button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-slate-700">知识点（选填，不选则全部覆盖）</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {units.map(u => (
                  <button key={u} type="button" onClick={() => toggleUnit(u)}
                    className={`rounded-xl border-2 px-2.5 py-1 text-xs font-semibold transition ${
                      selectedUnits.has(u) ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                    }`}
                  >{u}</button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">取消</button>
              <button type="button" onClick={onGenerate}
                className="flex-1 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600">开始生成</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ======== Question Form Modal (shared by edit + add) ========

interface QuestionFormModalProps {
  title: string
  initial?: Question
  onSave: (data: QuestionFormData) => void
  onClose: () => void
}

function QuestionFormModal({ title, initial, onSave, onClose }: QuestionFormModalProps) {
  const [category, setCategory] = useState(initial?.category ?? '')
  const [qTitle, setQTitle] = useState(initial?.title ?? '')
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [options, setOptions] = useState<string[]>(initial?.options ?? ['', '', '', ''])
  const [answer, setAnswer] = useState(initial?.answer ?? '')
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [tip, setTip] = useState(initial?.tip ?? '')
  const [figure, setFigure] = useState(initial?.figure ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!category.trim() || !qTitle.trim() || !prompt.trim() || !answer.trim()) return
    setSaving(true)
    await onSave({ category: category.trim(), title: qTitle.trim(), prompt: prompt.trim(), options, answer: answer.trim(), explanation: explanation.trim(), tip: tip.trim(), figure: figure.trim() })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-10">
      <div className="mx-4 w-full max-w-lg rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-700">分类</p>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="如：因数与倍数"
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">标题</p>
            <input value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="题目标题"
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">题目内容</p>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="题目正文..."
              rows={3}
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300 resize-none" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 mb-1">选项</p>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mt-1.5">
                <span className="w-6 text-center text-sm font-bold text-slate-500">{String.fromCharCode(65 + i)}.</span>
                <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o) }}
                  placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                  className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">正确答案</p>
            <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="必须与某个选项完全一致"
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">解析</p>
            <textarea value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="解题步骤..."
              rows={3}
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300 resize-none" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">提示（选填）</p>
            <input value={tip} onChange={e => setTip(e.target.value)} placeholder="解题小提示"
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">配图 SVG（选填）</p>
            <textarea value={figure} onChange={e => setFigure(e.target.value)} placeholder="<svg viewBox='0 0 200 150'...>"
              rows={4}
              className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300 resize-none font-mono text-xs" />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">取消</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
