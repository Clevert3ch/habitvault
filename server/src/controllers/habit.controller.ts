import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types'
import {
  getUserHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  checkInHabit,
  undoCheckIn,
  getProgressStats,
} from '../services/habit.service'


//------ validation schemas-------

const createSchema = z.object({
     name: z.string().min(1, 'Name is required').max(100),
  color: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
})

const updateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
})


//--------get all habits -----------------
export async function getHabits(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const habits = await getUserHabits(req.user!.id)
    res.json(habits)
  } catch {
    res.status(500).json({ error: 'Failed to fetch habits' })
  }
}


// ------ Create habit ----------------------

export async function createHabitHandler(
    req: AuthRequest,
  res: Response): Promise<void> {
    const result = createSchema.safeParse(req.body)

    if(!result.success) {
        res.status(400).json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors,
        })
        return
    }
    try{
        const habit = await createHabit(req.user!.id, result.data)
        res.status(201).json(habit)
    } catch {
        res.status(500).json({ error: 'Failed to create habit' })
    }
}


// ----- Update habit ----------------------

export async function updateHabitHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = updateSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({ error: 'Validation failed' })
    return
  }

  try {
    const habit = await updateHabit(
      req.params.id,
      req.user!.id,
      result.data
    )
    res.json(habit)
  } catch (err) {
    if (err instanceof Error && err.message === 'HABIT_NOT_FOUND') {
      res.status(404).json({ error: 'Habit not found' })
      return
    }
    res.status(500).json({ error: 'Failed to update habit' })
  }
}

//----- Archive habit ---------------

export async function archiveHabitHandler(
    req: AuthRequest,
    res: Response
): Promise<void> {
    try{
        await archiveHabit(req.params.id, req.user!.id)
        res.status(204).send()
    } catch(err) {
        if (err instanceof Error && err.message === 'HABIT_NOT_FOUND') {
            res.status(404).json({ error: 'Habit not found'})
            return
        }
        res.status(500).json({error : 'Failed to archive habit'})
    }
}

//----------check in --------------------------

export async function checkInHandler(
    req: AuthRequest,
    res: Response
): Promise<void>{
    try {
        const checkIn = await checkInHabit(req.params.id, req.user!.id)
        res.status(201).json(checkIn)
    }catch( err ) {
        if (err instanceof Error && err.message === 'HABIT_NOT_FOUND'){
            res.status(404).json({error: 'Habit not found'})
            return
        }
        if (err instanceof Error && err.message === 'ALREADY_CHECKED_IN'){
            res.status(409).json({error: 'Already checked in today' })
            return
        }
        res.status(500).json({error: 'Failed to check in'})
    }
}

//-------Undo Check in -----------
export async function undoCheckInHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try{
    await undoCheckIn(req.params.id, req.user!.id)
    res.status(204).send()
  }catch(err) {
    if(err instanceof Error && err.message === 'CHECKING_NOT_FOUND'){
      res.status(404).json({error: 'No check-in found for today'})
      return
    }
    res.status(500).json({error : 'Failed to undo check-in'})
  }
}


import { getProgressStats } from '../services/habit.service'

export async function getStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const stats = await getProgressStats(req.user!.id)
    res.json(stats)
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}