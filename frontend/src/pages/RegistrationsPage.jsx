import { useEffect, useState } from "react";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { listEvents } from "../lib/api";

const formatFileSafe = (value) =>
  String(value || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";

const formatIcsDate = (value) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

const escapeIcsText = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildPassHtml = (event, user) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${event.title} Pass</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; color: #0f172a; }
      .card { max-width: 720px; margin: 0 auto; background: white; border: 1px solid #cbd5e1; border-radius: 20px; overflow: hidden; }
      .hero { background: linear-gradient(135deg, #1d4ed8, #0f172a); color: white; padding: 28px; }
      .body { padding: 28px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
      .item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
      .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
      .value { margin-top: 6px; font-size: 16px; font-weight: 600; }
      .footer { margin-top: 24px; font-size: 13px; color: #475569; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="hero">
        <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">EventIQ Entry Pass</div>
        <h1 style="margin:12px 0 0;font-size:32px;">${event.title}</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Registered attendee: ${user?.name || user?.email || "Participant"}</p>
      </div>
      <div class="body">
        <div class="grid">
          <div class="item">
            <div class="label">Date & Time</div>
            <div class="value">${new Date(event.eventDate).toLocaleString()}</div>
          </div>
          <div class="item">
            <div class="label">Location</div>
            <div class="value">${event.location || "TBA"}</div>
          </div>
          <div class="item">
            <div class="label">Registration Status</div>
            <div class="value">Confirmed</div>
          </div>
          <div class="item">
            <div class="label">Event ID</div>
            <div class="value">${event.id}</div>
          </div>
        </div>
        <div class="footer">
          ${event.description || "Keep this pass available at check-in."}
        </div>
      </div>
    </div>
  </body>
</html>`;

const buildCalendarFile = (event) => {
  const startsAt = new Date(event.eventDate);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const now = formatIcsDate(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventIQ//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:eventiq-${event.id}@eventiq.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsDate(startsAt)}`,
    `DTEND:${formatIcsDate(endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description || "Registered via EventIQ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

export default function RegistrationsPage() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const all = await listEvents(token);
        const registered = (all || []).filter((event) =>
          (event.participantIds || []).includes(user?.id),
        );
        setEvents(registered);
      } catch (err) {
        setError(err.message || "Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, token]);

  const handleGeneratePass = (event) => {
    const fileName = `${formatFileSafe(event.title)}-pass.html`;
    downloadFile(
      fileName,
      buildPassHtml(event, user),
      "text/html;charset=utf-8",
    );
    setMessage(`Pass downloaded for ${event.title}`);
    setError("");
  };

  const handleSyncCalendar = (event) => {
    const fileName = `${formatFileSafe(event.title)}.ics`;
    downloadFile(
      fileName,
      buildCalendarFile(event),
      "text/calendar;charset=utf-8",
    );
    setMessage(`Calendar file downloaded for ${event.title}`);
    setError("");
  };

  return (
    <section>
      <SectionHeader
        title="My Registrations"
        subtitle="Track events where your account is registered as a participant."
      />
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <GlassPanel className="p-5 lg:col-span-3">
          {loading ? (
            <p className="subtle-text">Loading registrations...</p>
          ) : null}

          {!loading && !events.length ? (
            <p className="subtle-text">
              You have not registered for any published events yet.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(event.eventDate).toLocaleString()} •{" "}
                  {event.location}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="status-chip bg-emerald-100 text-emerald-700">
                    Registered
                  </span>
                  <span className="text-xs text-slate-500">
                    {event.participantIds?.length || 0} total participants
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <NeonButton
                    className="flex-1"
                    variant="secondary"
                    onClick={() => handleGeneratePass(event)}
                  >
                    Generate Pass
                  </NeonButton>
                  <NeonButton
                    className="flex-1"
                    variant="secondary"
                    onClick={() => handleSyncCalendar(event)}
                  >
                    Sync Calendar
                  </NeonButton>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 lg:col-span-1">
          <p className="font-heading text-2xl text-slate-900">
            Registration Summary
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Keep track of your confirmed event participation from this page.
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              Registered events:{" "}
              <span className="font-semibold text-slate-900">
                {events.length}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              Generate a printable pass or download a calendar file from any
              registration card.
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
