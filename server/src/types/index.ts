import { Request } from 'express'

// Extends Express's Request type to include the authenticated user
// After our auth middleware runs, req.user will always be available
export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
  }
}