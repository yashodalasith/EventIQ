import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { listEvents, publishEvent, registerForEvent } from "../lib/api";

export default function EventListPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listEvents(token);
      setEvents(data || []);
    } catch (err) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [token]);

  const filtered = useMemo(() => {
    return events
      .filter((event) => event.title?.toLowerCase().includes(search.toLowerCase()))
      .filter((event) => (statusFilter === "ALL" ? true : (event.status || "DRAFT") === statusFilter));
  }, [events, search, statusFilter]);

  const onRegister = async (eventId) => {
    setActionMessage("");
    try {
      await registerForEvent(token, eventId);
      setActionMessage("Registration successful");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  const onPublish = async (eventId) => {
    setActionMessage("");
    try {
      await publishEvent(token, eventId);
      setActionMessage("Event published successfully");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Publish failed");
    }
  };

  return (
    <section>
      <SectionHeader
        title="Events"
        subtitle="Browse all events and manage publication or registration workflows."
      />

      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {actionMessage ? <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</div> : null}

      <GlassPanel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">Event Directory</p>
          <div className="flex flex-wrap gap-2">
            <input
              className="focus-field min-w-44"
              placeholder="Search by title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="focus-field min-w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <NeonButton onClick={() => navigate("/events/create")}>Create Event</NeonButton>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? <div className="p-4 text-sm text-slate-500">Loading events...</div> : null}

          {!loading && !filtered.length ? <div className="p-4 text-sm text-slate-500">No events found for the selected filters.</div> : null}

          {!loading
            ? filtered.map((event) => {
                const isOwner = event.organizerId === user?.id;
                const canPublish = (user?.role === "admin" || isOwner) && event.status !== "PUBLISHED";
                const canRegister = event.status === "PUBLISHED";

                return (
                  <div key={event.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{event.title}</p>
                      <p className="subtle-text mt-1">{new Date(event.eventDate).toLocaleString()} • {event.location}</p>
                      <p className="subtle-text mt-1">
                        Capacity {event.capacity} • Registered {event.participantIds?.length || 0}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`status-chip ${event.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {event.status || "DRAFT"}
                      </span>

                      {canPublish ? (
                        <NeonButton variant="secondary" onClick={() => onPublish(event.id)}>
                          Publish
                        </NeonButton>
                      ) : null}

                      {canRegister ? (
                        <NeonButton onClick={() => onRegister(event.id)}>Register</NeonButton>
                      ) : null}
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </GlassPanel>
    </section>
  );
}
