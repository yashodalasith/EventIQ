import { Outlet } from "react-router-dom";
import TopNav from "../components/common/TopNav";

export default function AppShell() {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
