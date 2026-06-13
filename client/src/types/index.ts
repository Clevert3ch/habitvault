export interface User{
    id: string
    email: string
    name: string
    createdAt: string
}

export interface Habit {
    id: string
    userId: string
    name: string
    color: string
    frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM'
    isArchived: boolean
    createdAt: string
    isCheckedToday: boolean
    streak: number
    checkIns: CheckIn[]
}

export interface CheckIn {
id: string
habitId: string
userId: string
date: string
createdAt: string
}

export interface AuthResponse{
    user: User 
    accessToken: string
}

export interface Notebook {
    id: string
    userId: string
    name: string
    emoji: string
    color: string
    createdAt: string
    updatedAt: string
    _count?: { notes: number }
}

export interface Note {
    id: string
    userId: string
    notebookId: string
    title: string
    content: string
    isStarred: boolean
    createdAt: string
    updatedAt: string
    notebook?: { name: string; emoji: string }
}