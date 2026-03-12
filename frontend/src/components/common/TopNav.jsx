import { NavLink } from "react-router-dom";

const links = [
  ["/dashboard", "Dashboard"],
  ["/events", "Events"],
  ["/resources", "Resources"],
  ["/registrations", "Registrations"],
  ["/notifications", "Notifications"]
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-base-line/70 bg-base-bg/75 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NavLink to="/dashboard" className="font-heading text-lg tracking-[0.22em] text-accent-cyan">
          EVENTIQ
        </NavLink>

        <nav className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 transition ${
                  isActive
                    ? "border border-accent-lime/60 bg-accent-lime/15 text-accent-lime"
                    : "border border-base-line text-base-text/70 hover:border-accent-cyan/40 hover:text-accent-cyan"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
