import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { createEvent } from "../lib/api";

export default function CreateEventPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    capacity: 100,
    eventDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await createEvent(token, {
        title: form.title,
        description: form.description,
        location: form.location,
        capacity: Number(form.capacity),
        eventDate: new Date(form.eventDate).toISOString(),
      });
      navigate("/events");
    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <SectionHeader
        title="Create Event"
        subtitle="Create a new event in draft mode, then publish from the events page."
      />

      {user?.role !== "organizer" && user?.role !== "admin" ? (
        <GlassPanel className="p-5">
          <p className="text-sm text-slate-600">
            Only organizer or admin role can create events.
          </p>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <GlassPanel className="p-5 xl:col-span-2">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-600">
                  Title
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  className="focus-field"
                  placeholder="AI Workshop 2026"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-600">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  className="focus-field min-h-28"
                  placeholder="Describe the event goals, audience, and outcomes."
                  required
                  minLength={10}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  Location
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={onChange}
                  className="focus-field"
                  placeholder="Main Hall A"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  Capacity
                </label>
                <input
                  name="capacity"
                  value={form.capacity}
                  onChange={onChange}
                  className="focus-field"
                  type="number"
                  min={1}
                  max={100000}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-600">
                  Event Date
                </label>
                <input
                  name="eventDate"
                  value={form.eventDate}
                  onChange={onChange}
                  className="focus-field"
                  type="datetime-local"
                  required
                />
              </div>

              {error ? (
                <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="sm:col-span-2 flex gap-2">
                <NeonButton type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Event"}
                </NeonButton>
                <NeonButton
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/events")}
                >
                  Cancel
                </NeonButton>
              </div>
            </form>
          </GlassPanel>

          <GlassPanel className="p-5">
            <h2 className="font-heading text-2xl text-slate-900">
              Validation Rules
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Title: 3 to 120 characters</li>
              <li>Description: 10 to 2000 characters</li>
              <li>Location: 2 to 120 characters</li>
              <li>Capacity: 1 to 100000</li>
              <li>Date must be in the future</li>
            </ul>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              New events are created as DRAFT. Publish them later from the
              events list after review.
            </div>
          </GlassPanel>
        </div>
      )}
    </section>
  );
}
