import { config } from '../config.js'
import { findSessionByToken, findUserById } from '../db/index.js'
import type { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: number
      username?: string
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-admin-token'] as string | undefined
  if (!token || token !== config.adminToken) {
    res.status(401).json({ error: 'unauthorized', message: '管理员密码错误' })
    return
  }
  next()
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-auth-token'] as string | undefined
  if (!token) {
    res.status(401).json({ error: 'unauthorized', message: '请先登录' })
    return
  }
  const session = findSessionByToken(token)
  if (!session) {
    res.status(401).json({ error: 'unauthorized', message: '登录已过期，请重新登录' })
    return
  }
  const user = findUserById(session.userId)
  if (!user) {
    res.status(401).json({ error: 'unauthorized', message: '用户不存在' })
    return
  }
  req.userId = user.id
  req.username = user.username
  next()
}
