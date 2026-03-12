import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
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
        <StatCard
          label="Resources Allocated"
          value="84"
          trend="94% utilization"
        />
        <StatCard label="Alerts" value="07" trend="2 need action" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <GlassPanel className="p-5 xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-heading text-lg text-accent-cyan">
              Live Operations Timeline
            </p>
            <NeonButton>Open Control Room</NeonButton>
          </div>
          <div className="mt-4 space-y-3">
            {[
              "09:10 AM - Organizer published AI Workshop",
              "09:24 AM - 64 participants registered in 10 minutes",
              "09:40 AM - Resource allocation queued for Hall A",
              "10:02 AM - Reminder notification batch dispatched",
            ].map((event) => (
              <div
                key={event}
                className="rounded-xl border border-base-line bg-base-bg/50 px-3 py-2 text-sm text-base-text/80"
              >
                {event}
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 xl:col-span-2">
          <p className="font-heading text-lg text-accent-lime">
            Service Health Matrix
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Auth Service", "99.99%", "text-accent-lime"],
              ["Event Service", "99.85%", "text-accent-cyan"],
              ["Resource Service", "99.62%", "text-accent-cyan"],
              ["Notification Service", "98.91%", "text-accent-amber"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-base-line bg-base-bg/50 px-3 py-2"
              >
                <span className="text-base-text/80">{label}</span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
