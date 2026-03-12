export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6 animate-reveal">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
        EventIQ Platform
      </p>
      <h1 className="mt-2 font-heading text-3xl text-slate-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}
