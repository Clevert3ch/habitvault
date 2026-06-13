import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notebooksApi, notesApi } from '../../services/api'
import { useAuth } from '../auth/AuthContext'
import type { Notebook, Note } from '../../types'



// notebooks
export function useNotebooks(){
  const { user } = useAuth()
  console.log('useNotebooks - user:', user)
  return useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const res = await notebooksApi.getAll()
      
      return res.data as Notebook[]
    },
    enabled: !!user,
  })
}

export function useCreateNotebook(){
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string; emoji?: string; color?: string }) =>
      notebooksApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notebooks'] }),
    })
}


// notes

export function useNotes(notebookId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notes', notebookId],
    queryFn: async () => {
      const res = await notesApi.getByNotebook(notebookId!)
      return res.data as Note[]
    },
    enabled: !!user && !!notebookId,
  })
}

export function useSearchNotes(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notes', 'search', query],
    queryFn: async () => {
      const res = await notesApi.search(query)
      return res.data as Note[]
    },
    enabled: !!user && query.length > 1,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      notebookId: string
      title: string
      content?: string
    }) => notesApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notes', variables.notebookId],
      })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { title?: string; content?: string }
    }) => notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useToggleStar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notesApi.toggleStar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}