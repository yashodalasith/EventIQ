import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function RegistrationsPage() {
  return (
    <section>
      <SectionHeader
        title="My Registrations"
        subtitle="Track enrolled events and attendance states"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <GlassPanel className="p-5 xl:col-span-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["AI Workshop", "Confirmed", "Mar 22, 10:00 AM"],
              ["CloudOps Bootcamp", "Waitlist", "Mar 28, 09:30 AM"],
              ["Design Systems Forum", "Confirmed", "Apr 02, 02:00 PM"],
              ["Data Ethics Meetup", "Confirmed", "Apr 04, 05:30 PM"],
            ].map(([title, status, time]) => (
              <div
                key={title}
                className="rounded-xl border border-base-line bg-base-bg/55 p-3"
              >
                <p className="font-semibold text-base-text">{title}</p>
                <p className="mt-1 text-xs text-base-text/70">{time}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full border border-accent-cyan/50 bg-accent-cyan/10 px-2 py-1 text-xs text-accent-cyan">
                    {status}
                  </span>
                  <button className="text-xs font-semibold text-accent-lime">
                    View Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 xl:col-span-1">
          <p className="font-heading text-sm tracking-[0.2em] text-accent-amber">
            Attendance Tools
          </p>
          <p className="mt-2 text-sm text-base-text/75">
            Generate QR entry pass and sync reminders.
          </p>
          <div className="mt-4 space-y-2">
            <NeonButton className="w-full">Generate Pass</NeonButton>
            <NeonButton className="w-full border-accent-amber/70 bg-accent-amber/15 text-accent-amber">
              Sync Calendar
            </NeonButton>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
