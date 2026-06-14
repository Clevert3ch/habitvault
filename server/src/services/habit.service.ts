import { prisma } from "../lib/prisma";

// ---- types ----
interface CreateHabitInput {
  name: string;
  color?: string;
  frequency?: "DAILY" | "WEEKLY" | "CUSTOM";
}

interface UpdateHabitInput {
  name?: string;
  color?: string;
}

//----------- Get all habits for a user ----

export async function getUserHabits(userId: string) {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      checkIns: {
        // only fetch check-ins from the last 7 days
        // we need these to show the mini bar chart
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Add computed fields to each habit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return habits.map((habit) => ({
    ...habit,
    isCheckedToday: habit.checkIns.some(
      (c) => new Date(c.date).toDateString() === today.toDateString(),
    ),
    streak: calculateStreak(habit.checkIns.map((c) => c.date)),
  }));
}

//----- Create a habit -------------

export async function createHabit(userId: string, input: CreateHabitInput) {
  return prisma.habit.create({
    data: {
      userId,
      name: input.name,
      color: input.color ?? "#7c6af7",
      frequency: input.frequency ?? "DAILY",
    },
  });
}

//----- Update a habit -------

export async function updateHabit(
  habitId: string,
  userId: string,
  input: UpdateHabitInput,
) {
  // First verify this habit belongs to this user
  // Never trust the client — always check ownership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error("HABIT_NOT_FOUND");
  }

  return prisma.habit.update({
    where: { id: habitId },
    data: input,
  });
}

//---- Archive a habit ------

export async function archiveHabit(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error("HABIT_NOT_FOUND");
  }

  // we archive instead of delete to preserve checkin history
  return prisma.habit.update({
    where: { id: habitId },
    data: { isArchived: true },
  });
}

// -----checkins----------

export async function checkInHabit(habitId: string, userId: string) {
  //verify ownership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error("HABIT_NOT_FOUND");
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // the @@unique ([habitId, date] ) in our scheme prevents duplicates at the database level, but we give a friendlier error here

  const existing = await prisma.checkIn.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  });
  if (existing) {
    throw new Error("ALREADY_CHECKED_IN");
  }

  return prisma.checkIn.create({
    data: {
      habitId,
      userId,
      date: today,
    },
  });
}

// -------undo check in --------

export async function undoCheckIn(habitId: string, userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = await prisma.checkIn.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  });

  if (!checkIn || checkIn.userId !== userId) {
    throw new Error("CHECKIN_NOT_FOUND");
  }

  return prisma.checkIn.delete({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  });
}

//-------Streak calculation -----------

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Normalize all dates to YYYY-MM-DD strings
  const normalized = dates
    .map((d) => new Date(d).toISOString().split("T")[0])
    .sort()
    .reverse(); // most recent first

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // streak is only active if you checked in today or yesterday

  if (normalized[0] !== today && normalized[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < normalized.length; i++) {
    const prev = new Date(normalized[i - 1]);
    const curr = new Date(normalized[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Stat for progress page

export async function getProgressStats(userId: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  //last 7 days
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  //last 30 days

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  // get all habits for this user

  const habits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    select: { id: true, name: true, color: true },
  });

  const habitCount = habits.length;

  if (habitCount === 0) {
    return {
      habits,
      dailyCompletions: [],
      perHabitStats: [],
      totalCheckIns: 0,
      perfectDays: 0,
      currentStreak: 0,
    };
  }

  //get all check-ins in the last 30 days

  const checkIns = await prisma.checkIn.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    select: { habitId: true, date: true },
    orderBy: { date: "asc" },
  });

  //Group check-ins by date
  //Aggrevating data when SQL grouby is overkill :

  const byDate = checkIns.reduce<Record<string, number>>((acc, c) => {
    const key = new Date(c.date).toISOString().split("T")[0];
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  //build last 7 days completion data for the chart bar.
  const dailyCompletions = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - i));
    const key = day.toISOString().split("T")[0];
    const completed = byDate[key] ?? 0;
    return {
      date: day.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
      }),
      completed,
      total: habitCount,
      percentage: Math.round((completed / habitCount) * 100),
    };
  });

  // per habit completion rate over last 30 days
  const perHabitStats = habits.map((habit) => {
    const habitCheckIns = checkIns.filter((c) => c.habitId === habit.id);
    return {
      id: habit.id,
      name: habit.name,
      color: habit.color,
      completions: habitCheckIns.length,
      rate: Math.round((habitCheckIns.length / 30) * 100),
    };
  });
  //Perfect days -  days where ALL habits were completed
  const perfectDays = Object.values(byDate).filter(
    (count) => count >= habitCount,
  ).length;

  //total check-ins ever
  const totalCheckIns = await prisma.checkIn.count({
    where: { userId },
  });

  return {
    habits,
    dailyCompletions,
    perHabitStats,
    totalCheckIns,
    perfectDays,
    currentStreak: 0,
  };
}

//calendar data

export async function getCalendarData(
  userId: string,
  year: number,
  month: number, // 1-12
) {
  // build the date range for the requested month

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // day 0 of the month = last day of this month

  //coint active habits( the denominator for '' all done'' )
  const habitCount = await prisma.habit.count({
    where: { userId, isArchived: false },
  });

  // get all checkin in this month
  const checkIns = await prisma.checkIn.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { date: true },
  });

  // Group by day → count of check-ins per day
  const byDate = checkIns.reduce<Record<string, number>>((acc, c) => {
    const key = new Date(c.date).toISOString().split("T")[0];
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  // Build a status for each day: 'full' | 'partial' | 'none'
  const days: Record<string, { count: number; status: string }> = {};

  for (const [date, count] of Object.entries(byDate)) {
    let status = "none";
    if (habitCount > 0) {
      if (count >= habitCount) status = "full";
      else if (count > 0) status = "partial";
    }
    days[date] = { count, status };
  }

  return { days, habitCount };
}
