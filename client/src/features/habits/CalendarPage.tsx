import { useState } from "react";
import { useCalendar } from "./useHabits";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 }; // month 1-12
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStr = `${current.year}-${String(current.month).padStart(2, "0")}`;
  const { data, isLoading } = useCalendar(monthStr);

  // build the calendar grid
  const firstDay = new Date(current.year, current.month - 1, 1);
  const daysInMonth = new Date(current.year, current.month, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0 = sunday

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    setCurrent((c) => {
      if (c.month === 1) return { year: c.year - 1, month: 12 };
      return { year: c.year, month: c.month - 1 };
    });
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrent((c) => {
      if (c.month === 12) return { year: c.year + 1, month: 1 };
      return { year: c.year, month: c.month + 1 };
    });
    setSelectedDay(null);
  };

  //Build array of cells - null for padding, then day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const getDayStatus = (day: number) => {
    const key = `${current.year}-${String(current.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return data?.days[key];
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Calendar</h1>
          <p className="text-gray-400 text-sm mt-1">
            Your daily check-in history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            ‹
          </button>
          <span className="text-white font-medium text-sm min-w-[140px] text-center">
            {MONTHS[current.month - 1]} {current.year}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded bg-green-500/20" /> All done
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded bg-violet-500/20" /> Partial
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded bg-gray-800" /> Missed
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-4xl">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-gray-500 font-medium py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-2">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`pad-${i}`} />;
                }

                const key = `${current.year}-${String(current.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const status = getDayStatus(day);
                const isToday = key === todayStr;
                const isSelected = key === selectedDay;

                let bg = "bg-gray-800 text-gray-500";
                if (status?.status === "full")
                  bg = "bg-green-500/20 text-green-400";
                else if (status?.status === "partial")
                  bg = "bg-violet-500/15 text-violet-300";
                if (isToday) bg = "bg-violet-600 text-white font-bold";

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all hover:scale-105 ${bg} ${
                      isSelected ? "ring-2 ring-white" : ""
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-4">
          <h3 className="text-white font-medium mb-2">
            {new Date(selectedDay).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <p className="text-gray-400 text-sm">
            {data?.days[selectedDay]
              ? `${data.days[selectedDay].count} of ${data.habitCount} habits completed`
              : "No check-ins this day"}
          </p>
        </div>
      )}
    </div>
  );
}
