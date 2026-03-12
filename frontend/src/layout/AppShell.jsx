import { Outlet } from "react-router-dom";
import GlassPanel from "../components/common/GlassPanel";
import TopNav from "../components/common/TopNav";

export default function AppShell() {
  return (
    <div className="grid-lines min-h-screen">
      <TopNav />
      <main className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <Outlet />
        <aside className="hidden lg:block">
          <GlassPanel className="sticky top-24 p-5">
            <p className="font-heading text-sm tracking-[0.2em] text-accent-lime">
              SYSTEM PULSE
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
                <p className="text-base-text/70">Gateway</p>
                <p className="font-semibold text-accent-lime">Healthy</p>
              </div>
              <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
                <p className="text-base-text/70">Kafka Topics</p>
                <p className="font-semibold text-accent-cyan">3 Active</p>
              </div>
              <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
                <p className="text-base-text/70">Pending Alerts</p>
                <p className="font-semibold text-accent-amber">2 Medium</p>
              </div>
            </div>
          </GlassPanel>
        </aside>
      </main>
    </div>
  );
}
