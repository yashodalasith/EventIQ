export default function GlassPanel({ className = "", children }) {
  return (
    <section
      className={`rounded-2xl border border-base-line/80 bg-base-card/60 backdrop-blur-md shadow-neon ${className}`}
    >
      {children}
    </section>
  );
}
