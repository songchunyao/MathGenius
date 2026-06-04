import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Sparkles, LogIn, UserPlus, Shield } from 'lucide-react'
import type { AuthResponse } from '../types'
import { login, register } from '../api/client'
import AdminModal from './AdminModal'

interface AuthPageProps {
  onLogin: (response: AuthResponse) => void
  onAdminLogin: (token: string) => void
}

export default function AuthPage({ onLogin, onAdminLogin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (!username.trim() || !password) {
      setError('请填写用户名和密码')
      return
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    setSubmitting(true)
    try {
      const result = mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), password)
      onLogin(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 min-h-[70vh] justify-center">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">中小学数学智能出题</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">
              {mode === 'login' ? '登录' : '注册'}
            </h1>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-700">用户名</p>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="2-20 个字符" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-sky-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">密码</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="至少 4 个字符"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-sky-300" />
          </div>
          {mode === 'register' && (
            <div>
              <p className="text-sm font-bold text-slate-700">确认密码</p>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-sky-300" />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <motion.button
          type="button" whileTap={{ scale: 0.98 }} disabled={submitting}
          onClick={handleSubmit}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-base font-bold text-white shadow-lg disabled:opacity-40"
        >
          {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          {submitting ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </motion.button>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>没有账号？<button type="button" onClick={() => { setMode('register'); setError(null) }} className="font-bold text-sky-700 hover:text-sky-900">去注册</button></>
          ) : (
            <>已有账号？<button type="button" onClick={() => { setMode('login'); setError(null) }} className="font-bold text-sky-700 hover:text-sky-900">去登录</button></>
          )}
        </p>
      </div>

      {/* Admin entry */}
      <div className="flex justify-center gap-2 text-xs text-slate-400">
        <Shield className="h-3 w-3" />
        <button type="button" onClick={() => setAdminModalOpen(true)} className="hover:text-slate-600">管理员入口</button>
      </div>

      <AdminModal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} onConfirm={(pwd) => { setAdminModalOpen(false); onAdminLogin(pwd) }} />
    </div>
  )
}
