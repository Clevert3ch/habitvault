import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getNotebooks,
  createNotebookHandler,
  deleteNotebookHandler,
  getNotes,
  createNoteHandler,
  updateNoteHandler,
  toggleStarHandler,
  deleteNoteHandler,
} from '../controllers/note.controller'

const router = Router()
router.use(authenticate)

// Notebook routes
router.get('/notebooks', getNotebooks)
router.post('/notebooks', createNotebookHandler)
router.delete('/notebooks/:id', deleteNotebookHandler)

// Note routes
router.get('/', getNotes)
router.post('/', createNoteHandler)
router.put('/:id', updateNoteHandler)
router.patch('/:id/star', toggleStarHandler)
router.delete('/:id', deleteNoteHandler)

export default router