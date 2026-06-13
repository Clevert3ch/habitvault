import { useState, useEffect } from 'react'
import {
  useNotebooks,
  useCreateNotebook,
  useNotes,
  useSearchNotes,
  useCreateNote,
  useUpdateNote,
  useToggleStar,
  useDeleteNote,
} from './useNotes'
import type { Notebook, Note } from '../../types'
import ReactMarkdown from 'react-markdown'

// ─── Notebook sidebar item ───────────────────────────

function NotebookItem({
  notebook,
  isActive,
  onClick,
}: {
  notebook: Notebook
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-violet-600/20 text-violet-300'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <span className="text-lg">{notebook.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{notebook.name}</p>
        <p className="text-xs text-gray-500">
          {notebook._count?.notes ?? 0} notes
        </p>
      </div>
    </button>
  )
}

// ─── Note card ───────────────────────────────────────

function NoteCard({
  note,
  isActive,
  onClick,
  onStar,
}: {
  note: Note
  isActive: boolean
  onClick: () => void
  onStar: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? 'border-violet-500/40 bg-violet-600/5'
          : 'border-gray-800 hover:border-gray-700 bg-gray-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-white text-sm font-medium truncate">
          {note.title}
        </h3>
        <button
          onClick={onStar}
          className="flex-shrink-0 text-base leading-none"
        >
          {note.isStarred ? '⭐' : '☆'}
        </button>
      </div>
      <p className="text-gray-500 text-xs line-clamp-2 mb-2">
        {note.content || 'Empty note'}
      </p>
      <p className="text-gray-600 text-xs">
        {new Date(note.updatedAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })}
      </p>
    </div>
  )
}

// ─── Note editor ─────────────────────────────────────

function NoteEditor({ note }: { note: Note }) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isPreview, setIsPreview] = useState(false)
  const updateNote = useUpdateNote()

  // Reset when note changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.id])

  // Auto-save after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        updateNote.mutate({ id: note.id, data: { title, content } })
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, content])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-gray-600"
          placeholder="Note title..."
        />
        <div className="flex items-center gap-2 ml-4">
          {updateNote.isPending && (
            <span className="text-gray-500 text-xs">Saving...</span>
          )}
          {updateNote.isSuccess && (
            <span className="text-green-500 text-xs">Saved</span>
          )}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              isPreview
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div className="flex-1 overflow-auto prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start writing... (Markdown supported)"
          className="flex-1 bg-transparent text-gray-300 text-sm leading-relaxed outline-none resize-none placeholder-gray-600"
        />
      )}
    </div>
  )
}

// ─── Create notebook modal ───────────────────────────

const NOTEBOOK_COLORS = [
  '#7c6af7', '#4ade80', '#fbbf24', '#f87171', '#2dd4bf', '#f472b6',
]
const NOTEBOOK_EMOJIS = ['📓', '⚛️', '🛠️', '🗄️', '💡', '🎯', '📐', '🔬']

function CreateNotebookModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📓')
  const [color, setColor] = useState('#7c6af7')
  const createNotebook = useCreateNotebook()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createNotebook.mutate(
      { name, emoji, color },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold text-lg mb-6">
          Create notebook
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. React Notes"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Emoji
            </label>
            <div className="flex gap-2 flex-wrap">
              {NOTEBOOK_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-lg text-xl transition-all ${
                    emoji === e
                      ? 'bg-violet-600/30 ring-2 ring-violet-500'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Color
            </label>
            <div className="flex gap-3">
              {NOTEBOOK_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg py-2.5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNotebook.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              {createNotebook.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Notes page ──────────────────────────────────────

export default function NotesPage() {
  const [selectedNotebook, setSelectedNotebook] =
    useState<Notebook | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [search, setSearch] = useState('')
  const [showNotebookModal, setShowNotebookModal] = useState(false)

  const { data: notebooks, isLoading: notebooksLoading, refetch } = useNotebooks()
 
  const { data: notes } = useNotes(selectedNotebook?.id ?? null)
  const { data: searchResults } = useSearchNotes(search)
  const createNote = useCreateNote()
  const toggleStar = useToggleStar()

  // Auto-select first notebook
  useEffect(() => {
    if (notebooks && notebooks.length > 0 && !selectedNotebook) {
      setSelectedNotebook(notebooks[0])
    }
  }, [notebooks])

  // Auto-select first note when notebook changes
  useEffect(() => {
    if (notes && notes.length > 0) {
      setSelectedNote(notes[0])
    } else {
      setSelectedNote(null)
    }
  }, [notes, selectedNotebook])

  const handleCreateNote = () => {
    if (!selectedNotebook) return
    createNote.mutate(
      {
        notebookId: selectedNotebook.id,
        title: 'Untitled note',
        content: '',
      },
      {
        onSuccess: data => setSelectedNote(data.data),
      }
    )
  }

  const displayedNotes = search.length > 1 ? searchResults : notes

  if (notebooksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading notebooks...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8">

      {/* Notebooks sidebar */}
      <div className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-white text-sm font-semibold">Notebooks</span>
          <button
            onClick={() => setShowNotebookModal(true)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notebooks?.length === 0 && (
            <p className="text-gray-500 text-xs px-3 py-4 text-center">
              No notebooks yet
            </p>
          )}
          {notebooks?.map(nb => (
            <NotebookItem
              key={nb.id}
              notebook={nb}
              isActive={selectedNotebook?.id === nb.id}
              onClick={() => {
                setSelectedNotebook(nb)
                setSearch('')
              }}
            />
          ))}
        </div>
      </div>

      {/* Notes list */}
      <div className="w-64 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-semibold">
              {search.length > 1
                ? 'Search results'
                : selectedNotebook?.name ?? 'Notes'}
            </span>
            {selectedNotebook && (
              <button
                onClick={handleCreateNote}
                className="text-gray-400 hover:text-white text-lg leading-none"
              >
                +
              </button>
            )}
          </div>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {displayedNotes?.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-8">
              {search.length > 1 ? 'No results found' : 'No notes yet'}
            </p>
          )}
          {displayedNotes?.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isActive={selectedNote?.id === note.id}
              onClick={() => setSelectedNote(note)}
              onStar={e => {
                e.stopPropagation()
                toggleStar.mutate(note.id)
              }}
            />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden p-8">
        {selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 mb-4">
              {selectedNotebook
                ? 'No note selected'
                : 'Select a notebook to get started'}
            </p>
            {selectedNotebook && (
              <button
                onClick={handleCreateNote}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Create first note
              </button>
            )}
          </div>
        )}
      </div>

      {showNotebookModal && (
        <CreateNotebookModal onClose={() => setShowNotebookModal(false)} />
      )}
    </div>
  )
}