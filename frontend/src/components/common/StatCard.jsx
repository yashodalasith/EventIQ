import GlassPanel from "./GlassPanel";

export default function StatCard({ label, value, trend }) {
  return (
    <GlassPanel className="p-4 animate-reveal">
      <p className="text-xs uppercase tracking-[0.24em] text-base-text/65">{label}</p>
      <p className="mt-2 font-heading text-2xl text-accent-cyan">{value}</p>
      <p className="mt-2 text-xs text-accent-amber">{trend}</p>
    </GlassPanel>
  );
}
