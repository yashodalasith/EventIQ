import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function EventListPage() {
  return (
    <section>
      <SectionHeader
        title="Event Matrix"
        subtitle="Explore and manage all upcoming experiences"
      />
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-5">
        <GlassPanel className="overflow-hidden 2xl:col-span-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-line/70 px-4 py-3">
            <p className="font-heading text-sm tracking-[0.2em] text-accent-lime">
              LIVE EVENT TABLE
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                className="focus-field min-w-44"
                placeholder="Search by title"
              />
              <select className="focus-field min-w-36">
                <option>All types</option>
                <option>Hackathon</option>
                <option>Workshop</option>
                <option>Conference</option>
              </select>
              <NeonButton>Create New Event</NeonButton>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Hackathon X", "Mar 22", "320 seats", "Registration Open"],
              ["AI Workshop", "Apr 02", "140 seats", "Early Bird"],
              ["Open Research Summit", "Apr 08", "500 seats", "Almost Full"],
              ["CloudOps Bootcamp", "Apr 13", "200 seats", "Pending Review"],
              [
                "Design Systems Forum",
                "Apr 18",
                "120 seats",
                "Registration Open",
              ],
              ["Data Ethics Meetup", "Apr 27", "90 seats", "Draft"],
            ].map(([name, date, capacity, status]) => (
              <div
                key={name}
                className="rounded-xl border border-base-line bg-base-bg/55 p-4"
              >
                <p className="font-semibold text-base-text">{name}</p>
                <p className="mt-1 text-xs text-base-text/65">
                  {date} • {capacity}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full border border-accent-cyan/50 bg-accent-cyan/10 px-2 py-1 text-xs text-accent-cyan">
                    {status}
                  </span>
                  <button className="text-xs font-semibold text-accent-lime">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 2xl:col-span-1">
          <p className="font-heading text-sm tracking-[0.2em] text-accent-amber">
            Insights
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
              <p className="text-base-text/70">Top Category</p>
              <p className="font-semibold text-accent-cyan">
                Technical Workshops
              </p>
            </div>
            <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
              <p className="text-base-text/70">Average Fill Rate</p>
              <p className="font-semibold text-accent-lime">82%</p>
            </div>
            <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
              <p className="text-base-text/70">Upcoming This Week</p>
              <p className="font-semibold text-accent-amber">4 events</p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}
