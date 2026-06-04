import { useState } from 'react'
import { X, KeyRound } from 'lucide-react'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (password: string) => void
}

export default function AdminModal({ open, onClose, onConfirm }: AdminModalProps) {
  const [password, setPassword] = useState('')

  if (!open) return null

  const handleSubmit = () => {
    if (!password.trim()) return
    onConfirm(password.trim())
    setPassword('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-black text-slate-800">管理员验证</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">请输入管理员密码以生成新题目</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="管理员密码"
          autoFocus
          className="mt-4 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-300"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!password.trim()}
            className="flex-1 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
