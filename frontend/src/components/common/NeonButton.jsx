export default function NeonButton({
  children,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`rounded-xl border border-accent-cyan/60 bg-accent-cyan/12 px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-accent-cyan transition duration-300 hover:-translate-y-0.5 hover:bg-accent-cyan/22 hover:shadow-neon ${className}`}
    >
      {children}
    </button>
  );
}
