import { Router } from 'express'
import crypto from 'crypto'
import { createUser, findUserByUsername, findUserById, createSession, findSessionByToken, deleteSession } from '../db/index.js'
import { requireUser } from '../middleware/auth.js'

const router = Router()

function hash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function validateUsername(name: string): string | null {
  if (name.length < 2 || name.length > 20) return '用户名长度应在 2-20 个字符之间'
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < 4) return '密码长度至少 4 个字符'
  return null
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'validation', message: '缺少用户名或密码' })
    return
  }

  const nameErr = validateUsername(username)
  if (nameErr) { res.status(400).json({ error: 'validation', message: nameErr }); return }

  const pwErr = validatePassword(password)
  if (pwErr) { res.status(400).json({ error: 'validation', message: pwErr }); return }

  if (findUserByUsername(username)) {
    res.status(409).json({ error: 'conflict', message: '用户名已存在' })
    return
  }

  const user = createUser(username, hash(password))
  const session = createSession(user.id)

  res.json({ token: session.token, user: { id: user.id, username: user.username } })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'validation', message: '缺少用户名或密码' })
    return
  }

  const user = findUserByUsername(username)
  if (!user || user.passwordHash !== hash(password)) {
    res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' })
    return
  }

  deleteSession(user.id.toString()) // clean up old sessions
  const session = createSession(user.id)

  res.json({ token: session.token, user: { id: user.id, username: user.username } })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.headers['x-auth-token'] as string | undefined
  if (token) deleteSession(token)
  res.json({ success: true })
})

// GET /api/auth/me
router.get('/me', requireUser, (req, res) => {
  res.json({ user: { id: req.userId, username: req.username } })
})

export default router
