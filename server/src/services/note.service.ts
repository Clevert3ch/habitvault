import { prisma } from '../lib/prisma'

// ─── Notebook types ──────────────────────────────────

interface CreateNotebookInput {
  name: string
  emoji?: string
  color?: string
}

interface CreateNoteInput {
  notebookId: string
  title: string
  content?: string
}

interface UpdateNoteInput {
  title?: string
  content?: string
}

// ─── Notebooks ───────────────────────────────────────

export async function getUserNotebooks(userId: string) {
  return prisma.notebook.findMany({
    where: { userId },
    include: {
      _count: {
        select: { notes: true }, // count of notes per notebook
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createNotebook(
  userId: string,
  input: CreateNotebookInput
) {
  return prisma.notebook.create({
    data: {
      userId,
      name: input.name,
      emoji: input.emoji ?? '📓',
      color: input.color ?? '#7c6af7',
    },
  })
}

export async function deleteNotebook(notebookId: string, userId: string) {
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId },
  })

  if (!notebook) {
    throw new Error('NOTEBOOK_NOT_FOUND')
  }

  // This will cascade delete all notes inside it
  return prisma.notebook.delete({
    where: { id: notebookId },
  })
}

// ─── Notes ───────────────────────────────────────────

export async function getNotebookNotes(
  userId: string,
  notebookId: string
) {
  return prisma.note.findMany({
    where: { userId, notebookId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function searchNotes(userId: string, query: string) {
  return prisma.note.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      notebook: {
        select: { name: true, emoji: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20, // limit results
  })
}

export async function createNote(userId: string, input: CreateNoteInput) {
  // Verify the notebook belongs to this user
  const notebook = await prisma.notebook.findFirst({
    where: { id: input.notebookId, userId },
  })

  if (!notebook) {
    throw new Error('NOTEBOOK_NOT_FOUND')
  }

  return prisma.note.create({
    data: {
      userId,
      notebookId: input.notebookId,
      title: input.title,
      content: input.content ?? '',
    },
  })
}

export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  })

  if (!note) {
    throw new Error('NOTE_NOT_FOUND')
  }

  return prisma.note.update({
    where: { id: noteId },
    data: input,
  })
}

export async function toggleStar(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  })

  if (!note) {
    throw new Error('NOTE_NOT_FOUND')
  }

  // Toggle — if starred, unstar. If unstarred, star.
  return prisma.note.update({
    where: { id: noteId },
    data: { isStarred: !note.isStarred },
  })
}

export async function deleteNote(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  })

  if (!note) {
    throw new Error('NOTE_NOT_FOUND')
  }

  return prisma.note.delete({
    where: { id: noteId },
  })
}