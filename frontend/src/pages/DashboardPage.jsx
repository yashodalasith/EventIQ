import { useEffect, useMemo, useState } from "react";
import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";
import StatCard from "../components/common/StatCard";
import { useAuth } from "../context/AuthContext";
import { listEvents, listMyEvents } from "../lib/api";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [all, mine] = await Promise.all([
          listEvents(token),
          user?.role === "organizer" || user?.role === "admin" ? listMyEvents(token) : Promise.resolve([])
        ]);
        setEvents(all || []);
        setMyEvents(mine || []);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      }
    };

    load();
  }, [token, user?.role]);

  const metrics = useMemo(() => {
    const published = events.filter((event) => event.status === "PUBLISHED").length;
    const draft = events.filter((event) => event.status !== "PUBLISHED").length;
    const registrations = events.reduce((sum, event) => sum + (event.participantIds?.length || 0), 0);
    const upcoming = events.filter((event) => new Date(event.eventDate) > new Date()).length;

    return { published, draft, registrations, upcoming };
  }, [events]);

  return (
    <section>
      <SectionHeader
        title="Operations Dashboard"
        subtitle="Track event lifecycle, registrations, and organizer workload in one place."
      />

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published Events" value={metrics.published} trend={`${metrics.upcoming} upcoming`} />
        <StatCard label="Draft Events" value={metrics.draft} trend="Pending publication" />
        <StatCard label="Total Registrations" value={metrics.registrations} trend="Across all events" />
        <StatCard label="My Events" value={myEvents.length} trend={user?.role === "participant" ? "Organizer role required" : "Owned by your account"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GlassPanel className="p-5">
          <h2 className="font-heading text-2xl text-slate-900">Upcoming Events</h2>
          <div className="mt-4 space-y-2">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <span className={`status-chip ${event.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {event.status || "DRAFT"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{new Date(event.eventDate).toLocaleString()} • {event.location}</p>
              </div>
            ))}

            {!events.length ? <p className="subtle-text">No events available yet.</p> : null}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="font-heading text-2xl text-slate-900">My Organizer Events</h2>
          <div className="mt-4 space-y-2">
            {myEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{event.participantIds?.length || 0} participants • capacity {event.capacity}</p>
              </div>
            ))}

            {!myEvents.length ? (
              <p className="subtle-text">
                {user?.role === "organizer" || user?.role === "admin"
                  ? "No organizer events yet. Create your first event."
                  : "Switch to organizer role to view owned events."}
              </p>
            ) : null}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
