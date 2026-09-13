import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminSidebar, MobileMenuButton } from "@/components/admin/AdminSidebar";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <div className="bg-background min-h-screen">
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="px-4 py-6 lg:ml-60 lg:px-8">
        <div className="mb-4 lg:hidden">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
