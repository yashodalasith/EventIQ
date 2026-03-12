import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./layout/AppShell";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import EventListPage from "./pages/EventListPage";
import CreateEventPage from "./pages/CreateEventPage";
import ResourceAllocationPage from "./pages/ResourceAllocationPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (BYPASS_AUTH) {
    return children;
  }

  if (loading) {
    return (
      <div className="page-wrap text-sm text-slate-500">Loading session...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const canAccessPrivate = BYPASS_AUTH || isAuthenticated;

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          canAccessPrivate ? <Navigate to="/dashboard" replace /> : <AuthPage />
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route path="/resources" element={<ResourceAllocationPage />} />
        <Route path="/registrations" element={<RegistrationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="*"
        element={
          <Navigate to={canAccessPrivate ? "/dashboard" : "/auth"} replace />
        }
      />
    </Routes>
  );
}
