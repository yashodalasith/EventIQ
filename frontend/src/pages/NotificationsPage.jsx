import { useEffect, useMemo, useState } from "react";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";
import { createNotification, listNotifications } from "../lib/api";

const PREVIEW_NOTIFICATIONS = [
  {
    _id: "preview-1",
    recipient: "ops@eventiq.local",
    subject: "Organizer digest delivered",
    message:
      "The event-created stream produced a summary email for the product summit owners.",
    topic: "event-created",
    channel: "email",
    status: "sent",
    sourceService: "event-service",
    deliveryAttempts: 1,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "preview-2",
    recipient: "attendee@eventiq.local",
    subject: "Registration confirmation queued",
    message:
      "A registration workflow reached the notification service and is waiting on delivery.",
    topic: "event-registration",
    channel: "email",
    status: "queued",
    sourceService: "event-service",
    deliveryAttempts: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    _id: "preview-3",
    recipient: "system",
    subject: "Resource allocation event captured",
    message:
      "A resource-allocation event was stored without a matching recipient, so delivery was skipped safely.",
    topic: "resource-allocation",
    channel: "kafka",
    status: "skipped",
    sourceService: "resource-service",
    deliveryAttempts: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 57).toISOString(),
  },
];

const STATUS_OPTIONS = [
  "ALL",
  "sent",
  "queued",
  "failed",
  "skipped",
  "received",
  "pending",
];
const TOPIC_OPTIONS = [
  "ALL",
  "event-created",
  "event-registration",
  "resource-allocation",
  "manual",
];

const statusStyles = {
  sent: "bg-emerald-100 text-emerald-700",
  queued: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  received: "bg-sky-100 text-sky-700",
  skipped: "bg-slate-200 text-slate-700",
  failed: "bg-rose-100 text-rose-700",
};

const topicStyles = {
  "event-created": "bg-blue-100 text-blue-700",
  "event-registration": "bg-emerald-100 text-emerald-700",
  "resource-allocation": "bg-amber-100 text-amber-700",
  manual: "bg-violet-100 text-violet-700",
};

function formatTimestamp(value) {
  if (!value) {
    return "No timestamp";
  }

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function topicLabel(topic) {
  if (!topic) {
    return "Manual dispatch";
  }

  return topic
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    status: "ALL",
    topic: "ALL",
    search: "",
  });
  const [form, setForm] = useState({
    recipient: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const canManageNotifications =
    user?.role === "admin" || user?.role === "organizer";
  const previewMode = !token || !user;

  const apiFilters = useMemo(
    () => ({
      limit: 60,
      status: filters.status === "ALL" ? undefined : filters.status,
      topic: filters.topic === "ALL" ? undefined : filters.topic,
    }),
    [filters.status, filters.topic],
  );

  const loadNotifications = async () => {
    if (previewMode || !canManageNotifications) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await listNotifications(token, apiFilters);
      setNotifications(data || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token, previewMode, canManageNotifications, apiFilters]);

  const visibleNotifications = useMemo(() => {
    const source = previewMode ? PREVIEW_NOTIFICATIONS : notifications;
    const searchTerm = filters.search.trim().toLowerCase();

    if (!searchTerm) {
      return source;
    }

    return source.filter((notification) =>
      [
        notification.recipient,
        notification.subject,
        notification.message,
        notification.sourceService,
        notification.topic,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm)),
    );
  }, [filters.search, notifications, previewMode]);

  const metrics = useMemo(() => {
    const source = previewMode ? PREVIEW_NOTIFICATIONS : notifications;
    const total = source.length;
    const sent = source.filter((item) => item.status === "sent").length;
    const queued = source.filter((item) =>
      ["queued", "pending", "received"].includes(item.status),
    ).length;
    const failed = source.filter((item) => item.status === "failed").length;
    const uniqueRecipients = new Set(source.map((item) => item.recipient)).size;

    return { total, sent, queued, failed, uniqueRecipients };
  }, [notifications, previewMode]);

  const activeTopics = useMemo(() => {
    const source = previewMode ? PREVIEW_NOTIFICATIONS : notifications;
    return Array.from(new Set(source.map((item) => item.topic || "manual")));
  }, [notifications, previewMode]);

  const recentRecipients = useMemo(() => {
    const source = previewMode ? PREVIEW_NOTIFICATIONS : notifications;
    return Array.from(
      new Set(source.map((item) => item.recipient).filter(Boolean)),
    ).slice(0, 4);
  }, [notifications, previewMode]);

  const onFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "ALL", topic: "ALL", search: "" });
  };

  const onComposeChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setActionMessage("");

    try {
      await createNotification(token, form);
      setActionMessage(
        "Notification queued and delivered through the notification service.",
      );
      setForm({ recipient: "", subject: "", message: "" });
      await loadNotifications();
    } catch (err) {
      setError(err.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <section>
      <SectionHeader
        title="Notifications Center"
        subtitle="Track delivery health, inspect Kafka-driven messages, and send manual operational emails from one responsive workspace."
      />

      {previewMode ? (
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Preview mode is active because no authenticated organizer or admin
          session is loaded. The cards below use sample data so you can inspect
          the UI safely.
        </div>
      ) : null}

      {!previewMode && !canManageNotifications ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your current role does not have access to notification operations.
          Sign in as an organizer or admin to load notification history and send
          messages.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <GlassPanel className="overflow-hidden xl:col-span-8">
          <div className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-6 text-white sm:px-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Delivery Pulse
                </p>
                <h2 className="mt-2 font-heading text-2xl sm:text-3xl">
                  Communication operations that feel live, not bolted on.
                </h2>
                <p className="mt-3 text-sm text-slate-200">
                  Monitor sent, queued, skipped, and failed messages while
                  keeping manual outreach close to event workflows that trigger
                  them.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:w-auto xl:flex-shrink-0">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                    Total
                  </p>
                  <p className="mt-2 text-xl font-semibold sm:text-2xl">
                    {metrics.total}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                    Sent
                  </p>
                  <p className="mt-2 text-xl font-semibold sm:text-2xl">
                    {metrics.sent}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                    Queued
                  </p>
                  <p className="mt-2 text-xl font-semibold sm:text-2xl">
                    {metrics.queued}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                    Recipients
                  </p>
                  <p className="mt-2 text-xl font-semibold sm:text-2xl">
                    {metrics.uniqueRecipients}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Routing Coverage
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>Event created</span>
                  <span className="status-chip bg-blue-100 text-blue-700">
                    Organizer mail
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>Event registration</span>
                  <span className="status-chip bg-emerald-100 text-emerald-700">
                    Participant mail
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>Resource allocation</span>
                  <span className="status-chip bg-amber-100 text-amber-700">
                    Fallback path
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Recent Recipients
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {recentRecipients.length ? (
                  recentRecipients.map((recipient) => (
                    <span
                      key={recipient}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                    >
                      {recipient}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No recipients yet.</p>
                )}
              </div>
              <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">Delivery posture</p>
                <p className="mt-2 leading-6 text-slate-300">
                  {metrics.failed
                    ? `${metrics.failed} notifications need attention due to delivery failures.`
                    : "No failed deliveries in the current window."}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="grid gap-4 xl:col-span-4">
          <GlassPanel className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Active Topics
                </p>
                <h2 className="mt-2 font-heading text-2xl text-slate-900">
                  Stream coverage
                </h2>
              </div>
              <span className="status-chip bg-slate-100 text-slate-700">
                {activeTopics.length} sources
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeTopics.map((topic) => (
                <span
                  key={topic}
                  className={`status-chip ${topicStyles[topic] || "bg-slate-100 text-slate-700"}`}
                >
                  {topicLabel(topic)}
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 p-3">
                Manual sends use the same notification service and persistence
                layer as Kafka-driven workflows.
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                Filters target status and topic first, then client-side search
                narrows by recipient, subject, message, or source service.
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Manual Email
                </p>
                <h2 className="mt-2 font-heading text-2xl text-slate-900">
                  Compose notification
                </h2>
              </div>
              <span className="status-chip bg-blue-100 text-blue-700">
                {previewMode
                  ? "Preview"
                  : canManageNotifications
                    ? "Enabled"
                    : "Restricted"}
              </span>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <input
                className="focus-field"
                placeholder="Recipient email"
                value={form.recipient}
                onChange={(event) =>
                  onComposeChange("recipient", event.target.value)
                }
                disabled={previewMode || !canManageNotifications || sending}
              />
              <input
                className="focus-field"
                placeholder="Subject"
                value={form.subject}
                onChange={(event) =>
                  onComposeChange("subject", event.target.value)
                }
                disabled={previewMode || !canManageNotifications || sending}
              />
              <textarea
                className="focus-field min-h-32 resize-none"
                placeholder="Write a clear operational update or attendee communication"
                value={form.message}
                onChange={(event) =>
                  onComposeChange("message", event.target.value)
                }
                disabled={previewMode || !canManageNotifications || sending}
              />

              <NeonButton
                type="submit"
                className="w-full"
                disabled={
                  previewMode ||
                  !canManageNotifications ||
                  sending ||
                  !form.recipient ||
                  !form.subject ||
                  !form.message
                }
              >
                {sending ? "Sending..." : "Send Notification"}
              </NeonButton>
            </form>

            <p className="mt-3 text-sm text-slate-500">
              {previewMode
                ? "Sign in as an organizer or admin to enable manual delivery."
                : canManageNotifications
                  ? "Manual sends are stored in MongoDB with status, attempts, and provider metadata."
                  : "Manual delivery is limited to organizer and admin accounts."}
            </p>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Notification Log
            </p>
            <h2 className="mt-1 font-heading text-2xl text-slate-900">
              Recent delivery activity
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <select
              className="focus-field min-w-0"
              value={filters.status}
              onChange={(event) => onFilterChange("status", event.target.value)}
              disabled={!previewMode && !canManageNotifications}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </option>
              ))}
            </select>

            <select
              className="focus-field min-w-0"
              value={filters.topic}
              onChange={(event) => onFilterChange("topic", event.target.value)}
              disabled={!previewMode && !canManageNotifications}
            >
              {TOPIC_OPTIONS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic === "ALL" ? "All topics" : topicLabel(topic)}
                </option>
              ))}
            </select>

            <input
              className="focus-field min-w-0"
              placeholder="Search recipient or subject"
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
            />

            <div className="flex gap-2">
              <NeonButton
                variant="secondary"
                className="flex-1"
                onClick={clearFilters}
              >
                Clear
              </NeonButton>
              <NeonButton
                variant="secondary"
                className="flex-1"
                onClick={loadNotifications}
                disabled={loading || previewMode || !canManageNotifications}
              >
                Refresh
              </NeonButton>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-5 py-10 text-sm text-slate-500 sm:px-6">
              Loading notifications...
            </div>
          ) : null}

          {!loading && !visibleNotifications.length ? (
            <div className="px-5 py-10 text-sm text-slate-500 sm:px-6">
              No notifications matched the current filters.
            </div>
          ) : null}

          {!loading
            ? visibleNotifications.map((notification) => {
                const statusClass =
                  statusStyles[notification.status] ||
                  "bg-slate-100 text-slate-700";
                const topicClass =
                  topicStyles[notification.topic || "manual"] ||
                  "bg-slate-100 text-slate-700";

                return (
                  <article
                    key={
                      notification._id ||
                      notification.id ||
                      `${notification.recipient}-${notification.createdAt}`
                    }
                    className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`status-chip ${statusClass}`}>
                          {notification.status || "pending"}
                        </span>
                        <span className={`status-chip ${topicClass}`}>
                          {topicLabel(notification.topic || "manual")}
                        </span>
                        <span className="status-chip bg-slate-100 text-slate-700">
                          {notification.channel || "email"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-slate-900">
                        {notification.subject ||
                          topicLabel(notification.topic || "manual")}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {notification.message ||
                          "No message body stored for this notification."}
                      </p>

                      {notification.errorMessage ? (
                        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          {notification.errorMessage}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Recipient
                          </dt>
                          <dd className="mt-1 text-slate-900">
                            {notification.recipient || "system"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Source Service
                          </dt>
                          <dd className="mt-1 text-slate-900">
                            {notification.sourceService || "system"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Attempts
                          </dt>
                          <dd className="mt-1 text-slate-900">
                            {notification.deliveryAttempts || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Created
                          </dt>
                          <dd className="mt-1 text-slate-900">
                            {formatTimestamp(notification.createdAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      </GlassPanel>
    </section>
  );
}
