import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";

export default function NotificationsPage() {
  return (
    <section>
      <SectionHeader title="Notification Stream" subtitle="Emails, reminders, and service events" />
      <GlassPanel className="p-5">
        <ul className="space-y-2 text-sm text-base-text/80">
          <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">Event registration confirmation queued</li>
          <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">Resource allocation event consumed from Kafka</li>
          <li className="rounded-lg border border-base-line bg-base-bg/60 p-3">Reminder scheduler active</li>
        </ul>
      </GlassPanel>
    </section>
  );
}
