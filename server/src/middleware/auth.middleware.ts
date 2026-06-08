import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest } from '../types'

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Token comes in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      name: string
    }

    // Attach user to request so controllers can use it
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    }

    next() // hand off to the next handler
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}