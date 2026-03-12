import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function EventListPage() {
  return (
    <section>
      <SectionHeader title="Event Matrix" subtitle="Explore and manage all upcoming experiences" />
      <GlassPanel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-base-line/70 px-4 py-3">
          <p className="font-heading text-sm tracking-[0.2em] text-accent-lime">LIVE EVENT TABLE</p>
          <NeonButton>Create New Event</NeonButton>
        </div>
        <div className="space-y-3 p-4">
          {["Hackathon X", "AI Workshop", "Open Research Summit"].map((name, idx) => (
            <div key={name} className="rounded-xl border border-base-line bg-base-bg/55 p-3">
              <p className="font-semibold text-base-text">{name}</p>
              <p className="text-xs text-base-text/65">Slot #{idx + 1} ready for backend data binding</p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
