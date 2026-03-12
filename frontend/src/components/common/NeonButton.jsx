export default function NeonButton({
  children,
  className = "",
  type = "button",
  variant = "primary",
  disabled = false,
  ...props
}) {
  const variants = {
    primary: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
    secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      {...props}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
