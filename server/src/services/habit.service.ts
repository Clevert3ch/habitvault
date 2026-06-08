import { MockPropertyContext } from 'node:test'
import { prisma } from '../lib/prisma'

// ---- types ---- 
interface CreateHabitInput {
    name: string
    color?: string
    frequency?: 'DAILY' | 'WEEKLY' | 'CUSTOM'
}

interface UpdateHabitInput {
    name?: string
    color?: string
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
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Add computed fields to each habit
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return habits.map(habit => ({
    ...habit,
    isCheckedToday: habit.checkIns.some(
      c => new Date(c.date).toDateString() === today.toDateString()
    ),
    streak: calculateStreak(habit.checkIns.map(c => c.date)),
  }))
}


//----- Create a habit -------------

export async function createHabit(userId: string, input: CreateHabitInput) {
  return prisma.habit.create({
    data: {
      userId,
      name: input.name,
      color: input.color ?? '#7c6af7',
      frequency: input.frequency ?? 'DAILY',
    },
  })
}

//----- Update a habit -------

export async function updateHabit(
    habitId: string,
    userId: string,
    input: UpdateHabitInput
) {
    // First verify this habit belongs to this user
    // Never trust the client — always check ownership
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId}
    })

    if (!habit) {
        throw new Error('HABIT_NOT_FOUND')
    }

    return prisma.habit.update({
        where: { id: habitId},
        data: input,
    })
}


//---- Archive a habit ------

export async function archiveHabit(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
         where: { id: habitId, userId }, 
    })

    if (!habit) {
      throw new Error('HABIT_NOT_FOUND')
    }

    // we archive instead of delete to preserve checkin history
    return prisma.habit.update({
        where: { id: habitId },
        data: { isArchived: true }, 
    })
}

// -----checkins----------

export async function checkInHabit(habitId:string, userId: string) {
     //verify ownership 
     const habit = await prisma.habit.findFirst({
        where:{ id: habitId, userId}
     })

    if (!habit) {
    throw new Error('HABIT_NOT_FOUND')
  }
  const today = new Date()
  today.setHours(0,0,0,0)

  // the @@unique ([habitId, date] ) in our scheme prevents duplicates at the database level, but we give a friendlier error here
 
  const existing = await prisma.checkIn.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  })
  if ( existing ) {
    throw new Error('ALREADY_CHECKED_IN')
  }

  return prisma.checkIn.create({
    data: {
      habitId,
      userId,
      date: today,
    },
  })
}

// -------undo check in --------

export async function undoCheckIn(habitId: string, userId: string) {
     const today = new Date()
     today.setHours(0,0,0,0)

     const checkIn = await prisma.checkIn.findUnique({
        where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
     })

     if(!checkIn || checkIn.userId !== userId){
        throw new Error('CHECKIN_NOT_FOUND')
     }

     return prisma.checkIn.delete({
        where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
     })
}


//-------Streak calculation -----------

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  // Normalize all dates to YYYY-MM-DD strings
  const normalized = dates
    .map(d => new Date(d).toISOString().split('T')[0])
    .sort()
    .reverse() // most recent first

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split('T')[0]

    // streak is only active if you checked in today or yesterday

    if(normalized[0] !== today && normalized[0] !== yesterday) return 0

    let streak = 1
    for (let i = 1; i < normalized.length; i++){
        const prev = new Date(normalized[i - 1])
        const curr = new Date(normalized[i])
        const diffDays =
        (prev.getTime() - curr.getTime()) / (1000* 60 * 60 * 24)

        if(diffDays === 1) {
            streak ++
        }else {
            break
        }
    }

    return streak

}