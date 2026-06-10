import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types'
import {
  getUserNotebooks,
  createNotebook,
  deleteNotebook,
  getNotebookNotes,
  searchNotes,
  createNote,
  updateNote,
  toggleStar,
  deleteNote,
} from '../services/note.service'

// Validation schemas

const createNotebookSchema = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().optional(),
  color: z.string().optional(),
})

const createNoteSchema = z.object({
  notebookId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().optional(),
})

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
})

// Notebook handlers

export async function getNotebooks(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const notebooks = await getUserNotebooks(req.user!.id)
    res.json(notebooks)
  } catch {
    res.status(500).json({ error: 'Failed to fetch notebooks' })
  }
}

export async function createNotebookHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = createNotebookSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed' })
    return
  }

  try {
    const notebook = await createNotebook(req.user!.id, result.data)
    res.status(201).json(notebook)
  } catch {
    res.status(500).json({ error: 'Failed to create notebook' })
  }
}

export async function deleteNotebookHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    await deleteNotebook(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    if (err instanceof Error && err.message === 'NOTEBOOK_NOT_FOUND') {
      res.status(404).json({ error: 'Notebook not found' })
      return
    }
    res.status(500).json({ error: 'Failed to delete notebook' })
  }
}

//  Note handlers 

export async function getNotes(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { notebookId, search } = req.query

    if (search && typeof search === 'string') {
      const notes = await searchNotes(req.user!.id, search)
      res.json(notes)
      return
    }

    if (!notebookId || typeof notebookId !== 'string') {
      res.status(400).json({ error: 'notebookId is required' })
      return
    }

    const notes = await getNotebookNotes(req.user!.id, notebookId)
    res.json(notes)
  } catch {
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
}

export async function createNoteHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = createNoteSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const note = await createNote(req.user!.id, result.data)
    res.status(201).json(note)
  } catch (err) {
    if (err instanceof Error && err.message === 'NOTEBOOK_NOT_FOUND') {
      res.status(404).json({ error: 'Notebook not found' })
      return
    }
    res.status(500).json({ error: 'Failed to create note' })
  }
}

export async function updateNoteHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = updateNoteSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed' })
    return
  }

  try {
    const note = await updateNote(req.params.id, req.user!.id, result.data)
    res.json(note)
  } catch (err) {
    if (err instanceof Error && err.message === 'NOTE_NOT_FOUND') {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.status(500).json({ error: 'Failed to update note' })
  }
}

export async function toggleStarHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const note = await toggleStar(req.params.id, req.user!.id)
    res.json(note)
  } catch (err) {
    if (err instanceof Error && err.message === 'NOTE_NOT_FOUND') {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.status(500).json({ error: 'Failed to toggle star' })
  }
}

export async function deleteNoteHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    await deleteNote(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    if (err instanceof Error && err.message === 'NOTE_NOT_FOUND') {
      res.status(404).json({ error: 'Note not found' })
      return
    }
    res.status(500).json({ error: 'Failed to delete note' })
  }
}