import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";
import StatCard from "../components/common/StatCard";

export default function DashboardPage() {
  return (
    <section>
      <SectionHeader
        title="Mission Control Dashboard"
        subtitle="Unified view of events, attendees, resources, and live notifications"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Events" value="18" trend="+4 this week" />
        <StatCard label="Registrations" value="1,240" trend="+12.6% growth" />
        <StatCard label="Resources Allocated" value="84" trend="94% utilization" />
        <StatCard label="Alerts" value="07" trend="2 need action" />
      </div>

      <GlassPanel className="mt-6 p-5">
        <p className="font-heading text-lg text-accent-cyan">Realtime Integration Surface</p>
        <p className="mt-2 text-sm text-base-text/75">
          Event streams from Kafka and service health metrics will render here in phase 2.
        </p>
      </GlassPanel>
    </section>
  );
}
