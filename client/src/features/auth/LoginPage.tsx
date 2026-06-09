import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {login} = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setIsLoading(true)

  try {
    await login(email, password)
    // Small delay to ensure localStorage is set before navigation
    setTimeout(() => navigate('/app/dashboard'), 50)
  } catch {
    setError('Invalid email or password')
  } finally {
    setIsLoading(false)
  }
}
   return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-xl">
            📚
          </div>
          <span className="text-white font-bold text-xl">HabitVault</span>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">
            Sign in to your personal learning vault
          </p>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            No account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300">
              Create one
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}