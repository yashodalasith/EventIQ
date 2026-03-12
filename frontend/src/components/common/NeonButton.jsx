export default function NeonButton({ children, className = "", type = "button" }) {
  return (
    <button
      type={type}
      className={`rounded-xl border border-accent-cyan/60 bg-accent-cyan/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-accent-cyan transition duration-300 hover:bg-accent-cyan/20 hover:shadow-neon animate-pulseRing ${className}`}
    >
      {children}
    </button>
  );
}
