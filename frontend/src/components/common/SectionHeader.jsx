export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5 animate-reveal">
      <p className="font-heading text-xs uppercase tracking-[0.38em] text-accent-lime/90">EventIQ Platform</p>
      <h1 className="mt-1 font-heading text-2xl text-base-text sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-base-text/70">{subtitle}</p> : null}
    </div>
  );
}
