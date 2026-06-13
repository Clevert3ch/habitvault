import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useHabitStats } from './useHabits'


// Stat Card 

function StatCard({
    label,
    value,
    sub,
    color,
}: {
    label: string
    value: string | number
    sub?: string
    color: string
}) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
        {label}
      </p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
    )
}


function CustomTooltip({active, payload, label} : any) {
    if (!active || !payload?.length) return null

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-medium">
        {payload[0].value}% complete
      </p>
      <p className="text-gray-400 text-xs">
        {payload[0].payload.completed} / {payload[0].payload.total} habits
      </p>
    </div>
    )
}


// Progress page

export default function ProgressPage(){
    const {data: stats, isLoading} = useHabitStats()

    if(isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading stats...</p>
      </div>
        )
    }
    
    if(!stats || stats.habits.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">
          No habits yet — create some to see your progress.
        </p>
      </div>
        )
    }

    return (
        <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Progress</h1>
        <p className="text-gray-400 text-sm mt-1">
          Your habit stats over the last 30 days
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total check-ins"
          value={stats.totalCheckIns}
          sub="all time"
          color="text-violet-400"
        />
        <StatCard
          label="Perfect days"
          value={stats.perfectDays}
          sub="last 30 days"
          color="text-green-400"
        />
        <StatCard
          label="Active habits"
          value={stats.habits.length}
          color="text-amber-400"
        />
        <StatCard
          label="This week"
          value={`${stats.dailyCompletions.slice(-1)[0]?.percentage ?? 0}%`}
          sub="today's completion"
          color="text-teal-400"
        />
      </div>

      {/* Bar chart — last 7 days */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-6">
          Last 7 days completion
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={stats.dailyCompletions}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1f2937"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
            <Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {stats.dailyCompletions.map((_: any, i: number) => (
                <Cell
                  key={i}
                  fill={i === stats.dailyCompletions.length - 1
                    ? '#7c6af7'
                    : '#4c1d95'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per habit completion rates */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-6">
          Per habit — last 30 days
        </h2>
        <div className="space-y-4">
          {stats.perHabitStats.map((h: any) => (
            <div key={h.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: h.color }}
                  />
                  <span className="text-white text-sm">{h.name}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {h.completions} days · {h.rate}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${h.rate}%`,
                    background: h.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    )
}