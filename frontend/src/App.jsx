import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import EventListPage from "./pages/EventListPage";
import CreateEventPage from "./pages/CreateEventPage";
import ResourceAllocationPage from "./pages/ResourceAllocationPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route path="/resources" element={<ResourceAllocationPage />} />
        <Route path="/registrations" element={<RegistrationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
