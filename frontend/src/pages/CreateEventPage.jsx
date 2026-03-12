import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function CreateEventPage() {
  return (
    <section>
      <SectionHeader
        title="Launch Event"
        subtitle="Structured creation flow for organizers"
      />
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <GlassPanel className="p-5 2xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="focus-field" placeholder="Event title" />
            <input className="focus-field" placeholder="Date & Time" />
            <input className="focus-field" placeholder="Venue / Online Link" />
            <select className="focus-field">
              <option>Event Type</option>
              <option>Hackathon</option>
              <option>Workshop</option>
              <option>Conference</option>
            </select>
            <input className="focus-field" placeholder="Capacity" />
            <input
              className="focus-field"
              placeholder="Registration Deadline"
            />
            <textarea
              className="focus-field min-h-32 sm:col-span-2"
              placeholder="Description"
            />
            <textarea
              className="focus-field min-h-24 sm:col-span-2"
              placeholder="Agenda highlights"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <NeonButton>Publish Event</NeonButton>
            <NeonButton className="border-accent-amber/70 bg-accent-amber/15 text-accent-amber">
              Save Draft
            </NeonButton>
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <p className="font-heading text-sm tracking-[0.2em] text-accent-lime">
            Launch Checklist
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              "Event details validated",
              "Organizer permission verified",
              "Resource requests submitted",
              "Email template selected",
              "Visibility and registration configured",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 rounded-xl border border-base-line bg-base-bg/55 p-2.5"
              >
                <input type="checkbox" className="accent-accent-cyan" />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-base-line bg-base-bg/55 p-3 text-sm text-base-text/80">
            <p className="font-semibold text-base-text">Preview Mode</p>
            <p className="mt-1">
              Participants will see this event on the public listing after
              publish.
            </p>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
