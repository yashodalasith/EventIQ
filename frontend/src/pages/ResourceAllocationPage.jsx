import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function ResourceAllocationPage() {
  return (
    <section>
      <SectionHeader
        title="Resource Allocation"
        subtitle="Map rooms and equipment to event operations"
      />
      <GlassPanel className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="rounded-xl border border-base-line bg-base-bg/65 px-3 py-2" placeholder="Resource (Hall A)" />
          <input className="rounded-xl border border-base-line bg-base-bg/65 px-3 py-2" placeholder="Quantity" />
          <input className="rounded-xl border border-base-line bg-base-bg/65 px-3 py-2" placeholder="Event ID" />
        </div>
        <div className="mt-4">
          <NeonButton>Allocate Resource</NeonButton>
        </div>
      </GlassPanel>
    </section>
  );
}
