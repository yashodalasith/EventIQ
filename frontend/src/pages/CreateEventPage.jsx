import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function CreateEventPage() {
  return (
    <section>
      <SectionHeader title="Launch Event" subtitle="Structured creation flow for organizers" />
      <GlassPanel className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="rounded-xl border border-base-line bg-base-bg/65 px-3 py-2" placeholder="Event title" />
          <input className="rounded-xl border border-base-line bg-base-bg/65 px-3 py-2" placeholder="Date & Time" />
          <textarea className="min-h-32 rounded-xl border border-base-line bg-base-bg/65 px-3 py-2 sm:col-span-2" placeholder="Description" />
        </div>
        <div className="mt-4">
          <NeonButton>Publish Event</NeonButton>
        </div>
      </GlassPanel>
    </section>
  );
}
