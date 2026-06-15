import React, { useState } from "react";
import {
  useHabits,
  useCheckIn,
  useUndoCheckIn,
  useCreateHabit,
  useArchiveHabit,
} from "./useHabits";
import type { Habit } from "../../types";

// frequency badge

function FrequencyBadge({ frequency }: { frequency: string }) {
  const styles: Record<string, string> = {
    DAILY: "bg-violet-500/10 text-violet-300",
    WEEKLY: "bg-amber-500/10 text-amber-300",
    CUSTOM: "bg-teal-500/10 text-teal-300",
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[frequency]}`}
    >
      {frequency.charAt(0) + frequency.slice(1).toLowerCase()}
    </span>
  );
}

// Mini Bar Chart

function MiniChart({ habit }: { habit: Habit }) {
  // Build last 7 days — true if checked in, false if not
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    return habit.checkIns.some(
      (c) => new Date(c.date).toDateString() === day.toDateString(),
    );
  });

  return (
    <div className="flex items-end gap-1">
      {last7.map((done, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm transition-all"
          style={{
            height: done ? "20px" : "8px",
            background: done ? habit.color : "#374151",
          }}
        />
      ))}
    </div>
  );
}

// Habit Row
function HabitRow({ habit }: { habit: Habit }) {
  const checkIn = useCheckIn();
  const undoCheckIn = useUndoCheckIn();
  const archiveHabit = useArchiveHabit();

  const handleToggle = () => {
    if (habit.isCheckedToday) {
      undoCheckIn.mutate(habit.id);
    } else {
      checkIn.mutate(habit.id);
    }
  };

  const handleDelete = () => {
    if (
      confirm(`Delete "${habit.name}"? Your check-in history is preserved.`)
    ) {
      archiveHabit.mutate(habit.id);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-colors group">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: habit.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-white font-medium text-sm">{habit.name}</h3>
          <FrequencyBadge frequency={habit.frequency} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs">
            🔥 {habit.streak} day streak
          </span>
          <MiniChart habit={habit} />
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={checkIn.isPending || undoCheckIn.isPending}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          habit.isCheckedToday
            ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
            : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-violet-500 hover:text-violet-300"
        }`}
      >
        {habit.isCheckedToday ? "✓ Done" : "+ Check in"}
      </button>

      <button
        onClick={handleDelete}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-all"
      >
        ✕
      </button>
    </div>
  );
}

//create habit modal

const COLORS = [
  "#7c6af7",
  "#4ade80",
  "#fbbf24",
  "#f87171",
  "#2dd4bf",
  "#f472b6",
];
function CreateHabitModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7c6af7");
  const [frequency, setFrequency] = useState("DAILY");
  const createHabit = useCreateHabit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createHabit.mutate(
      { name, color, frequency },
      { onSuccess: () => onClose() },
    );
  };
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
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 30 minutes"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Frequency
            </label>
            <div className="flex gap-2">
              {["DAILY", "WEEKLY", "CUSTOM"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    frequency === f
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Color
            </label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c
                      ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                      : "hover:scale-110"
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
              {createHabit.isPending ? "Creating..." : "Create habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// habits page

type Filter = "all" | "today" | "done" | "weekly";

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const filteredHabits = habits?.filter((h) => {
    if (filter === "done") return h.isCheckedToday;
    if (filter === "today") return !h.isCheckedToday;
    if (filter === "weekly") return h.frequency === "WEEKLY";
    return true;
  });

  const doneCount = habits?.filter((h) => h.isCheckedToday).length ?? 0;
  const totalCount = habits?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading habits....</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">My Habits</h1>
          <p className="text-gray-400 text-sm mt-1">
            {doneCount} of {totalCount} done today
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New habit
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Today's progress</span>
            <span className="text-gray-400 text-xs">
              {Math.round((doneCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((doneCount / totalCount) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "all", label: "All" },
            { key: "today", label: "Pending" },
            { key: "done", label: "Done" },
            { key: "weekly", label: "Weekly" },
          ] as { key: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-violet-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Habit list */}
      {filteredHabits?.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">
            {filter === "all" ? "No habits yet." : "No habits in this filter."}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Create your first habit
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits?.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </div>
      )}

      {showModal && <CreateHabitModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
