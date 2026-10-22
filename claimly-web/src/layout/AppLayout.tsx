import { Navigate, Outlet } from "react-router-dom";

import { Sidebar } from "@/components/common/sidebar/Sidebar";
import { paths } from "@/routes";
import { useAuthStore } from "@/stores/auth-store";

export function AppLayout() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to={paths.login} replace />;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("content")?.focus();
        }}
        className="sr-only z-50 rounded-[var(--radius-control)] bg-brand px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div id="content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        <Outlet />
      </div>
    </div>
  );
}
