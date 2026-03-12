import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function ResourceAllocationPage() {
  return (
    <section>
      <SectionHeader
        title="Resource Allocation"
        subtitle="Resource module placeholder layout, ready for next service integration."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <GlassPanel className="p-5 xl:col-span-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="focus-field" placeholder="Resource (Hall A)" />
            <input className="focus-field" placeholder="Quantity" />
            <input className="focus-field" placeholder="Event ID" />
            <input className="focus-field" placeholder="Allocation Date" />
            <textarea
              className="focus-field min-h-24 sm:col-span-2"
              placeholder="Allocation notes"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <NeonButton variant="secondary">Allocate Resource</NeonButton>
            <NeonButton variant="secondary">
              Reserve
            </NeonButton>
          </div>
        </GlassPanel>

        <div className="grid gap-4 xl:col-span-2">
          <GlassPanel className="p-4">
            <p className="font-heading text-2xl text-slate-900">Inventory</p>
            <div className="mt-3 space-y-2 text-sm">
              {[
                "Hall A - 1",
                "Projector - 7",
                "Laptop - 28",
                "Microphone - 11",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <p className="font-heading text-2xl text-slate-900">Pending Queue</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                CloudOps Bootcamp requests 2 projectors
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                Research Summit requests Hall A extension
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}
