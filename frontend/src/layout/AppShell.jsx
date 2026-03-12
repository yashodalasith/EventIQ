import { Outlet } from "react-router-dom";
import TopNav from "../components/common/TopNav";

export default function AppShell() {
  return (
    <div className="grid-lines min-h-screen">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
