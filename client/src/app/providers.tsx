import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/AuthContext'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, 
            staleTime: 1000 * 60 * 6,  //5 min
        },
    },
})

export function Providers({children}: {children: ReactNode}) {

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    )
}