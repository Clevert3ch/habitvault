import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useHabits, useCheckIn, useUndoCheckIn, useCreateHabit } from './useHabits'
import type { Habit } from '../../types'


// Habit ring component

function HabitRing({ habit }: { habit: Habit }) {
  const checkIn = useCheckIn()
  const undoCheckIn = useUndoCheckIn()

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = habit.isCheckedToday ? 1 : 0
  const offset = circumference - progress * circumference

  const handleClick = () => {
    if (habit.isCheckedToday) {
      undoCheckIn.mutate(habit.id)
    } else {
      checkIn.mutate(habit.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-gray-900 border rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 ${
        habit.isCheckedToday
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Ring */}
      <div className="relative w-16 h-16">
        <svg
          className="-rotate-90"
          width="64"
          height="64"
          viewBox="0 0 64 64"
        >
          {/* Track */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={habit.isCheckedToday ? '#4ade80' : habit.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {habit.isCheckedToday ? '✓' : '○'}
        </div>
      </div>

      <div className="text-center">
        <p className="text-white text-xs font-medium">{habit.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">🔥 {habit.streak}d</p>
      </div>
    </div>
  )
}

//Create habit modal 

const COLORS = [
  '#7c6af7', '#4ade80', '#fbbf24',
  '#f87171', '#2dd4bf', '#f472b6',
]

function CreateHabitModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#7c6af7')
  const createHabit = useCreateHabit()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createHabit.mutate(
      { name, color },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold text-lg mb-6">Create new habit</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Habit name
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Read 30 minutes"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Color
            </label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'
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
              disabled={createHabit.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              {createHabit.isPending ? 'Creating...' : 'Create habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Statcard

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// Dashboard page 
export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: habits, isLoading, isError } = useHabits()
  const [showModal, setShowModal] = useState(false)

  //wait for auth to resolve before rendiring anything.
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const completedToday = habits?.filter(h => h.isCheckedToday).length ?? 0
  const totalHabits = habits?.length ?? 0
  const bestStreak = habits
    ? Math.max(...habits.map(h => h.streak), 0)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading your habits...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Failed to load habits. Try refreshing.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New habit
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active habits"
          value={totalHabits}
          color="text-violet-400"
        />
        <StatCard
          label="Done today"
          value={`${completedToday} / ${totalHabits}`}
          color="text-green-400"
        />
        <StatCard
          label="Best streak"
          value={`${bestStreak}d`}
          color="text-amber-400"
        />
      </div>

      {/* Today's habits */}
      <div className="mb-6">
        <h2 className="text-white font-semibold mb-4">Today's habits</h2>

        {habits?.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No habits yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {habits?.map(habit => (
              <HabitRing key={habit.id} habit={habit} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateHabitModal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}