import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  ["/dashboard", "Dashboard"],
  ["/events", "Events"],
  ["/registrations", "Registrations"],
  ["/events/create", "Create Event"],
  ["/resources", "Resources"],
  ["/notifications", "Notifications"],
];

export default function TopNav() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div>
          <NavLink
            to="/dashboard"
            className="font-heading text-2xl text-slate-900"
          >
            EVENTIQ
          </NavLink>
          <p className="text-xs text-slate-500">
            Smart Event and Resource Management
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 font-medium transition ${
                  isActive
                    ? "border border-blue-700 bg-blue-50 text-blue-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <div className="ml-2 hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 sm:block">
            {user?.email || "Unknown user"} ({user?.role || "participant"})
          </div>

          <button
            onClick={signOut}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
