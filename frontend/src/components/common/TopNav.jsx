import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const links = [
  ["/dashboard", "Dashboard"],
  ["/events", "Events"],
  ["/registrations", "Registrations"],
  ["/resources", "Resources"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

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
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 shadow-[0_10px_24px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:min-w-[180px] lg:w-auto">
          <NavLink
            to="/dashboard"
            className="font-heading text-2xl tracking-tight text-slate-900"
          >
            EVENTIQ
          </NavLink>
          <p className="text-xs text-slate-500">
            Smart Event and Resource Management
          </p>
        </div>

        <nav className="flex w-full flex-col gap-2 text-xs sm:text-sm lg:flex-1 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          <div className="grid w-full grid-cols-3 gap-1 rounded-xl border border-slate-200/90 bg-slate-50/85 p-1 sm:grid-cols-6 lg:flex lg:w-auto lg:flex-wrap lg:items-center lg:gap-2">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-2 py-2 text-center font-medium transition sm:px-3 sm:py-1.5 ${
                    isActive
                      ? "bg-white text-blue-700 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                      : "text-slate-700 hover:bg-white hover:text-slate-900"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `hidden min-w-[260px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition xl:flex ${
                isActive
                  ? "border-blue-200 bg-blue-50/80"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`
            }
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-semibold text-blue-700">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1 text-xs text-slate-600">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name || "Unknown user"}
              </p>
              <p className="truncate">{user?.email || "No email"}</p>
              <p className="mt-0.5 capitalize">
                {user?.role || "participant"}
                {profileSummary ? ` • ${profileSummary}` : ""}
              </p>
            </div>
          </NavLink>

          <div className="grid w-full grid-cols-2 gap-2 lg:w-auto lg:grid-cols-2">
            <button
              onClick={handleSignOutAll}
              disabled={signingOut}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign Out All
            </button>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
