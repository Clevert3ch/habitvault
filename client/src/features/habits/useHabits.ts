import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from '../../services/api'
import { useAuth } from '../auth/AuthContext'
import type { Habit } from '../../types'

//fetch all habits 

export function useHabits() {
    const {user} = useAuth()
    
    return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await habitsApi.getAll()
      return res.data as Habit[]
    },
    enabled: !!user,
  })
}

// Create habit 

export function useCreateHabit() {
    const queryClient = useQueryClient()

    return useMutation({
    mutationFn: (data: { name: string; color?: string; frequency?: string }) =>
      habitsApi.create(data),

    onSuccess: () => {
      // Invalidate the habits cache so the list refetches automatically
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })
}


//Check in

export function useCheckIn() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (habitId:string) => habitsApi.checkIn(habitId),
        // Optimistic update — mark as done instantly, before the server responds
        onMutate: async (habitId: string) => {
            //cancels any outgoing refechets so that they dont mutate our update
            await queryClient.cancelQueries({queryKey: ['habits']})

            //snapshot current data incase of roll back
            const previous = queryClient.getQueryData<Habit[]>(['habits'])

            //optimistically update the cache 
            queryClient.setQueryData<Habit[]>(['habits'], old => 
                old?.map(h => 
                    h.id === habitId
                    ? {...h, isCheckedToday : true, streak: h.streak + 1}
                    : h
                )
            )

            return { previous }
        },

        //if the server return an error, roll back to previous state
        onError: (_err, _habitId, context) => {
            queryClient.setQueryData(['habits'], context?.previous)
        },

        // always refetch after success or error to sync with server
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['habits']})
        },
    })
}

//undo check in


export function useUndoCheckIn () {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (habitId: string) => habitsApi.undoCheckIn(habitId),
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['habits']})
        }
    })
}

// why the optimistic updates? so that it doesnt have to wait on the ser res before  UI updates. 


export function useHabitStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['habitStats'],
    queryFn: async () => {
      const res = await habitsApi.stats()
      return res.data
    },
    enabled: !!user,
  })
}