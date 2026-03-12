import { useEffect, useState } from "react";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { listEvents } from "../lib/api";

export default function RegistrationsPage() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const all = await listEvents(token);
        const registered = (all || []).filter((event) => (event.participantIds || []).includes(user?.id));
        setEvents(registered);
      } catch (err) {
        setError(err.message || "Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, token]);

  return (
    <section>
      <SectionHeader
        title="My Registrations"
        subtitle="Track events where your account is registered as a participant."
      />
      {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <GlassPanel className="p-5 lg:col-span-3">
          {loading ? <p className="subtle-text">Loading registrations...</p> : null}

          {!loading && !events.length ? <p className="subtle-text">You have not registered for any published events yet.</p> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{new Date(event.eventDate).toLocaleString()} • {event.location}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="status-chip bg-emerald-100 text-emerald-700">Registered</span>
                  <span className="text-xs text-slate-500">{event.participantIds?.length || 0} total participants</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 lg:col-span-1">
          <p className="font-heading text-2xl text-slate-900">Attendance Tools</p>
          <p className="mt-2 text-sm text-slate-600">Placeholder actions for next phase integration.</p>
          <div className="mt-4 space-y-2">
            <NeonButton className="w-full" variant="secondary">Generate Pass</NeonButton>
            <NeonButton className="w-full" variant="secondary">
              Sync Calendar
            </NeonButton>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
