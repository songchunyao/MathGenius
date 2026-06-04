import { useEffect, useState } from 'react'
import type { Question, QuizConfig, QuizPhase, LoadingStatus, AuthResponse, AdventureState, StageResult, StageDef } from './types'
import { fetchQuestions, recordMistake, recordProgress, saveStageResult, fetchStageResults } from './api/client'
import { fetchMe } from './api/client'
import AuthPage from './components/AuthPage'
import LoginPage from './components/LoginPage'
import LoadingView from './components/LoadingView'
import AdminDashboard from './components/AdminDashboard'
import UserDashboard from './components/UserDashboard'
import MistakeBook from './components/MistakeBook'
import StageMap from './components/StageMap'
import QuizView from './components/QuizView'
import StageResultOverlay from './components/StageResult'
import CompletionScreen from './components/CompletionScreen'

const defaultConfig: QuizConfig = { grade: 5, semester: '下册', questionCount: 999 }

function groupByCategory(qs: Question[]): StageDef[] {
  const grouped: Record<string, Question[]> = {}
  for (const q of qs) {
    if (!grouped[q.category]) grouped[q.category] = []
    grouped[q.category].push(q)
  }
  return Object.entries(grouped)
    .filter(([_, list]) => list.length > 0)
    .map(([category, questions], idx) => ({ category, questions, stageIndex: idx }))
}

function App() {
  const [phase, setPhase] = useState<QuizPhase>('auth')
  const [config, setConfig] = useState<QuizConfig>(defaultConfig)
  const [questions, setQuestions] = useState<Question[]>([])
  const [stages, setStages] = useState<StageDef[]>([])
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({ type: 'loading' })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'))

  // Auth state
  const [userToken, setUserToken] = useState<string | null>(() => sessionStorage.getItem('user_token'))
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)

  // Stage state
  const [stageIndex, setStageIndex] = useState(0)
  const [stageResults, setStageResults] = useState<StageResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showStageResult, setShowStageResult] = useState(false)
  const [adventure, setAdventure] = useState<AdventureState>({
    hearts: 5, maxHearts: 5, exp: 0, level: 1,
    score: 0, combo: 0, bestCombo: 0, mistakes: [],
  })
  const [totalScore, setTotalScore] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)

  // Check auth on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('user_token')
    if (storedToken) {
      fetchMe(storedToken)
        .then(user => { setUserToken(storedToken); setCurrentUser(user); setPhase('userDashboard') })
        .catch(() => { sessionStorage.removeItem('user_token'); setPhase('auth') })
    } else {
      setPhase('auth')
    }
  }, [])

  const currentStage = stages[stageIndex]
  const stageQuestions = currentStage?.questions ?? []
  const isStageComplete = currentIndex >= stageQuestions.length - 1 && status !== 'idle'
  const isLastStage = stageIndex >= stages.length - 1

  const loadStage = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setStatus('idle')
    setAdventure({ hearts: 5, maxHearts: 5, exp: 0, level: 1, score: 0, combo: 0, bestCombo: 0, mistakes: [] })
  }

  const handleAnswer = (option: string) => {
    if (status !== 'idle' || !stageQuestions[currentIndex]) return
    const q = stageQuestions[currentIndex]
    const isCorrect = option === q.answer
    setSelectedOption(option)
    setStatus(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      const newCombo = adventure.combo + 1
      let bonusExp = 0
      if (newCombo === 3) bonusExp = 5
      else if (newCombo === 5) bonusExp = 10
      else if (newCombo === 10) bonusExp = 20
      setAdventure(prev => ({ ...prev, score: prev.score + 1, combo: newCombo, bestCombo: Math.max(prev.bestCombo, newCombo), exp: prev.exp + 10 + bonusExp }))
      if (userToken) recordProgress(userToken, config.grade, config.semester, q.id, true).catch(() => {})
    } else {
      setAdventure(prev => ({ ...prev, hearts: Math.max(0, prev.hearts - 1), combo: 0, mistakes: [...prev.mistakes, q.prompt] }))
      if (userToken) {
        recordMistake(userToken, q.id, option).catch(() => {})
        recordProgress(userToken, config.grade, config.semester, q.id, false).catch(() => {})
      }
    }
  }

  const handleFinishStage = () => {
    if (isStageComplete) {
      const stageScore = adventure.score
      const coins = stageScore * 5 + (stageScore === stageQuestions.length ? 10 : 0)
      setTotalScore(prev => prev + stageScore)
      setTotalCoins(prev => prev + coins)
      if (userToken) saveStageResult(userToken, config.grade, config.semester, stageIndex, stageScore, stageQuestions.length, coins).catch(() => {})
      setShowStageResult(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setStatus('idle')
    }
  }

  const handleNextStage = () => {
    setShowStageResult(false)
    if (isLastStage) {
      setPhase('completion')
    } else {
      const next = stageIndex + 1
      setStageIndex(next)
      loadStage()
    }
  }

  const handleRetry = () => {
    setShowStageResult(false)
    loadStage()
  }

  const handleStart = async (newConfig: QuizConfig) => {
    setErrorMessage(null)
    setConfig(newConfig)
    setPhase('loading')
    setLoadingStatus({ type: 'loading' })
    try {
      const result = await fetchQuestions(newConfig.grade, newConfig.semester)
      if (!result || result.length === 0) {
        setErrorMessage('该年级学期暂无题库，请联系管理员生成题目')
        setPhase('config')
        return
      }
      setQuestions(result)
      const grouped = groupByCategory(result)
      setStages(grouped)

      // Load stage results
      let s: StageResult[] = []
      if (userToken) {
        try { s = await fetchStageResults(userToken, newConfig.grade, newConfig.semester) } catch {}
      }
      setStageResults(s)

      let firstIncomplete = 0
      for (let i = 0; i < grouped.length; i++) {
        const groupTotal = grouped[i].questions.length
        const found = s.find(r => r.stageIndex === i)
        if (!found || found.score < groupTotal) { firstIncomplete = i; break }
        else { firstIncomplete = i + 1 }
      }
      if (firstIncomplete >= grouped.length) firstIncomplete = 0
      setStageIndex(firstIncomplete)
      setTotalScore(s.reduce((sum, r) => sum + r.score, 0))
      setTotalCoins(s.reduce((sum, r) => sum + r.coins, 0))
      setPhase('stageMap')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '连接服务器失败')
      setPhase('config')
    }
  }

  const handleStartStage = (index: number) => {
    setStageIndex(index)
    loadStage()
    setPhase('quiz')
  }

  // Auth handlers
  const handleAuthLogin = (response: AuthResponse) => {
    sessionStorage.setItem('user_token', response.token)
    setUserToken(response.token)
    setCurrentUser(response.user)
    setPhase('userDashboard')
  }

  const handleUserLogout = async () => {
    if (userToken) { try { const { logout } = await import('./api/client'); await logout(userToken) } catch {} }
    sessionStorage.removeItem('user_token'); setUserToken(null); setCurrentUser(null); setPhase('auth')
  }

  const handleAdminLogout = () => { sessionStorage.removeItem('admin_token'); setAdminToken(null); setPhase('auth') }
  const handleAdminLogin = (token: string) => { setAdminToken(token); setPhase('admin') }
  const handleRetryFull = () => handleStart(config)
  const handleBackToDashboard = () => setPhase('userDashboard')
  const handleStartPractice = () => setPhase('config')
  const handleOpenMistakeBook = () => setPhase('mistakeBook')

  // -------- Render by phase --------
  if (phase === 'auth') return <AuthPage onLogin={handleAuthLogin} onAdminLogin={handleAdminLogin} />
  if (phase === 'userDashboard') {
    return <UserDashboard username={currentUser?.username ?? ''} onStartPractice={handleStartPractice} onOpenMistakeBook={handleOpenMistakeBook} onLogout={handleUserLogout} />
  }
  if (phase === 'mistakeBook') return <MistakeBook token={userToken!} onBack={handleBackToDashboard} />
  if (phase === 'admin') return <AdminDashboard adminToken={adminToken!} onLogout={handleAdminLogout} onBackToConfig={handleBackToDashboard} />
  if (phase === 'config') return <LoginPage onStart={handleStart} onBack={handleBackToDashboard} errorMessage={errorMessage ?? undefined} />
  if (phase === 'loading') return <LoadingView status={loadingStatus} config={config} onRetry={handleRetryFull} onBack={handleBackToDashboard} />

  if (phase === 'stageMap') {
    return (
      <StageMap
        stages={stages}
        stageResults={stageResults}
        grade={config.grade}
        semester={config.semester}
        onStartStage={handleStartStage}
      />
    )
  }

  if (phase === 'completion') {
    return (
      <CompletionScreen
        config={config}
        totalScore={totalScore}
        totalQuestions={questions.length}
        totalCoins={totalCoins}
        bestCombo={adventure.bestCombo}
        mistakeCount={adventure.mistakes.length}
        onRetry={handleRetryFull}
        onBack={handleBackToDashboard}
      />
    )
  }

  // Quiz phase
  return (
    <>
      <QuizView
        stage={currentStage!}
        adventure={adventure}
        onAnswer={handleAnswer}
        onFinishStage={handleFinishStage}
        onReset={() => loadStage()}
        onBack={() => setPhase('stageMap')}
        stageIndex={stageIndex}
        currentIndex={currentIndex}
        selectedOption={selectedOption}
        status={status}
        isStageComplete={isStageComplete}
      />
      {showStageResult && (
        <StageResultOverlay
          stageIndex={stageIndex}
          category={currentStage?.category ?? ''}
          score={adventure.score}
          total={stageQuestions.length}
          coins={adventure.score * 5 + (adventure.score === stageQuestions.length ? 10 : 0)}
          onNextStage={handleNextStage}
          onRetry={handleRetry}
          onBack={() => setPhase('stageMap')}
        />
      )}
    </>
  )
}

export default App
