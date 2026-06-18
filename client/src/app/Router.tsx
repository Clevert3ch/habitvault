import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import DashboardPage from "../features/habits/DashboardPage";
import NotesPage from "../features/notes/NotesPage";
import HabitsPage from "../features/habits/HabitsPage";
import ProgressPage from "../features/habits/ProgressPage";
import CalendarPage from "../features/habits/CalendarPage";
import ProfilePage from "../features/auth/ProfilePage";

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">{page} coming soon</p>
    </div>
  );
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="notebooks" element={<ComingSoon page="Notebooks" />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
