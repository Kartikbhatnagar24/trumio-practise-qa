import { Navigate, Outlet } from "react-router-dom";

import { Sidebar } from "@/components/common/sidebar/Sidebar";
import { paths } from "@/routes";
import { useAuthStore } from "@/stores/auth-store";

export function AppLayout() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to={paths.login} replace />;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
