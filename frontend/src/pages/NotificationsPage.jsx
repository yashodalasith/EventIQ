import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";

export default function NotificationsPage() {
  return (
    <section>
      <SectionHeader
        title="Notifications"
        subtitle="Current communication panel and service integration roadmap."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <GlassPanel className="p-5 lg:col-span-3">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
            Latest Activity
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              10:02 AM - Event registration confirmation sent to 42
              participants.
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              09:49 AM - Resource allocation event consumed from topic
              resource-allocation.
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              09:30 AM - Reminder scheduler pushed pre-event email batch.
            </li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              09:11 AM - Event-created stream triggered organizer summary email.
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel className="p-5 lg:col-span-2">
          <p className="font-heading text-2xl text-slate-900">Channels</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Email</span>
              <span className="status-chip bg-emerald-100 text-emerald-700">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Kafka Consumer</span>
              <span className="status-chip bg-emerald-100 text-emerald-700">
                Running
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Retry Queue</span>
              <span className="status-chip bg-amber-100 text-amber-700">
                3 items
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
