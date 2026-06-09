import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export default function ProtectedRoute() {
    const { user, isLoading} = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
        )
    }
    if(!user) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}