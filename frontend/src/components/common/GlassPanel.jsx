export default function GlassPanel({ className = "", children }) {
  return <section className={`card ${className}`}>{children}</section>;
}
