# HabitVault

![Demo](./public/Habitvault.gif)

A full-stack personal productivity app combining habit tracking and note-taking, built from scratch as a deep-dive into full-stack TypeScript development.

The frontend is inspired by Loop Habit Tracker; the notes system draws from Notion and Obsidian. This was my first full-stack TypeScript project, coming from a background in IT operations and sysadmin work.

---

## Features

**Habit Tracking**

- Create, edit, and delete habits with custom colour and frequency (daily/weekly)
- Daily check-ins with a unique constraint preventing duplicate check-ins per habit per day
- Streak calculation as a pure function counting consecutive days
- Dashboard with habit rings, streak banner, activity heatmap, and stat cards
- Progress page with Recharts bar charts and per-habit completion stats (aggregated server-side with Prisma `groupBy`)
- Calendar view showing monthly check-in history with click-to-expand day detail

**Notes & Notebooks**

- Three-panel layout: notebooks → notes list → markdown editor
- Markdown editor with live preview
- Search across notes, star/unstar, and deletion

**Authentication & Accounts**

- Registration and login with JWT auth
- Passwords hashed with bcrypt (12 salt rounds)
- Short-lived access token (15 min) in the Authorization header + long-lived refresh token (7 days) in an httpOnly cookie (XSS-protected)
- Axios interceptors auto-attach the token and silently refresh it on expiry
- Protected routes on both client and server; ownership verified server-side on every mutation
- Profile page with editable name and account stats

---

## Tech Stack

**Frontend (`client/`)**

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- TanStack Query (server state, caching, optimistic updates)
- React Router v6 (protected routes via `Outlet`)
- Recharts (data visualisation)

**Backend (`server/`)**

- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- JWT (access + refresh tokens)
- bcrypt (password hashing)

---

## Architecture

The backend follows a layered REST structure, with each request flowing through clearly separated responsibilities:

```
route → middleware → controller → service → database
```

- **Routes** define the endpoints and wire up middleware
- **Middleware** verifies the JWT signature and attaches the authenticated user to the request
- **Controllers** handle the HTTP layer (parsing requests, sending responses)
- **Services** hold the business logic and talk to the database via Prisma
- **Prisma** acts as the typed translator between TypeScript and SQL, with `schema.prisma` as the single source of truth

### Database schema

Five related tables:

| Table      | Purpose               | Key details                                                                  |
| ---------- | --------------------- | ---------------------------------------------------------------------------- |
| `User`     | Accounts              | bcrypt-hashed passwords; cascade-deletes all owned data                      |
| `Habit`    | Belongs to a user     | name, colour, frequency                                                      |
| `CheckIn`  | One per habit per day | `@@unique([habitId, date])` constraint; `@db.Date` (date only, no timestamp) |
| `Notebook` | Belongs to a user     | organises notes by topic                                                     |
| `Note`     | Belongs to a notebook | markdown content                                                             |

Notable schema decisions:

- **`cuid()` IDs** instead of auto-increment integers — random and safe to expose in URLs
- **`onDelete: Cascade`** — deleting a user cleanly removes all their habits, notes, and check-ins
- **`@@unique([habitId, date])`** — the database itself rejects duplicate check-ins, as a last line of defence behind the application logic
- **`@db.Date`** on check-ins — stores the day only, which keeps streak comparisons clean and avoids timezone-sensitive timestamp bugs

---

## Project Structure

```
habitvault/
├── client/                         # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── providers.tsx
│   │   │   └── Router.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── AppLayout.tsx
│   │   │   └── ui/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── habits/
│   │   │   │   ├── CalendarPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── HabitsPage.tsx
│   │   │   │   ├── ProgressPage.tsx
│   │   │   │   └── useHabits.ts
│   │   │   └── notes/
│   │   │       ├── NotesPage.tsx
│   │   │       └── useNotes.ts
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
│
└── server/                         # Backend (Express + TypeScript + Prisma)
    ├── prisma/
    │   ├── migrations/
    │   └── schema.prisma
    └── src/
        ├── controllers/
        │   ├── auth.controller.ts
        │   ├── habit.controller.ts
        │   └── note.controller.ts
        ├── lib/
        │   └── prisma.ts
        ├── middleware/
        │   └── auth.middleware.ts
        ├── routes/
        │   ├── auth.routes.ts
        │   ├── habit.routes.ts
        │   └── note.routes.ts
        ├── services/
        │   ├── auth.service.ts
        │   ├── habit.service.ts
        │   └── note.service.ts
        ├── types/
        │   └── index.ts
        ├── utils/
        └── server.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a hosted instance)

### 1. Clone the repo

```bash
git clone https://github.com/Clevert3ch/habitvault.git
cd habitvault
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://habitvault:habitvault_dev@localhost:5432/habitvault"
JWT_ACCESS_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
PORT=3000
```

Run the migration and start the server:

```bash
npx prisma migrate dev
npm run dev
```

Inspect the database any time with Prisma Studio:

```bash
npx prisma studio   # opens at http://localhost:5555
```

### 3. Frontend setup

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Key Learnings

This was my first full-stack TypeScript project, built coming from a sysadmin/IT operations background. Concepts worked through:

- Designing a relational schema in Prisma with relationships, cascade deletes, and database-level constraints
- The full JWT auth flow — access vs. refresh tokens, why the refresh token belongs in an httpOnly cookie, and silent token refresh via Axios interceptors
- Layered backend architecture (route → middleware → controller → service)
- Server-side ownership checks — never trusting the client for authorization
- TanStack Query for server state, caching, and optimistic UI updates
- React Router v6 protected routes with an AuthContext
- Sharing TypeScript types across both the Express API and React components

### Debugging war stories

A few bugs that taught the most:

- **Timezone check-in bug** — check-ins saved as the previous day because `setHours(0,0,0,0)` used local time (UTC+2) while PostgreSQL's `@db.Date` stored UTC. Fixed by switching to `setUTCHours(0,0,0,0)`.
- **Auth race condition** — TanStack Query fired the habits query before the JWT was saved to localStorage after login. Fixed with the `enabled: !!user` option.
- **Silent notebook fetch failure** — a `useNotebooks` hook returned the raw query-options object instead of calling `useQuery({...})`, so notebooks never fetched.

---

## Roadmap / Not Yet Implemented

- Registration confirmation email + password reset flow
- Mobile-responsive layout
- Automated tests (the `calculateStreak` pure function is the natural first target)
- Deployment (currently runs locally)

---
