import { motion } from 'framer-motion'
import { BookOpenText, BookX, LogOut } from 'lucide-react'

interface UserDashboardProps {
  username: string
  onStartPractice: () => void
  onOpenMistakeBook: () => void
  onLogout: () => void
  onAdminLogin?: () => void
}

export default function UserDashboard({ username, onStartPractice, onOpenMistakeBook, onLogout }: UserDashboardProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 min-h-[70vh] justify-center">
      <div className="rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
        <div className="flex items-center gap-3">
          <BookOpenText className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">中小学数学智能出题</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800 sm:text-3xl">你好，{username}！</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <motion.button
          type="button" whileTap={{ scale: 0.97 }}
          onClick={onStartPractice}
          className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] hover:bg-white/90 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
              <BookOpenText className="h-7 w-7 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">开始练习</h2>
              <p className="mt-1 text-sm text-slate-500">选择年级和学期，开始逐题练习</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.97 }}
          onClick={onOpenMistakeBook}
          className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] hover:bg-white/90 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
              <BookX className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">错题本</h2>
              <p className="mt-1 text-sm text-slate-500">查看和复习做错的题目</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="rounded-[28px] border border-rose-100 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] hover:bg-white/90 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
              <LogOut className="h-7 w-7 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">退出登录</h2>
              <p className="mt-1 text-sm text-slate-500">返回登录页面</p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
