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
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-5">
        <GlassPanel className="p-5 2xl:col-span-3">
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
            <NeonButton>Allocate Resource</NeonButton>
            <NeonButton className="border-accent-amber/70 bg-accent-amber/15 text-accent-amber">
              Reserve
            </NeonButton>
          </div>
        </GlassPanel>

        <div className="grid gap-4 2xl:col-span-2">
          <GlassPanel className="p-4">
            <p className="font-heading text-sm tracking-[0.2em] text-accent-cyan">
              Inventory
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {[
                "Hall A - 1",
                "Projector - 7",
                "Laptop - 28",
                "Microphone - 11",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-base-line bg-base-bg/55 px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <p className="font-heading text-sm tracking-[0.2em] text-accent-lime">
              Pending Queue
            </p>
            <div className="mt-3 space-y-2 text-sm text-base-text/80">
              <div className="rounded-xl border border-base-line bg-base-bg/55 px-3 py-2">
                CloudOps Bootcamp requests 2 projectors
              </div>
              <div className="rounded-xl border border-base-line bg-base-bg/55 px-3 py-2">
                Research Summit requests Hall A extension
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}
