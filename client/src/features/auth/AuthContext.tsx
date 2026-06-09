import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../types'
import { authApi } from '../../services/api'

// Global stat for who is logged in

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({children}: {children: ReactNode} ) {
    const [user,setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
     
    
    // On mount, check if there is a valid session
    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
        setIsLoading(false)  // no token, stop loading immediately
    return
        }

    // Try to get current user with existing token
    authApi.me()
    .then(res => setUser(res.data.user))
    .catch(() => localStorage.removeItem('accessToken'))
    .finally(() => setIsLoading(false))
    },[])

    //login
    const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    localStorage.setItem('accessToken', res.data.accessToken)
    setUser(res.data.user)
    }

    const register = async( name: string, email: string, password: string) => {
        const res = await authApi.register({name, email, password})
        localStorage.setItem('accessToken', res.data.accessToken)
        setUser(res.data.user)
    }

    const logout = async () => {
        await authApi.logout()
        localStorage.removeItem('accessToken')
        setUser(null)
    }

    return(
        <AuthContext.Provider value={{user, isLoading, login, register, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if(!ctx) throw new Error('useAuth must be inside AuthProvider')
        return ctx
}