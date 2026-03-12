import { NavLink } from "react-router-dom";
import { useState } from "react";
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
  const { user, signOut, signOutAll } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const profileSummary =
    user?.role === "admin"
      ? user?.profile?.department
      : user?.role === "organizer"
        ? user?.profile?.organization
        : user?.profile?.institution;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await signOutAll();
    } finally {
      setSigningOut(false);
    }
  };

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

        <nav className="flex flex-wrap items-center justify-end gap-2 text-xs sm:gap-3 sm:text-sm">
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

          <div className="ml-2 hidden min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 lg:block">
            <p className="font-semibold text-slate-800">
              {user?.name || "Unknown user"}
            </p>
            <p className="mt-1 truncate">{user?.email || "No email"}</p>
            <p className="mt-1 capitalize">
              {user?.role || "participant"}
              {profileSummary ? ` • ${profileSummary}` : ""}
            </p>
          </div>

          <button
            onClick={handleSignOutAll}
            disabled={signingOut}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign Out All
          </button>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-md border border-blue-700 bg-blue-700 px-3 py-1.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? "Signing out..." : "Logout"}
          </button>
        </nav>
      </div>
    </header>
  );
}
