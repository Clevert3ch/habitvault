import { Request, Response } from 'express'
import { z } from 'zod'
import { registerUser, loginUser, generateAccessToken, generateRefreshToken } from '../services/auth.service'
import { AuthRequest } from '../types'
import jwt from 'jsonwebtoken'

// ─── Validation schemas ──────────────────────────────
// Zod validates the request body shape before we touch it

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ─── Register ────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  // Validate request body
  const result = registerSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const { user, accessToken, refreshToken } = await registerUser(result.data)

    // Send refresh token as httpOnly cookie — JS can't read this,
    // which protects against XSS attacks stealing the token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    })

    res.status(201).json({ user, accessToken })
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'Email already in use' })
      return
    }
    res.status(500).json({ error: 'Something went wrong' })
  }
}

// ─── Login ───────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({ error: 'Invalid input' })
    return
  }

  try {
    const { user, accessToken, refreshToken } = await loginUser(result.data)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ user, accessToken })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }
    res.status(500).json({ error: 'Something went wrong' })
  }
}

// ─── Refresh token ───────────────────────────────────

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken

  if (!token) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      userId: string
      email: string
      name: string
    }

    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    })

    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

// ─── Me ──────────────────────────────────────────────

export async function me(req: AuthRequest, res: Response): Promise<void> {
  // req.user is set by the authenticate middleware
  res.json({ user: req.user })
}

// ─── Logout ──────────────────────────────────────────

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
}