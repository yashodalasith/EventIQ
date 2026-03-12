import GlassPanel from "./GlassPanel";

export default function StatCard({ label, value, trend }) {
  return (
    <GlassPanel className="animate-reveal p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{trend}</p>
    </GlassPanel>
  );
}
