import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";

export default function NotificationsPage() {
  return (
    <section>
      <SectionHeader
        title="Notification Stream"
        subtitle="Emails, reminders, and service events"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <GlassPanel className="p-5 xl:col-span-3">
          <p className="font-heading text-sm tracking-[0.2em] text-accent-cyan">
            Latest Activity
          </p>
          <ul className="mt-3 space-y-2 text-sm text-base-text/80">
            <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">
              10:02 AM - Event registration confirmation sent to 42 participants
            </li>
            <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">
              09:49 AM - Resource allocation event consumed from Kafka topic
              resource-allocation
            </li>
            <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">
              09:30 AM - Reminder scheduler pushed pre-event email batch
            </li>
            <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">
              09:11 AM - Event-created stream triggered organizer summary mail
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel className="p-5 xl:col-span-2">
          <p className="font-heading text-sm tracking-[0.2em] text-accent-lime">
            Channels
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-base-line bg-base-bg/55 px-3 py-2">
              <span>Email</span>
              <span className="text-accent-cyan">Healthy</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-base-line bg-base-bg/55 px-3 py-2">
              <span>Kafka Consumer</span>
              <span className="text-accent-cyan">Running</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-base-line bg-base-bg/55 px-3 py-2">
              <span>Retry Queue</span>
              <span className="text-accent-amber">3 items</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
