import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getHabits,
  createHabitHandler,
  updateHabitHandler,
  archiveHabitHandler,
  checkInHandler,
  undoCheckInHandler,
} from '../controllers/habit.controller'

const router = Router()

// All habit routes require authentication
// Instead of adding authenticate to every line,
// we use router.use() to apply it to all routes in this file

router.use(authenticate)

router.get('/', getHabits)
router.post('/', createHabitHandler)
router.patch('/:id', updateHabitHandler)
router.delete('/:id', archiveHabitHandler)
router.post('/:id/checkin', checkInHandler)
router.delete('/:id/checkin', undoCheckInHandler)

export default router